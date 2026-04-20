import { TitleBar } from "./components/TitleBar";
import { Workspace } from "./core/Workspace";
import "./css/App.css";
import "./css/ContextMenu.css";

function App() {

  return (
    <>
      <div className="app-container">
        <TitleBar />
        <Workspace />
      </div>
    </>
  )
}

export default App;
