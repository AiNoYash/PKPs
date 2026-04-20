import React, { createContext, useState, useContext } from 'react';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {


    return (
        <ProjectContext.Provider >
            {children}
        </ProjectContext.Provider>
    );
}

export const useProject = () => useContext(ProjectContext);