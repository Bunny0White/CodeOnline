// ==========================================
// /system_script/editor.blocks.js
// ==========================================

function createIframe(content, onResize = true) {
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';

    iframe.srcdoc = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://studio.online-corps.net/api-css/">
<style>
body {
    margin: 0;
    font-family: 'DM Sans', sans-serif;
}
</style>
</head>
<body>
${content}
</body>
</html>`;

    if (onResize) {
        iframe.onload = () => {
            const doc = iframe.contentDocument;
            iframe.style.height = doc.body.scrollHeight + 'px';
        };
    }

    return iframe;
}

// ====== Ajouter un bloc ======
function addBlockToCanvas({ name, content, type }) {

    // 1 seul header / footer
    if ((type === 'header' || type === 'footer') &&
        [...editor.canvasArea.children].some(b => b.dataset.type === type)) {
        alert("Un seul header et footer autorisé");
        return;
    }

    editor.canvasArea.classList.remove('empty');

    const block = document.createElement('div');
    block.className = 'canvas-block';
    block.dataset.type = type;

    const header = document.createElement('div');
    header.className = 'block-header';
    header.innerHTML = `
        <strong>${name}</strong>
        <div class="block-controls">
            <button class="edit-block">✎</button>
            <button class="delete-block">✕</button>
        </div>
    `;

    const iframe = createIframe(content);

    // Suppression
    header.querySelector('.delete-block').onclick = () => {
        block.remove();
        if (!editor.canvasArea.children.length) {
            editor.canvasArea.classList.add('empty');
        }
    };

    // Edition
    header.querySelector('.edit-block').onclick = () =>
        openBlockEditor(block, iframe);

    block.appendChild(header);
    block.appendChild(iframe);
    editor.canvasArea.appendChild(block);
}

// ====== Éditeur de bloc ======
function openBlockEditor(block, iframe) {

    const modal = document.createElement('div');
    modal.className = 'modal';

    const currentHTML = iframe.contentDocument.body.innerHTML;

    modal.innerHTML = `
<div class="modal-content" style="width:800px;max-width:90vw;">
    <h3>Édition du bloc</h3>
    <textarea style="width:100%;height:400px;">${currentHTML}</textarea>
    <div class="actions">
        <button class="btn btn-primary save">💾 Sauvegarder</button>
        <button class="btn btn-secondary close">✕ Fermer</button>
    </div>
</div>
`;

    document.body.appendChild(modal);

    const textarea = modal.querySelector('textarea');

    modal.querySelector('.close').onclick = () => modal.remove();

    modal.querySelector('.save').onclick = () => {
        iframe.srcdoc = `
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="https://studio.online-corps.net/api-css/">
<style>body{margin:0;font-family:'DM Sans',sans-serif;}</style>
</head>
<body>
${textarea.value}
</body>
</html>`;
        iframe.onload = () => {
            iframe.style.height =
                iframe.contentDocument.body.scrollHeight + 'px';
        };
        modal.remove();
    };
}
