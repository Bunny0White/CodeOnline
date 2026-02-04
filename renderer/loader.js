const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const fileList = document.getElementById("fileList");
const cancelBtn = document.getElementById("cancelBtn");

let cancelled = false;

cancelBtn.addEventListener("click", async () => {
    cancelled = true;
    await window.electronAPI.cancelProjectLaunch();
    window.close();
});

(async function startLoading() {
    const projectPath = await window.electronAPI.getLoaderProjectPath();
    const files = await window.electronAPI.getLoaderFiles();

    if (!projectPath || !files || files.length === 0) {
        progressText.textContent = "Aucun fichier trouvé";
        return;
    }

    const totalSteps = files.length;
    const stepDuration = 5000 / totalSteps;

    for (let i = 0; i < files.length; i++) {
        if (cancelled) return;

        const file = files[i];
        const div = document.createElement("div");
        div.textContent = file;
        fileList.appendChild(div);
        fileList.scrollTop = fileList.scrollHeight;

        const percent = Math.round(((i + 1) / totalSteps) * 100);
        progressBar.style.width = percent + "%";
        progressText.textContent = percent + "%";

        await new Promise(r => setTimeout(r, stepDuration));
    }

    if (!cancelled) {
        await window.electronAPI.launchProject(projectPath);
    }
})();
