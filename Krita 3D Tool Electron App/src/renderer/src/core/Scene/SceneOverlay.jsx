import "./SceneOverlay.css"
import { HandIcon, ScaleIcon, RotateIcon, TranslateIcon } from "./SceneIcons"
import { useStore } from "../../context/useStore";
import { HandTools } from "../../_enums/HandToolsEnum";
import { Grid2x2Check } from "lucide-react";
import { AxisInput } from "../Inspector/InputHelpers/AxisInput";


export function SceneOverlay() {

    const selectedHandTool = useStore((state) => state.selectedHandTool);
    const selectHandTool = useStore((state) => state.selectHandTool);
    const isGridModeOn = useStore((state) => state.isGridModeOn);
    const setisGridModeOn = useStore((state) => state.setisGridModeOn);

    const gridX = useStore((state) => state.gridX);
    const gridY = useStore((state) => state.gridY);
    const gridZ = useStore((state) => state.gridZ);
    const setGridX = useStore((state) => state.setGridX);
    const setGridY = useStore((state) => state.setGridY);
    const setGridZ = useStore((state) => state.setGridZ);
 
    const handleAxisChange = (setter) => (e) => {
        const raw = e.target.value;
        // Allow free typing; only clamp on blur
        setter(raw);
    };
 
    const handleAxisBlur = (setter, value) => () => {
        const parsed = parseFloat(value);
        setter(isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(2)));
    };

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
            <div className="grid-button-container flex">
                <div className={`tools-svg-container ${isGridModeOn ? "active" : ""}`}
                    onClick={setisGridModeOn}
                >
                    <Grid2x2Check />
                </div>
                <div className={`vector-input ${isGridModeOn ? "" : "inactive"}`}>
                    {/* complete this part */}
                    <div className="axis-input-wrapper">
                        <span className="axis-label axis-label--x">X</span>
                        <input
                            className="axis-input"
                            type="number"
                            step="0.01"
                            value={gridX}
                            onChange={handleAxisChange(setGridX)}
                            onBlur={handleAxisBlur(setGridX, gridX)}
                        />
                    </div>
                    <div className="axis-input-wrapper">
                        <span className="axis-label axis-label--y">Y</span>
                        <input
                            className="axis-input"
                            type="number"
                            step="0.01"
                            value={gridY}
                            onChange={handleAxisChange(setGridY)}
                            onBlur={handleAxisBlur(setGridY, gridY)}
                        />
                    </div>
                    <div className="axis-input-wrapper">
                        <span className="axis-label axis-label--z">Z</span>
                        <input
                            className="axis-input"
                            type="number"
                            step="0.01"
                            value={gridZ}
                            onChange={handleAxisChange(setGridZ)}
                            onBlur={handleAxisBlur(setGridZ, gridZ)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}