import React, { useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { fileMenuItems } from './menus/ToolbarMenus';
import { useStore } from '../context/useStore';

export function TitleBar() {

    const activeMenu = useStore((state) => state.activeMenu);
    const setActiveMenu = useStore((state) => state.setActiveMenu);

    return (
        <div className="title-bar">
            <img className='logo' src="/logo.png" />
            <div className="controls">
                <button className={(activeMenu !== null && activeMenu.items === fileMenuItems) ? "active" : ""} onClick={(e) => setActiveMenu({ items: fileMenuItems, x: e.target.offsetLeft, y: 33 })}>
                    File
                </button>
                <button>Edit</button>
            </div>
        </div>
    );
}