import base64
from krita import Krita, DockWidget #type:ignore
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton, QDialog, QListWidget, QDialogButtonBox, QAbstractItemView #type:ignore
from PyQt5.QtGui import QImage #type:ignore
from PyQt5.QtCore import QTimer, Qt, QByteArray, QBuffer, QIODevice #type:ignore

from .http_server import ServerThread

# NEW: The Prompt Dialog for selecting layers
class LayerSelectionDialog(QDialog):
    def __init__(self, doc, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Select Layers to Export")
        self.setMinimumWidth(300)
        self.doc = doc
        
        layout = QVBoxLayout(self)
        self.list_widget = QListWidget()
        self.list_widget.setSelectionMode(QAbstractItemView.MultiSelection)
        
        # Populate with top level layers
        for node in doc.topLevelNodes():
            self.list_widget.addItem(node.name())
            
        layout.addWidget(self.list_widget)
        
        button_box = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)

    def get_selected_names(self):
        return [item.text() for item in self.list_widget.selectedItems()]


class ThreeDToolDocker(DockWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("3D Tool Bridge")
        
        mainWidget = QWidget(self)
        self.setWidget(mainWidget)
        layout = QVBoxLayout()
        mainWidget.setLayout(layout)
        
        self.status_label = QLabel("<b>Status:</b> <font color='orange'>Awaiting Connection...</font>", mainWidget)
        self.status_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.status_label)

        # Import Scene to Krita Button
        self.import_btn = QPushButton("Import Scene from 3D App", mainWidget)
        self.import_btn.clicked.connect(self.request_import)
        self.import_btn.setEnabled(False)
        self.import_btn.setMinimumHeight(30)
        layout.addWidget(self.import_btn)

        # NEW: Export Layers to App Button
        self.export_layers_btn = QPushButton("Export Layers to 3D App", mainWidget)
        self.export_layers_btn.clicked.connect(self.export_selected_layers)
        self.export_layers_btn.setEnabled(False)
        self.export_layers_btn.setMinimumHeight(30)
        layout.addWidget(self.export_layers_btn)

        self.feedback_label = QLabel("", mainWidget)
        self.feedback_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.feedback_label)

        self.server_thread = ServerThread()
        self.server_thread.snapshot_received.connect(self.inject_snapshot_to_canvas)
        self.server_thread.heartbeat_received.connect(self.on_heartbeat)
        self.server_thread.start()

        self.watchdog = QTimer(self)
        self.watchdog.timeout.connect(self.on_disconnect)
        self.watchdog.start(4000) 

    def on_heartbeat(self):
        self.status_label.setText("<b>Status:</b> <font color='green'>Connected to 3D App</font>")
        self.import_btn.setEnabled(True)
        self.export_layers_btn.setEnabled(True)
        self.watchdog.start(4000)

    def on_disconnect(self):
        self.status_label.setText("<b>Status:</b> <font color='red'>Disconnected (App Closed)</font>")
        self.import_btn.setEnabled(False)
        self.export_layers_btn.setEnabled(False)
        
    def request_import(self):
        # 1. Grab resolution safely on the main GUI thread
        doc = Krita.instance().activeDocument()
        w = doc.width() if doc else 1920
        h = doc.height() if doc else 1080
        
        # 2. Pass it into the thread
        self.server_thread.trigger_export_request(w, h)
        self.feedback_label.setText("<font color='orange'>Requesting 3D snapshot...</font>")

    # NEW: Logic for generating base64 layers
    def export_selected_layers(self):
        doc = Krita.instance().activeDocument()
        if not doc:
            self.feedback_label.setText("<font color='red'>Error: No active document.</font>")
            return
            
        dialog = LayerSelectionDialog(doc)
        if dialog.exec_():
            selected_names = dialog.get_selected_names()
            if not selected_names:
                return
                
            self.feedback_label.setText("<font color='orange'>Processing layers...</font>")
            payload = []
            
            for node in doc.topLevelNodes():
                if node.name() in selected_names:
                    w, h = doc.width(), doc.height()
                    pixel_data = node.pixelData(0, 0, w, h)
                    if not pixel_data:
                        continue
                    
                    # Convert BGRA bytes to standard RGBA QImage
                    qimage = QImage(pixel_data, w, h, QImage.Format_RGBA8888).rgbSwapped()
                    
                    # Encode directly to base64 buffer in memory
                    ba = QByteArray()
                    buffer = QBuffer(ba)
                    buffer.open(QIODevice.WriteOnly)
                    qimage.save(buffer, "PNG")
                    b64_str = ba.toBase64().data().decode("utf-8")
                    
                    payload.append({
                        "name": node.name(),
                        "width": w,
                        "height": h,
                        "image": "data:image/png;base64," + b64_str
                    })
                    
            self.server_thread.queue_layer_export(payload)
            self.feedback_label.setText(f"<font color='green'>Queued {len(payload)} layers for Electron!</font>")

    def inject_snapshot_to_canvas(self, b64_str):
        doc = Krita.instance().activeDocument()
        if not doc:
            self.feedback_label.setText("<font color='red'>Error: No active document.</font>")
            return

        try:
            image_data = base64.b64decode(b64_str)
            qimage = QImage()
            qimage.loadFromData(image_data)
            qimage = qimage.convertToFormat(QImage.Format_RGBA8888).rgbSwapped()

            layer = doc.createNode("3D Snapshot", "paintlayer")
            root = doc.rootNode()
            children = root.childNodes()
            
            if children:
                bottom_layer = children[0] 
                root.addChildNode(layer, bottom_layer) 
                root.addChildNode(bottom_layer, layer) 
            else:
                root.addChildNode(layer, None)

            ptr = qimage.bits()
            ptr.setsize(qimage.byteCount())
            layer.setPixelData(bytearray(ptr), 0, 0, qimage.width(), qimage.height())
            
            doc.refreshProjection()
            self.feedback_label.setText("<font color='green'>Snapshot injected!</font>")
        except Exception as e:
            self.feedback_label.setText(f"<font color='red'>Failed to inject: {e}</font>")

    def canvasChanged(self, canvas):
        pass