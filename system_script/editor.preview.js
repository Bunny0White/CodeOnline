// ==========================================
// /system_script/editor.preview.js
// ==========================================

// Crée un iframe pour visualiser le fichier avec la CSS appliquée
function previewFileContent(htmlContent) {
    // Supprime l'ancien iframe si existant
    const oldIframe = document.getElementById('previewFrame');
    if (oldIframe) oldIframe.remove();

    // Crée le nouvel iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'previewFrame';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    // Ajoute le HTML + ta bibliothèque CSS
    const completeHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview - ${window.editor.projectTitle.textContent}</title>
            <link rel="stylesheet" href="https://studio.online-corps.net/api-css/">
            <style>
                body { margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
    `;

    // Injecte le HTML dans l'iframe
    iframe.srcdoc = completeHTML;

    // Ajoute l'iframe au canvas
    window.editor.canvasArea.innerHTML = '';
    window.editor.canvasArea.appendChild(iframe);
    window.editor.canvasArea.classList.remove('empty');
}

// --- Modifier loadFileToCanvas pour le mode preview ---
async function loadFileToCanvas(filePath) {
    const content = await window.electronAPI.readFile(filePath);

    // On peut filtrer uniquement les fichiers HTML/PHP pour preview
    if (!filePath.endsWith('.html') && !filePath.endsWith('.php')) {
        alert("Impossible de prévisualiser ce type de fichier");
        return;
    }

    previewFileContent(content);
    window.editor.currentFilePath = filePath;
}

// --- Raccourci : double clic sur fichier ---
window.editor.fileExplorer.addEventListener('dblclick', async (e) => {
    const fileDiv = e.target.closest('.file-item');
    if (!fileDiv) return;

    const fileName = fileDiv.textContent;
    const filePath = fileDiv.dataset.path || `${window.editor.projectPath}\\${fileName}`;

    await loadFileToCanvas(filePath);
});
