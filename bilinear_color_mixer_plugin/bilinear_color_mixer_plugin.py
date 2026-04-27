from krita import *
from PyQt5.QtWidgets import *
from PyQt5.QtGui import *
from PyQt5.QtCore import *

class BilinearMixerDock(DockWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Bilinear 2D Color Mixer")
        
        self.corners = {
            "tl": QColor(255, 100, 0), "tr": QColor(0, 150, 255),
            "bl": QColor(255, 255, 0), "br": QColor(0, 255, 100)
        }
        
        self.main_widget = QWidget(self)
        self.layout = QVBoxLayout(self.main_widget)

        # PREVIEW SCREEN
        self.preview_label = QLabel(self.main_widget)
        self.preview_label.setMinimumWidth(150) 
        self.preview_label.setScaledContents(True)
        self.preview_label.setStyleSheet("border: 2px solid #333; background-color: #111;")
        self.layout.addWidget(self.preview_label, 0, Qt.AlignCenter)

        # COLOR PICKERS
        controls_layout = QGridLayout()
        self.btn_tl = QPushButton("TL", self.main_widget)
        self.btn_tr = QPushButton("TR", self.main_widget)
        self.btn_bl = QPushButton("BL", self.main_widget)
        self.btn_br = QPushButton("BR", self.main_widget)
        
        controls_layout.addWidget(self.btn_tl, 0, 0)
        controls_layout.addWidget(self.btn_tr, 0, 1)
        controls_layout.addWidget(self.btn_bl, 1, 0)
        controls_layout.addWidget(self.btn_br, 1, 1)
        self.layout.addLayout(controls_layout)

        # APPLY BUTTON
        self.apply_btn = QPushButton("Apply to Canvas", self.main_widget)
        self.apply_btn.setMinimumHeight(40)
        self.layout.addWidget(self.apply_btn)

        self.setWidget(self.main_widget)

        # Connections
        self.btn_tl.clicked.connect(lambda: self.pick_color("tl"))
        self.btn_tr.clicked.connect(lambda: self.pick_color("tr"))
        self.btn_bl.clicked.connect(lambda: self.pick_color("bl"))
        self.btn_br.clicked.connect(lambda: self.pick_color("br"))
        self.apply_btn.clicked.connect(self.apply_to_canvas)

        self.update_preview()

    def pick_color(self, key):
        color = QColorDialog.getColor(self.corners[key])
        if color.isValid():
            self.corners[key] = color
            self.update_preview()

    def update_preview(self):
        doc = Krita.instance().activeDocument()
        
        # Calculate Aspect Ratio
        if doc:
            ratio = doc.height() / doc.width()
        else:
            ratio = 1.0 

        # Force the label to match the canvas aspect ratio based on its width
        label_width = self.preview_label.width() if self.preview_label.width() > 0 else 200
        self.preview_label.setFixedHeight(int(label_width * ratio))

        # Render preview image at 100px base for performance
        preview_w = 100
        preview_h = int(100 * ratio)
        img = QImage(preview_w, preview_h, QImage.Format_RGB32)
        
        for y in range(preview_h):
            for x in range(preview_w):
                u, v = x/(preview_w-1), y/(preview_h-1)
                
                # Bilinear formula: C = (1-u)(1-v)TL + u(1-v)TR + (1-u)vBL + uvBR
                r = (1-u)*(1-v)*self.corners['tl'].red() + u*(1-v)*self.corners['tr'].red() + \
                    (1-u)*v*self.corners['bl'].red() + u*v*self.corners['br'].red()
                g = (1-u)*(1-v)*self.corners['tl'].green() + u*(1-v)*self.corners['tr'].green() + \
                    (1-u)*v*self.corners['bl'].green() + u*v*self.corners['br'].green()
                b = (1-u)*(1-v)*self.corners['tl'].blue() + u*(1-v)*self.corners['tr'].blue() + \
                    (1-u)*v*self.corners['bl'].blue() + u*v*self.corners['br'].blue()
                
                img.setPixelColor(x, y, QColor(int(r), int(g), int(b)))
        
        self.preview_label.setPixmap(QPixmap.fromImage(img))

    def apply_to_canvas(self):
        doc = Krita.instance().activeDocument()
        if not doc or not doc.activeNode(): return
        
        w, h = doc.width(), doc.height()
        node = doc.activeNode()
        
        pixel_data = bytearray()
        for y in range(h):
            for x in range(w):
                u, v = x/(w-1) if w>1 else 0, y/(h-1) if h>1 else 0
                r = (1-u)*(1-v)*self.corners['tl'].red() + u*(1-v)*self.corners['tr'].red() + (1-u)*v*self.corners['bl'].red() + u*v*self.corners['br'].red()
                g = (1-u)*(1-v)*self.corners['tl'].green() + u*(1-v)*self.corners['tr'].green() + (1-u)*v*self.corners['bl'].green() + u*v*self.corners['br'].green()
                b = (1-u)*(1-v)*self.corners['tl'].blue() + u*(1-v)*self.corners['tr'].blue() + (1-u)*v*self.corners['bl'].blue() + u*v*self.corners['br'].blue()
                pixel_data.extend([int(b), int(g), int(r), 255])
        
        node.setPixelData(pixel_data, 0, 0, w, h)
        doc.refreshProjection()

    def canvasChanged(self, canvas):
        # Refresh preview ratio when user switches documents
        self.update_preview()

class BilinearExtension(Extension):
    def __init__(self, parent):
        super().__init__(parent)
    def setup(self):
        pass
    def createActions(self, window):
        pass

Krita.instance().addExtension(BilinearExtension(Krita.instance()))
Krita.instance().addDockWidgetFactory(DockWidgetFactory("bilinearMixer", DockWidgetFactoryBase.DockRight, BilinearMixerDock))