const canvasArea = document.getElementById('canvasArea');
const projectTitle = document.getElementById('projectTitle');

let projectPath = null;
let currentFilePath = null;
let blocksData = { headers: [], sections: [], footers: [] };

(async function initEditor() {
    const params = new URLSearchParams(location.search);
    projectPath = params.get("path");

    if (!projectPath) return alert("Projet invalide");

    projectTitle.textContent = projectPath.split("\\").pop();

    blocksData = await window.electronAPI.getBlocks();
    renderBlocks("headers");

    const tree = await window.electronAPI.getProjectTree(projectPath);
    renderFileExplorer(tree);
})();
