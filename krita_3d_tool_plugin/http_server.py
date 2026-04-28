import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from krita import Krita #type:ignore
from PyQt5.QtCore import QThread, pyqtSignal #type:ignore

# NEW: This completely prevents the "Port already in use" connection failures
class KritaHTTPServer(HTTPServer):
    allow_reuse_address = True 

class ServerThread(QThread):
    snapshot_received = pyqtSignal(str)
    heartbeat_received = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.request_export = False
        self.layer_payload = None 
        self.command = "none"

    def trigger_export_request(self):
        self.request_export = True
        
    def queue_layer_export(self, payload):
        self.layer_payload = payload
        self.command = "pull_layers"

    def run(self):
        class RequestHandler(BaseHTTPRequestHandler):
            thread = self
            
            # Optional: Add this to stop HTTP requests from spamming your terminal logs
            def log_message(self, format, *args):
                pass 
            
            def do_OPTIONS(self):
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()

            def do_GET(self):
                if self.path == '/resolution':
                    # REPAIRED: Reverted to the stable API call and properly defined response_bytes
                    doc = Krita.instance().activeDocument()
                    res = {"width": doc.width(), "height": doc.height()} if doc else {"width": 1920, "height": 1080}
                    response_bytes = json.dumps(res).encode('utf-8')
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(response_bytes))) 
                    self.end_headers()
                    self.wfile.write(response_bytes)
                    
                elif self.path == '/ping':
                    self.thread.heartbeat_received.emit()
                    
                    cmd = self.thread.command
                    if self.thread.request_export:
                        cmd = "export"
                        self.thread.request_export = False
                        
                    if cmd != "none" and cmd != "export":
                        self.thread.command = "none"

                    response_bytes = json.dumps({"status": "connected", "command": cmd}).encode('utf-8')
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(response_bytes))) 
                    self.end_headers()
                    self.wfile.write(response_bytes)

                elif self.path == '/layers':
                    response_bytes = b'[]'
                    if self.thread.layer_payload:
                        response_bytes = json.dumps(self.thread.layer_payload).encode('utf-8')
                        self.thread.layer_payload = None

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(response_bytes))) 
                    self.end_headers()
                    self.wfile.write(response_bytes)

            def do_POST(self):
                if self.path == '/snapshot':
                    content_length = int(self.headers['Content-Length'])
                    post_data = self.rfile.read(content_length)
                    try:
                        data = json.loads(post_data)
                        if 'image' in data:
                            b64_str = data['image'].split(',')[1]
                            self.thread.snapshot_received.emit(b64_str)
                    except Exception as e:
                        print(f"Error parsing incoming snapshot: {e}")

                    response_bytes = b'{"status": "ok"}'
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Length', str(len(response_bytes))) 
                    self.end_headers()
                    self.wfile.write(response_bytes)
                    
        server_address = ('127.0.0.1', 5000)
        # REPAIRED: Using the new class that forces port binding
        self.httpd = KritaHTTPServer(server_address, RequestHandler)
        self.httpd.serve_forever()