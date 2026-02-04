// ==========================================
// /renderer/editor.js
// ==========================================

// --- Variables globales accessibles ---
window.editor = {
    canvasArea: document.getElementById('canvasArea'),
    blocksList: document.getElementById('blocksList'),
    tabButtons: document.querySelectorAll('#blocksTabs button'),
    fileExplorer: document.getElementById('fileExplorer'),
    projectTitle: document.getElementById('projectTitle'),
    newFileBtn: document.getElementById('newFileBtn'),
    newFolderBtn: document.getElementById('newFolderBtn'),
    saveFileBtn: document.getElementById('saveFileBtn'),
    deleteFileBtn: document.getElementById('deleteFileBtn'),
    backHubBtn: document.getElementById('backHubBtn'),
};

// --- Chargement des scripts système ---
const systemScripts = [
    '../system_script/editor.core.js',
    '../system_script/editor.blocks.js',
    '../system_script/editor.files.js',
    '../system_script/editor.shortcuts.js'
];

systemScripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
});

// --- Initialisation ---
window.addEventListener('DOMContentLoaded', () => {
    if (typeof initEditor === 'function') initEditor();
});
