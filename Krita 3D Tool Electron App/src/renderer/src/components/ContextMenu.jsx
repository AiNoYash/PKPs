import React, { useState, useRef, useEffect } from 'react';

export function ContextMenu({ items, x, y, closeMenu, isSubmenu = false }) {
    return (
        <div 
            className={`context-menu ${isSubmenu ? 'submenu' : ''}`}
            style={{ top: y, left: x }}
        >
            {items.map((item, index) => {
                if (item.type === 'divider') {
                    return <hr key={index} className="menu-divider" />;
                }

                return <MenuItem key={index} item={item} closeMenu={closeMenu} />;
            })}
        </div>
    );
}


function MenuItem({ item, closeMenu }) {
    const [showSubmenu, setShowSubmenu] = useState(false);
    const itemRef = useRef(null);

    const handleAction = (e) => {
        if (item.children) return; // Don't close if it's a parent list
        if (item.action) item.action();
        closeMenu();
    };

    // Calculate position for submenus (to the right of the current item)
    const submenuPos = itemRef.current ? {
        x: itemRef.current.offsetWidth,
        y: 0
    } : { x: 0, y: 0 };

    return (
        <div 
            ref={itemRef}
            className={`menu-item ${item.children ? 'has-children' : ''}`}
            onMouseEnter={() => setShowSubmenu(true)}
            onMouseLeave={() => setShowSubmenu(false)}
            onClick={handleAction}
        >
            <span className="menu-label">{item.label}</span>
            
            {item.shortcut && <span className="menu-shortcut">{item.shortcut}</span>}
            
            {item.children && <span className="menu-arrow">▶</span>}

            {showSubmenu && item.children && (
                <ContextMenu 
                    items={item.children} 
                    x={submenuPos.x} 
                    y={submenuPos.y} 
                    closeMenu={closeMenu}
                    isSubmenu={true}
                />
            )}
        </div>
    );
}