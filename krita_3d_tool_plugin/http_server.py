import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from krita import Krita #type:ignore
from PyQt5.QtCore import QThread, pyqtSignal #type:ignore

class ServerThread(QThread):
    snapshot_received = pyqtSignal(str)
    heartbeat_received = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.request_export = False
        self.layer_payload = None 
        self.command = "none"
        self.canvas_res = {"width": 1920, "height": 1080} # Store safe data

    def trigger_export_request(self):
        self.canvas_res = {"width": w, "height": h} # Receive from main thread
        self.request_export = True
        
    def queue_layer_export(self, payload):
        self.layer_payload = payload
        self.command = "pull_layers"

    def run(self):
        class RequestHandler(BaseHTTPRequestHandler):
            thread = self
            
            def do_OPTIONS(self):
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()

          
            def do_GET(self):
                if self.path == '/resolution':
                    # Read the pre-cached resolution instead of calling Krita.instance()
                    res = self.thread.canvas_res
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(res).encode('utf-8'))
                    
                elif self.path == '/ping':
                    self.thread.heartbeat_received.emit()
                    
                    cmd = self.thread.command
                    if self.thread.request_export:
                        cmd = "export"
                        self.thread.request_export = False
                        
                    # Reset command state if it was consumed
                    if cmd != "none" and cmd != "export":
                        self.thread.command = "none"

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "connected", "command": cmd}).encode('utf-8'))

                # NEW: Endpoint to deliver the base64 layers
                elif self.path == '/layers':
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    if self.thread.layer_payload:
                        self.wfile.write(json.dumps(self.thread.layer_payload).encode('utf-8'))
                        self.thread.layer_payload = None
                    else:
                        self.wfile.write(b'[]')

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

                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(b'{"status": "ok"}')

        server_address = ('127.0.0.1', 5000)
        self.httpd = HTTPServer(server_address, RequestHandler)
        self.httpd.serve_forever()