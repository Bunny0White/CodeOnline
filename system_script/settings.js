(async function initSettings() {
    const currentFolderP = document.getElementById("currentFolder");
    const selectFolderBtn = document.getElementById("selectFolderBtn");
    const resetWampBtn = document.getElementById("resetWampBtn");
    const resetXamppBtn = document.getElementById("resetXamppBtn");

    // Sécurité DOM
    if (!currentFolderP || !selectFolderBtn) return;

    // Charger la config actuelle
    const config = await window.electronAPI.getConfig();

    if (config && config.projectFolder) {
        currentFolderP.textContent = "📁 " + config.projectFolder;
    } else {
        currentFolderP.textContent = "❌ Aucun dossier configuré";
    }

    // Sélection manuelle
    selectFolderBtn.addEventListener("click", async () => {
        const folder = await window.electronAPI.selectFolder();
        if (!folder) return;

        await window.electronAPI.saveFolder(folder);
        currentFolderP.textContent = "📁 " + folder;
        alert("✅ Nouveau dossier enregistré !");
    });

    // Reset WAMP
    resetWampBtn.addEventListener("click", async () => {
        const wampPath = "C:\\wamp64\\www";
        await window.electronAPI.saveFolder(wampPath);
        currentFolderP.textContent = "📁 " + wampPath;
        alert("✅ Dossier WAMP configuré !");
    });

    // Reset XAMPP
    resetXamppBtn.addEventListener("click", async () => {
        const xamppPath = "C:\\xampp\\htdocs";
        await window.electronAPI.saveFolder(xamppPath);
        currentFolderP.textContent = "📁 " + xamppPath;
        alert("✅ Dossier XAMPP configuré !");
    });

})();
