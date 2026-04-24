import React, { useState, useEffect } from 'react';
import { Scene } from './Scene';
import { Hierarchy } from './Hierarchy';
import { Inspector } from './Inspector';
import { Project } from './Project';
import { Layout, Model } from 'flexlayout-react';
import '../css/FlexLayout.css';
import "../css/Docker.css";

const initialLayout = {
    global: {
        rootOrientationVertical: true, // <-- ADD THIS: Makes the root row stack top/bottom
        tabSetTabStripHeight: 28,
        splitterSize: 4,
        tabEnableClose: false,
        tabEnableRename: false,
        tabSetEnableMaximize: true,
        tabEnableDrag: true,
        tabSetMinWidth: 100,
        tabSetMinHeight: 100,
        borderBarSize: 24
    },
    borders: [],
    layout: {
        type: "row",
        weight: 100,
        children: [
            {
                type: "row",
                weight: 75,
                children: [
                    {
                        type: "tabset",
                        weight: 25,
                        children: [{ type: "tab", name: "Hierarchy", component: "hierarchy" }]
                    },
                    {
                        type: "tabset",
                        weight: 50,
                        children: [{ type: "tab", name: "Scene", component: "scene" }]
                    },
                    {
                        type: "tabset",
                        weight: 25,
                        children: [{ type: "tab", name: "Inspector", component: "inspector" }]
                    }
                ]
            },
            {

                type: "tabset",
                weight: 30,
                children: [{ type: "tab", name: "Project", component: "project" }]
            }
        ]
    }
};


export function Workspace() {
    const [model, setModel] = useState(() => Model.fromJson(initialLayout));

    useEffect(() => {
        const loadLayout = async () => {
            const savedLayout = await Application.storeGet("saved-workspace-layout");

            if (savedLayout) {
                try {
                    setModel(Model.fromJson(savedLayout));
                } catch (error) {
                    console.error("Failed to parse layout, keeping default.");
                }
            }
        };
        loadLayout();
    }, []);


    const factory = (node) => {
        const component = node.getComponent();

        if (component === "hierarchy") return <Hierarchy />;
        if (component === "scene") return <Scene />;
        if (component === "inspector") return <Inspector />;
        if (component === "project") return <Project />;

        return null;
    };

    const handleModelChange = (newModel) => {
        const layoutJson = newModel.toJson();
        Application.storeSet('saved-workspace-layout', layoutJson);
    };

    return (
        <div style={{ position: 'relative', flexGrow: 1, width: '100%', overflow: 'hidden' }}>
            <Layout model={model} factory={factory} onModelChange={handleModelChange} />
        </div>
    );
}