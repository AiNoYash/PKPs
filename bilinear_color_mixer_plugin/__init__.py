# plugin/my_docker.py
from krita import Krita ,DockWidget, DockWidgetFactory, DockWidgetFactoryBase #type:ignore
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel #type:ignore


class BilinearColorMixerDocker(DockWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Bilinear Color Mixer")
        
        mainWidget = QWidget(self) # ? perameter self stating that this new Widget is child of This Docker
        
        self.setWidget(mainWidget)
        layout = QVBoxLayout()
        mainWidget.setLayout(layout)
        
        label = QLabel("Awaiting connection...", mainWidget)
        layout.addWidget(label)

    # Required method by Krita, triggered when switching tabs/canvases
    def canvasChanged(self, canvas):
        pass


DOCKER_ID = 'bilinear_color_mixer_docker'

# Register the docker with Krita
Krita.instance().addDockWidgetFactory( 
    DockWidgetFactory(DOCKER_ID, DockWidgetFactoryBase.DockRight, BilinearColorMixerDocker) 
) 