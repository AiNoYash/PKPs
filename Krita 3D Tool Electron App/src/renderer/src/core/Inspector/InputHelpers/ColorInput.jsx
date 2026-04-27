export const ColorInput = ({ label, value, onChange }) => {
    return (
        <div className="inspector-row">
            <span className="inspector-label">{label}</span>
            <div className="vector-input-group" style={{ paddingLeft: '6px', height: '24px', flex: 1, padding: '2px' }}>
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: 'none', 
                        padding: 0, 
                        cursor: 'pointer', 
                        backgroundColor: 'transparent' 
                    }}
                />
            </div>
        </div>
    );
};