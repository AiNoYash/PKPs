# plugin/my_docker.py
import json
import base64
from http.server import BaseHTTPRequestHandler, HTTPServer

from krita import Krita, DockWidget, DockWidgetFactory, DockWidgetFactoryBase #type:ignore
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel #type:ignore
from PyQt5.QtCore import QThread, pyqtSignal #type:ignore
from PyQt5.QtGui import QImage #type:ignore

# ---------------------------------------------------------
# Local HTTP Server to receive the image from Electron
# ---------------------------------------------------------
class ServerThread(QThread):
    # Define a signal that carries a string (the base64 image data)
    snapshot_received = pyqtSignal(str)

    def run(self):
        # We define the RequestHandler inside the run method to easily access 'self'
        class RequestHandler(BaseHTTPRequestHandler):
            thread = self
            
            def do_OPTIONS(self):
                # Handle CORS preflight requests from the Electron/React app
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()

            def do_POST(self):
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                try:
                    data = json.loads(post_data)
                    if 'image' in data:
                        # The string comes in as "data:image/png;base64,iVBORw0K..."
                        # We split it to only keep the raw base64 data
                        b64_str = data['image'].split(',')[1]
                        self.thread.snapshot_received.emit(b64_str)
                except Exception as e:
                    print(f"Error parsing incoming snapshot: {e}")

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"status": "ok"}')

        server_address = ('127.0.0.1', 5000)
        self.httpd = HTTPServer(server_address, RequestHandler)
        self.httpd.serve_forever()

# ---------------------------------------------------------
# Main Docker Widget
# ---------------------------------------------------------
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

        # Start the background server thread
        self.server_thread = ServerThread()
        # Connect the thread's signal to our handler function
        self.server_thread.snapshot_received.connect(self.inject_snapshot_to_canvas)
        self.server_thread.start()

    def inject_snapshot_to_canvas(self, b64_str):
        doc = Krita.instance().activeDocument()
        if not doc:
            self.label.setText("Error: No active document open.")
            return

        try:
            # Decode the base64 string
            image_data = base64.b64decode(b64_str)
            
            # Load bytes into a PyQt QImage
            qimage = QImage()
            qimage.loadFromData(image_data)
            
            # Krita expects 8-bit RGBA byte arrays
            qimage = qimage.convertToFormat(QImage.Format_RGBA8888)

            # Create a new paint layer
            layer = doc.createNode("3D Snapshot", "paintlayer")
            doc.rootNode().addChildNode(layer, None)

            # Extract memory pointer and set pixel data
            ptr = qimage.bits()
            ptr.setsize(qimage.byteCount())
            
            # setPixelData(bytearray, x, y, width, height)
            layer.setPixelData(bytearray(ptr), 0, 0, qimage.width(), qimage.height())
            
            # Tell Krita to refresh the canvas so the layer appears
            doc.refreshProjection()
            self.label.setText("Snapshot injected successfully!")
            
        except Exception as e:
            self.label.setText(f"Failed to inject snapshot: {e}")

    def canvasChanged(self, canvas):
        pass


DOCKER_ID = 'krita_3d_tool_docker'

# Register the docker with Krita
Krita.instance().addDockWidgetFactory( 
    DockWidgetFactory(DOCKER_ID, DockWidgetFactoryBase.DockRight, ThreeDToolDocker) 
)