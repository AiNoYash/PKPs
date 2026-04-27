# plugin/http_server.py
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from krita import Krita #type:ignore
from PyQt5.QtCore import QThread, pyqtSignal #type:ignore

class ServerThread(QThread):
    snapshot_received = pyqtSignal(str)
    heartbeat_received = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        # Shared state to track if Krita wants to pull a snapshot
        self.request_export = False 

    def trigger_export_request(self):
        self.request_export = True

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
                    doc = Krita.instance().activeDocument()
                    res = {"width": doc.width(), "height": doc.height()} if doc else {"width": 1920, "height": 1080}
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(res).encode('utf-8'))
                    
                elif self.path == '/ping':
                    self.thread.heartbeat_received.emit()
                    
                    # Check if the Krita user clicked the Import button
                    command = "none"
                    if self.thread.request_export:
                        command = "export"
                        self.thread.request_export = False # Reset flag after sending
                        
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    # Send the status AND the command to Electron
                    response_data = {"status": "connected", "command": command}
                    self.wfile.write(json.dumps(response_data).encode('utf-8'))

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