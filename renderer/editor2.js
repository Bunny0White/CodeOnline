// ====== Variables DOM ======
const tabButtons = document.querySelectorAll('#blocksTabs button');
const blocksList = document.getElementById('blocksList');
const canvasArea = document.getElementById('canvasArea');
const fileExplorer = document.getElementById('fileExplorer');
const projectTitle = document.getElementById('projectTitle');

const newFileBtn = document.getElementById('newFileBtn');
const newFolderBtn = document.getElementById('newFolderBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const deleteFileBtn = document.getElementById('deleteFileBtn');
const backHubBtn = document.getElementById('backHubBtn');

let projectPath = null;
let currentFilePath = null;
let blocksData = { headers: [], sections: [], footers: [] };

// ====== Initialisation ======
async function initEditor() {
    const params = new URLSearchParams(window.location.search);
    projectPath = params.get("path");

    if (!projectPath) return alert("Projet invalide");
    projectTitle.textContent = projectPath.split("\\").pop();

    blocksData = await window.electronAPI.getBlocks();
    renderBlocks('headers');

    const tree = await window.electronAPI.getProjectTree(projectPath);
    renderFileExplorer(tree);
}
initEditor();

// ====== File Explorer ======
function renderFileExplorer(tree, container = fileExplorer) {
    container.innerHTML = '';

    tree.forEach(item => {
        if (item.type === "file" && item.name === "Code_Online.config") return;

        const div = document.createElement('div');
        div.className = item.type === 'folder' ? 'folder-item' : 'file-item';
        div.textContent = item.name;

        if (item.type === 'folder') {
            div.onclick = () => {
                const sub = document.createElement('div');
                sub.className = 'subfolder';
                div.after(sub);
                renderFileExplorer(item.children, sub);
            };
        } else {
            div.onclick = async () => {
                if (!item.name.endsWith('.php') && !item.name.endsWith('.html')) return;

                fileExplorer.querySelectorAll('.file-item').forEach(f => f.classList.remove('active'));
                div.classList.add('active');
                currentFilePath = item.path;

                await loadFileToCanvas(currentFilePath);
            };
        }

        container.appendChild(div);
    });
}

// ====== Charger fichier avec respect de l'ordre ======
async function loadFileToCanvas(filePath) {
    const content = await window.electronAPI.readFile(filePath);

    canvasArea.innerHTML = '';
    canvasArea.classList.remove('empty');

    const blockRegex = /(<header[^>]*>[\s\S]*?<\/header>)|(<main[^>]*>[\s\S]*?<\/main>)|(<footer[^>]*>[\s\S]*?<\/footer>)/gi;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
        const html = match[0];
        let type, name, inner;

        if (html.startsWith("<header")) {
            type = "headers";
            name = "header";
            inner = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i)[1].trim();
        } else if (html.startsWith("<footer")) {
            type = "footers";
            name = "footer";
            inner = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i)[1].trim();
        } else if (html.startsWith("<main")) {
            type = "sections";
            inner = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)[1].trim();

            const sectionMatches = inner.match(/<section[^>]*>[\s\S]*?<\/section>/gi);
            if (sectionMatches && sectionMatches.length > 0) {
                sectionMatches.forEach((sec, i) => {
                    addBlockToCanvas({ name: `section-${i+1}`, content: sec, type });
                });
                continue;
            } else {
                name = "section-1";
            }
        }

        addBlockToCanvas({ name, content: inner, type });
    }

    if (canvasArea.children.length === 0 && content.trim()) {
        addBlockToCanvas({ name: "custom-body", content, type: "sections" });
    }

    if (canvasArea.children.length === 0) canvasArea.classList.add('empty');
}

// ====== Blocks Library ======
tabButtons.forEach(btn => {
    btn.onclick = () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderBlocks(btn.dataset.type);
    };
});

function renderBlocks(type) {
    blocksList.innerHTML = '';
    blocksData[type].forEach(blockName => {
        const div = document.createElement('div');
        div.className = 'block-item';
        div.draggable = true;
        div.innerHTML = `<strong>${blockName}</strong>`;

        div.ondblclick = async () => {
            const content = await window.electronAPI.loadBlock(type, blockName);
            addBlockToCanvas({ name: blockName, content, type });
        };

        div.ondragstart = (e) => {
            e.dataTransfer.setData('block', JSON.stringify({ name: blockName, type }));
        };

        blocksList.appendChild(div);
    });
}

// ====== Canvas & Drag/Drop ======
let draggedBlock = null;
canvasArea.addEventListener('dragstart', e => {
    if (e.target.classList.contains('canvas-block')) draggedBlock = e.target;
});
canvasArea.addEventListener('dragover', e => e.preventDefault());
canvasArea.addEventListener('drop', e => {
    e.preventDefault();
    if (!draggedBlock) {
        const data = JSON.parse(e.dataTransfer.getData('block'));
        addBlockToCanvas(data);
    } else {
        const target = e.target.closest('.canvas-block');
        if (target && target !== draggedBlock) canvasArea.insertBefore(draggedBlock, target.nextSibling);
    }
    draggedBlock = null;
});

// ====== Ajouter bloc au canvas ======
function addBlockToCanvas(block) {
    // Limite à 1 header / 1 footer
    if ((block.type === "headers" || block.type === "footers") &&
        [...canvasArea.children].some(b => b.dataset.type === block.type)) {
        return alert("Un seul header et un seul footer autorisé.");
    }

    canvasArea.classList.remove('empty');

    const blockEl = document.createElement('div');
    blockEl.className = 'canvas-block';
    blockEl.draggable = true;
    blockEl.dataset.type = block.type;
    blockEl.dataset.name = block.name;

    blockEl.innerHTML = `
        <div class="block-content">${block.content || ""}</div>
        <div class="block-controls">
            <button class="edit-block">✎</button>
            <button class="delete-block">✕</button>
        </div>
    `;

    // Éditeur de code
    blockEl.querySelector('.edit-block').onclick = () => editBlockCode(blockEl);

    blockEl.querySelector('.delete-block').onclick = () => {
        blockEl.remove();
        if (canvasArea.children.length === 0) canvasArea.classList.add('empty');
    };

    canvasArea.appendChild(blockEl);
}

// ====== Éditeur de code pour chaque bloc ======
function editBlockCode(blockEl) {
    const currentHTML = blockEl.querySelector('.block-content').innerHTML;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Éditer le bloc : ${blockEl.dataset.name}</h3>
            <textarea class="code-editor" style="width:100%;height:300px;">${currentHTML}</textarea>
            <div style="margin-top:10px;text-align:right;">
                <button class="save-modal">💾 Sauvegarder</button>
                <button class="close-modal">✕ Fermer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const textarea = modal.querySelector('.code-editor');

    modal.querySelector('.close-modal').onclick = () => modal.remove();
    modal.querySelector('.save-modal').onclick = () => {
        blockEl.querySelector('.block-content').innerHTML = textarea.value;
        modal.remove();
    };
}

// ====== File Actions ======
newFileBtn.onclick = addNewPHPFile;
newFolderBtn.onclick = addNewFolder;
deleteFileBtn.onclick = deleteSelectedFile;
backHubBtn.onclick = () => window.close();
saveFileBtn.onclick = saveCurrentFile;

async function addNewPHPFile() {
    const name = prompt("Nom de la page PHP :");
    if (!name) return;
    const fullPath = `${projectPath}\\${name}.php`;
    await window.electronAPI.createFile(fullPath);
    initEditor();
}

async function addNewFolder() {
    const name = prompt("Nom du dossier :");
    if (!name) return;
    const fullPath = `${projectPath}\\${name}`;
    await window.electronAPI.createFolder(fullPath);
    initEditor();
}

async function deleteSelectedFile() {
    if (!currentFilePath) return;
    if (!confirm("Supprimer ?")) return;
    await window.electronAPI.deleteFile(currentFilePath);
    currentFilePath = null;
    initEditor();
}

// ====== Sauvegarde complète ======
async function saveCurrentFile() {
    if (!currentFilePath) return alert("Aucun fichier ouvert");

    const headerContent = [...canvasArea.children]
        .filter(b => b.dataset.type === "headers")
        .map(b => b.querySelector('.block-content').innerHTML)
        .join("\n");

    const footerContent = [...canvasArea.children]
        .filter(b => b.dataset.type === "footers")
        .map(b => b.querySelector('.block-content').innerHTML)
        .join("\n");

    const sectionsContent = [...canvasArea.children]
        .filter(b => b.dataset.type === "sections")
        .map(b => b.querySelector('.block-content').innerHTML)
        .join("\n");

    const finalContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectTitle.textContent}</title>
</head>
<body>
<header>
${headerContent}
</header>
<main>
${sectionsContent}
</main>
<footer>
${footerContent}
</footer>
</body>
</html>`.trim();

    await window.electronAPI.saveFile(currentFilePath, finalContent);
    alert("Projet sauvegardé !");
}

// ====== Raccourcis clavier ======
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveCurrentFile(); }
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); addNewPHPFile(); }
    if (e.ctrlKey && e.shiftKey && e.key === 'N') { e.preventDefault(); addNewFolder(); }
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); deleteSelectedFile(); }
});
