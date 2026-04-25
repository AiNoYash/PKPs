import "./SceneOverlay.css"
import { HandIcon, ScaleIcon, RotateIcon, TranslateIcon } from "./SceneIcons"
import { useStore } from "../../context/useStore";
import { HandTools } from "../../_enums/HandToolsEnum";


export function SceneOverlay() {

    const selectedHandTool = useStore((state) => state.selectedHandTool);
    const selectHandTool = useStore((state) => state.selectHandTool);


    return (
        <>
            <div className="hand-tools-container">
                <div className={`tools-svg-container ${selectedHandTool === HandTools.PAN ? "active" : ""}`}
                    onClick={() => {
                        selectHandTool(HandTools.PAN);
                    }}>
                    <HandIcon />
                </div>
                <div className={`tools-svg-container ${selectedHandTool === HandTools.TRANSLATE ? "active" : ""}`}
                    onClick={() => {
                        selectHandTool(HandTools.TRANSLATE);
                    }}>
                    <TranslateIcon />
                </div>
                <div className={`tools-svg-container ${selectedHandTool === HandTools.ROTATE ? "active" : ""}`}
                    onClick={() => {
                        selectHandTool(HandTools.ROTATE);
                    }}>
                    <RotateIcon />
                </div>
                <div className={`tools-svg-container ${selectedHandTool === HandTools.SCALE ? "active" : ""}`}
                    onClick={() => {
                        selectHandTool(HandTools.SCALE);
                    }}>
                    <ScaleIcon />
                </div>
            </div>
        </>
    );
}