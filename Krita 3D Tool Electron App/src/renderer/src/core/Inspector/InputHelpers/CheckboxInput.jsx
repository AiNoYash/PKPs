// Reusable checkbox input
export const CheckboxInput = ({ label, checked, onChange }) => {
    return (
        <div className="inspector-row">
            <span className="inspector-label" style={{ width: 'auto', flex: 1 }}>{label}</span>
            <div className="inspector-checkbox-container">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
            </div>
        </div>
    );
};