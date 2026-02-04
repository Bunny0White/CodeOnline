// ==========================================
// /system_script/editor.files.js
// ==========================================

window.editor = {
    projectPath: null,
    currentFilePath: null,
    canvasArea: document.getElementById('canvasArea'),
    fileExplorer: document.getElementById('fileExplorer'),
    projectTitle: document.getElementById('projectTitle'),
};

// ====== Init ======
async function initEditor() {
    const params = new URLSearchParams(window.location.search);
    editor.projectPath = params.get('path');
    if (!editor.projectPath) return alert("Projet invalide");

    editor.projectTitle.textContent =
        editor.projectPath.split(/[\\/]/).pop();

    const tree = await window.electronAPI.getProjectTree(editor.projectPath);
    renderFileExplorer(tree);
}

// ====== Explorer ======
function renderFileExplorer(tree, container = editor.fileExplorer) {
    container.innerHTML = '';

    tree.forEach(item => {
        if (item.name === 'Code_Online.config') return;

        const el = document.createElement('div');
        el.className = item.type === 'folder' ? 'folder-item' : 'file-item';
        el.textContent = item.name;
        el.dataset.path = item.path;

        if (item.type === 'folder') {
            el.onclick = () => {
                const sub = document.createElement('div');
                sub.className = 'subfolder';
                el.after(sub);
                renderFileExplorer(item.children, sub);
            };
        } else {
            el.ondblclick = () => loadFileForEditing(item.path);
        }

        container.appendChild(el);
    });
}

// ====== Charger fichier ======
async function loadFileForEditing(filePath) {
    if (!filePath.endsWith('.html') && !filePath.endsWith('.php')) {
        alert("Type de fichier non supporté");
        return;
    }

    const content = await window.electronAPI.readFile(filePath);
    editor.currentFilePath = filePath;
    editor.canvasArea.innerHTML = '';
    editor.canvasArea.classList.remove('empty');

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // HEADER
    const header = doc.querySelector('header');
    if (header) {
        addBlockToCanvas({
            name: 'Header',
            content: header.outerHTML,
            type: 'header'
        });
    }

    // SECTIONS
    doc.querySelectorAll('section').forEach((section, i) => {
        addBlockToCanvas({
            name: `Section ${i + 1}`,
            content: section.outerHTML,
            type: 'section'
        });
    });

    // FOOTER
    const footer = doc.querySelector('footer');
    if (footer) {
        addBlockToCanvas({
            name: 'Footer',
            content: footer.outerHTML,
            type: 'footer'
        });
    }
}

// ====== Sauvegarde ======
async function saveCurrentFile() {
    if (!editor.currentFilePath) return alert("Aucun fichier ouvert");

    const blocks = [...editor.canvasArea.children];

    const header = blocks
        .filter(b => b.dataset.type === 'header')
        .map(b => b.querySelector('iframe').contentDocument.body.innerHTML)
        .join('');

    const sections = blocks
        .filter(b => b.dataset.type === 'section')
        .map(b => b.querySelector('iframe').contentDocument.body.innerHTML)
        .join('\n');

    const footer = blocks
        .filter(b => b.dataset.type === 'footer')
        .map(b => b.querySelector('iframe').contentDocument.body.innerHTML)
        .join('');

    const finalHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://studio.online-corps.net/api-css/">
<title>${editor.projectTitle.textContent}</title>
</head>
<body>

${header}
<main>
${sections}
</main>
${footer}

</body>
</html>`.trim();

    await window.electronAPI.saveFile(editor.currentFilePath, finalHTML);
    alert("Fichier sauvegardé !");
}

initEditor();
