import { useEffect, useState } from "react";

// Reusable single-value number input (using the same anti-cursor-jump logic as Vector3Input)
export const NumberInput = ({ label, value, onChange }) => {
    const [localVal, setLocalVal] = useState(value !== null && value !== undefined ? value.toString() : "0");

    useEffect(() => {
        if (value === null || value === undefined) return;
        const parsedLocal = parseFloat(localVal);
        if (isNaN(parsedLocal) || Math.abs(parsedLocal - value) > 0.001) {
            setLocalVal(value.toString());
        }
    }, [value]);

    const handleChange = (e) => {
        const inputStr = e.target.value;
        setLocalVal(inputStr);

        const parsed = parseFloat(inputStr);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    };

    const handleBlur = () => {
        if (value !== null && value !== undefined) {
            setLocalVal(value.toString());
        }
    };

    return (
        <div className="inspector-row">
            <span className="inspector-label">{label}</span>
            <div className="vector-input-group" style={{ paddingLeft: '6px' }}>
                <input
                    type="text"
                    value={localVal}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
            </div>
        </div>
    );
};