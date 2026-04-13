
export const fileMenuItems = [
    { label: 'New Project...', shortcut: 'Ctrl+Shift+N', action: () => console.log('New') },
    { label: 'Open Project...', shortcut: 'Ctrl+O' },
    { type: 'divider' },
    { label: 'Save', shortcut: 'Ctrl+S', action: () => console.log('Saved') },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => console.log('Saved As') },
    { type: 'divider' },
    { label: 'Exit', shortcut: 'Alt+F4', action: () => { window.Application.quitApp(); } }
    // ! We need to have a function here where we check if any data is not saved or something
];



// export const fileMenuItems = [
//     { label: 'New Project', shortcut: 'Ctrl+Shift+N', action: () => console.log('New') },
//     { label: 'Open Project', shortcut: 'Ctrl+O' },
//     { type: 'divider' },
//     {
//         label: 'Open Recent',
//         children: [
//             { label: 'project_krita_3d' },
//             { label: 'rulebook_ludo' },
//             {
//                 label: 'More...',
//                 children: [{ label: 'Clear History' }]
//             }
//         ]
//     },
//     { type: 'divider' },
//     { label: 'Exit', shortcut: 'Alt+F4', action: () => { window.Application.quitApp(); } }
//     // ! We need to have a function here where we check if any data is not saved or something
// ];