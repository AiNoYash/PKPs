import { TitleBar } from "./components/TitleBar";
import { Workspace } from "./core/Workspace";
import "./css/App.css";
import "./css/ContextMenu.css";
import { useStore } from "./context/useStore";
import { ContextMenu } from "./components/ContextMenu";
import { useEffect } from "react";

function App() {

  const activeMenu = useStore(state => state.activeMenu);
  const setActiveMenu = useStore(state => state.setActiveMenu);

  const setTitlebarPadding = (state) => {
    if (window.Application.system !== "darwin") return;
    const padding = state === 'fullscreen' ? '0px' : '70px';
    document.documentElement.style.setProperty('--os-based-titlebar-padding-left', padding);
  };

  useEffect(() => {
    if (window.Application.system !== "darwin") return;

    // Set initial state
    window.electronAPI.getWindowState().then(setTitlebarPadding);

    // Listen for changes and grab the cleanup fn
    const cleanup = window.electronAPI.onWindowStateChange(setTitlebarPadding);

    return cleanup;
  }, []); // ← empty deps, runs once on mount

  return (
    <>
      <div className="app-container">
        <TitleBar />
        <Workspace />


        {activeMenu && (
          <>
            {/* ? This is going to be inside of the whole page and when it is clicked we will use it to remove out context menu */}
            <div className="menu-overlay" onClick={(e) => setActiveMenu(null)} onContextMenu={(e) => { setActiveMenu(null) }} />
            {/* Really cool this that since menu-overlay and context-menu are actually sibling of each other the event bubbling is not happening in both */}
            <ContextMenu
              items={activeMenu.items}
              x={activeMenu.x}
              y={activeMenu.y}
              closeMenu={() => setActiveMenu(null)}
            />
          </>
        )}
      </div>
    </>
  )
}

export default App;
