from krita import Krita, DockWidgetFactory, DockWidgetFactoryBase #type:ignore
from .docker_widget import ThreeDToolDocker

DOCKER_ID = 'krita_3d_tool_docker'

Krita.instance().addDockWidgetFactory(
    DockWidgetFactory(DOCKER_ID, DockWidgetFactoryBase.DockRight, ThreeDToolDocker)
)