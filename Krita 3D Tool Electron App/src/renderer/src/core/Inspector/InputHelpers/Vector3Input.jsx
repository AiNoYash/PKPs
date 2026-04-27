
const RadToDeg = 180 / Math.PI;
const DegToRad = Math.PI / 180;
import { AxisInput } from "./AxisInput";

export const Vector3Input = ({ label, value, onChange, isRotation = false }) => {
    // Convert current radians to degrees for the UI if necessary
    const displayValue = {
        x: isRotation ? value.x * RadToDeg : value.x,
        y: isRotation ? value.y * RadToDeg : value.y,
        z: isRotation ? value.z * RadToDeg : value.z,
    };

    const handleAxisChange = (axis, newVal) => {
        // Convert back to radians for Three.js/Zustand if necessary
        const finalVal = isRotation ? newVal * DegToRad : newVal;
        onChange({ [axis]: finalVal });
    };

    return (
        <div className="inspector-row">
            <span className="inspector-label">{label}</span>
            <div className="inspector-vector3">
                <AxisInput axis="X" colorClass="x-axis" value={displayValue.x} onChange={(v) => handleAxisChange('x', v)} />
                <AxisInput axis="Y" colorClass="y-axis" value={displayValue.y} onChange={(v) => handleAxisChange('y', v)} />
                <AxisInput axis="Z" colorClass="z-axis" value={displayValue.z} onChange={(v) => handleAxisChange('z', v)} />
            </div>
        </div>
    );
};