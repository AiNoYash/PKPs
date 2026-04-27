# plugin/docker_widget.py
import base64
from krita import Krita, DockWidget #type:ignore
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton #type:ignore
from PyQt5.QtGui import QImage #type:ignore
from PyQt5.QtCore import QTimer, Qt #type:ignore

from .http_server import ServerThread

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

        # NEW: The Import Button inside Krita
        self.import_btn = QPushButton("Import from 3D App", mainWidget)
        self.import_btn.clicked.connect(self.request_import)
        self.import_btn.setEnabled(False) # Disabled by default until connected
        # Tweak button height to look nice in Krita
        self.import_btn.setMinimumHeight(30)
        layout.addWidget(self.import_btn)

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
        self.import_btn.setEnabled(True) # Enable button when alive
        self.watchdog.start(4000)

    def on_disconnect(self):
        self.status_label.setText("<b>Status:</b> <font color='red'>Disconnected (App Closed)</font>")
        self.import_btn.setEnabled(False) # Disable button when dead
        
    # NEW: Trigger the server thread to queue a command
    def request_import(self):
        self.server_thread.trigger_export_request()
        self.feedback_label.setText("<font color='orange'>Requesting snapshot...</font>")

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