import { TitleBar } from "./components/TitleBar";
import { Workspace } from "./core/Workspace";
import "./css/App.css";
import "./css/ContextMenu.css";
import { useStore } from "./context/useStore";
import { ContextMenu } from "./components/ContextMenu";

function App() {

  const activeMenu = useStore(state => state.activeMenu);
  const setActiveMenu = useStore(state => state.setActiveMenu);


  return (
    <>
      <div className="app-container">
        <TitleBar />
        <Workspace />


        {activeMenu && (
          <>
            {/* ? This is going to be inside of the whole page and when it is clicked we will use it to remove out context menu */}
            <div className="menu-overlay" onClick={() => setActiveMenu(null)} />
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
