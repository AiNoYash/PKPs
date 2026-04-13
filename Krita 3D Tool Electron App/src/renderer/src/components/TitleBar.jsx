import React, { useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { fileMenuItems } from './menus/ToolbarMenus';

export function TitleBar() {
    const [activeMenu, setActiveMenu] = useState(null);

    return (
        <div className="title-bar">
            <div className="controls">
                <button className={(activeMenu !== null && activeMenu.items === fileMenuItems) ? "active" : ""} onClick={(e) => setActiveMenu({ items: fileMenuItems, x: e.target.offsetLeft, y: 33 })}>
                    File
                </button>
                <button>Edit</button>
            </div>

            {activeMenu && (
                <>
                    {/* ? This is going to be inside of the whole page and when it is clicked we will use it to remove out context menu */}
                    <div className="menu-overlay" onClick={() => setActiveMenu(null)} />
                    <ContextMenu
                        items={activeMenu.items}
                        x={activeMenu.x}
                        y={activeMenu.y}
                        closeMenu={() => setActiveMenu(null)}
                    />
                </>
            )}
        </div>
    );
}