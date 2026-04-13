# plugin/my_docker.py
from krita import Krita, DockWidget, DockWidgetFactory, DockWidgetFactoryBase #type:ignore
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel #type:ignore


class ThreeDToolDocker(DockWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("3D Tool")
        
        mainWidget = QWidget(self) # ? Stating that this new Widget is child of This Docker
        
        self.setWidget(mainWidget)
        layout = QVBoxLayout()
        mainWidget.setLayout(layout)
        
        label = QLabel("Awaiting connection...", mainWidget)
        layout.addWidget(label)

    # Required method by Krita, triggered when switching tabs/canvases
    def canvasChanged(self, canvas):
        pass


DOCKER_ID = 'krita_3d_tool_docker'

# Register the docker with Krita
Krita.instance().addDockWidgetFactory( 
    DockWidgetFactory(DOCKER_ID, DockWidgetFactoryBase.DockRight, ThreeDToolDocker) 
) 