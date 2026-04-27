import { useEffect, useState } from "react";

// Sub-component to manage the local typing state of a single input
export const AxisInput = ({ axis, colorClass, value, onChange }) => {
    const [localVal, setLocalVal] = useState(value.toFixed(2));

    // Sync local state if the external value changes significantly (e.g., undo/redo or clicking a new object)
    useEffect(() => {
        const parsedLocal = parseFloat(localVal);
        // Only override the user's typing if the true value is mathematically different
        if (isNaN(parsedLocal) || Math.abs(parsedLocal - value) > 0.001) {
            setLocalVal(value.toFixed(2));
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
        // Snap back to a clean 2-decimal format when they click away
        setLocalVal(value.toFixed(2));
    };

    return (
        <div className="vector-input-group">
            <span className={`axis-label ${colorClass}`}>{axis}</span>
            <input
                type="text"
                value={localVal}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </div>
    );
};
