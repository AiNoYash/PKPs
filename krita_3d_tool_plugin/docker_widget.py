# plugin/docker_widget.py
import base64

from krita import Krita, DockWidget #type:ignore
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel #type:ignore
from PyQt5.QtGui import QImage #type:ignore

from .http_server import ServerThread

class ThreeDToolDocker(DockWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("3D Tool")
        
        mainWidget = QWidget(self)
        self.setWidget(mainWidget)
        layout = QVBoxLayout()
        mainWidget.setLayout(layout)
        
        self.label = QLabel("Awaiting connection on port 5000...", mainWidget)
        layout.addWidget(self.label)

        self.server_thread = ServerThread()
        self.server_thread.snapshot_received.connect(self.inject_snapshot_to_canvas)
        self.server_thread.start()

    def inject_snapshot_to_canvas(self, b64_str):
        doc = Krita.instance().activeDocument()
        if not doc:
            self.label.setText("Error: No active document open.")
            return

        try:
            image_data = base64.b64decode(b64_str)
            qimage = QImage()
            qimage.loadFromData(image_data)
            
            qimage = qimage.convertToFormat(QImage.Format_RGBA8888).rgbSwapped()

            layer = doc.createNode("3D Snapshot", "paintlayer")
            root = doc.rootNode()
            children = root.childNodes()
            
            # logic to move layer to bottom instead of defaulting to the top
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
            self.label.setText("High-Res Snapshot injected to bottom!")
        except Exception as e:
            self.label.setText(f"Failed to inject: {e}")

    def canvasChanged(self, canvas):
        pass