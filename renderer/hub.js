const closeBtn = document.getElementById("closeBtn");
const minimizeBtn = document.getElementById("minimizeBtn");
const navBtns = document.querySelectorAll(".nav-btn");

let LANG = {}; // global language object
let BASE_LANG = {}; // toujours EN comme fallback

async function loadLanguage() {
    try {
        // Charger la langue de base (EN)
        const baseModule = await import(`../language/EN.js`);
        BASE_LANG = baseModule.default;

        // Charger la langue choisie
        const langCode = await window.electronAPI.getLanguage(); // ex: "EN", "FR", "JP"
        let langModule;

        try {
            langModule = await import(`../language/${langCode}.js`);
        } catch (err) {
            console.warn(`Langue "${langCode}" non trouvée, utilisation de EN par défaut.`);
            langModule = baseModule; // fallback EN
        }

        const chosenLang = langModule.default;

        // Compléter avec les clés manquantes depuis EN
        LANG = { ...BASE_LANG, ...chosenLang };

    } catch (err) {
        console.error("Erreur lors du chargement de la langue :", err);
        // fallback minimal
        LANG = { settings: "Settings", language: "Language" };
    }
}


// =====================
// Window controls
// =====================
closeBtn.addEventListener("click", () => window.electronAPI.closeWindow());
minimizeBtn.addEventListener("click", () => window.electronAPI.minimizeWindow());

// =====================
// Initialization
// =====================
async function init() {
    await loadLanguage();

    try {
        const config = await window.electronAPI.getConfig();
        if (!config || !config.projectFolder) {
            showSetupBlock();
            return;
        }

        showHomeTab();
    } catch (err) {
        console.error("init() error:", err);
        showSetupBlock();
    }
}

// =====================
// Initial Setup
// =====================
function showSetupBlock() {
    document.getElementById("main").innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center;">
            <h1>${LANG.welcome}</h1>
            <p>${LANG.chooseFolder}</p>
            <button id="btnWamp">C:\\wamp64\\www</button>
            <button id="btnXampp">C:\\xampp\\htdocs</button>
            <button id="btnBrowse">Choose another folder...</button>
        </div>
    `;

    document.getElementById("btnWamp").addEventListener("click", () => saveFolder("C:\\wamp64\\www"));
    document.getElementById("btnXampp").addEventListener("click", () => saveFolder("C:\\xampp\\htdocs"));
    document.getElementById("btnBrowse").addEventListener("click", async () => {
        const folder = await window.electronAPI.selectFolder();
        if (folder) saveFolder(folder);
    });
}

async function saveFolder(folder) {
    await window.electronAPI.saveFolder(folder);
    alert(`✅ ${LANG.folderConfigured}: ${folder}`);
    showHomeTab();
}

// =====================
// Home Tab
// =====================
async function showHomeTab() {
    document.getElementById("main").innerHTML = `
        <h1>${LANG.myProjects}</h1>
        <button id="newProjectBtn">+ ${LANG.createProject}</button>
        <div id="projects"></div>
    `;

    const projectsDiv = document.getElementById("projects");
    const newProjectBtn = document.getElementById("newProjectBtn");

    async function loadProjects() {
        projectsDiv.innerHTML = "";

        const projects = await window.electronAPI.getProjectFolders();

        if (!projects || projects.length === 0) {
            projectsDiv.innerHTML = `
                <p style="color:#888; text-align:center; margin-top:60px; font-size:14px;">
                    ${LANG.noProjectsFound}
                </p>
            `;
            return;
        }

        projects.forEach(p => {
            const div = document.createElement("div");
            div.className = "project";

            const faviconHtml = p.favicon
                ? `<img src="file:///${p.path.replace(/\\/g, "/")}/${p.favicon}" 
                    style="width:40px;height:40px;border-radius:6px;object-fit:cover;margin-bottom:10px;">`
                : `<div class="project-icon">📦</div>`;

            div.innerHTML = `
                <div class="project-header">
                    ${faviconHtml}
                    <div class="project-name">${p.name}</div>
                </div>
                <div class="project-body">
                    <div class="project-info">${p.description || LANG.defaultProjectDescription}</div>
                    <div class="project-meta">
                        <span>📅 ${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</span>
                    </div>
                </div>
            `;

            div.addEventListener("click", () => {
                showProjectDetails(p);
            });

            projectsDiv.appendChild(div);
        });
    }

    newProjectBtn.addEventListener("click", openCreateProjectModal);
    loadProjects();
}

// =====================
// Editor Tab placeholder
// =====================
function showEditorTab() {
    document.getElementById("main").innerHTML = `
        <h1>${LANG.editor}</h1>
        <p class="muted">${LANG.editorLoading}</p>
    `;
}

// =====================
// Settings Tab
// =====================
function showSettingsTab() {
    // Liste des langues disponibles
    const AVAILABLE_LANGS = [
        { code: "EN", label: "English" },
        { code: "FR", label: "Français" },
        { code: "JP", label: "日本語" }
    ];

    // Créer le HTML du select dynamiquement
    async function generateLangOptions() {
        const currentLang = await window.electronAPI.getLanguage();
        return AVAILABLE_LANGS.map(l =>
            `<option value="${l.code}" ${l.code === currentLang ? "selected" : ""}>${l.label}</option>`
        ).join("");
    }

    generateLangOptions().then(langOptions => {
        document.getElementById("main").innerHTML = `
            <h1>${LANG.settings}</h1>

            <div style="max-width:700px;">

                <!-- Language -->
                <div class="settings-card">
                    <h3>${LANG.language}</h3>
                    <select id="languageSelect">
                        ${langOptions}
                    </select>
                </div>

                <!-- Project Folder -->
                <div class="settings-card">
                    <h3>${LANG.projectFolder}</h3>
                    <p id="currentFolder" class="muted">${LANG.currentFolder}</p>

                    <div class="settings-actions">
                        <button id="selectFolderBtn">${LANG.chooseFolderBtn}</button>
                        <button id="resetWampBtn">${LANG.resetWampBtn}</button>
                        <button id="resetXamppBtn">${LANG.resetXamppBtn}</button>
                    </div>
                </div>

                <!-- Local Server -->
                <div class="settings-card">
                    <h3>Local Server</h3>
                    <p class="muted">${LANG.localServerInfo}</p>
                    <a href="https://www.wampserver.com/#download-wrapper" target="_blank" class="link-btn">${LANG.wampDownload}</a>
                    <a href="https://www.apachefriends.org/fr/download.html" target="_blank" class="link-btn">${LANG.xamppDownload}</a>
                </div>

            </div>
        `;

        // Charger le script système dédié
        const script = document.createElement("script");
        script.src = "../system_script/settings.js";
        document.body.appendChild(script);

        // =====================
        // Langue dynamique
        // =====================
        const select = document.getElementById("languageSelect");
        select.addEventListener("change", async () => {
            const lang = select.value;
            await window.electronAPI.setLanguage(lang);
            alert(`${LANG.languageChanged}: ${lang}`);
            location.reload(); // recharger pour appliquer la langue
        });

        // =====================
        // Folder buttons
        // =====================
        const currentFolderP = document.getElementById("currentFolder");
        const selectFolderBtn = document.getElementById("selectFolderBtn");
        const resetWampBtn = document.getElementById("resetWampBtn");
        const resetXamppBtn = document.getElementById("resetXamppBtn");

        // Charger le chemin actuel
        window.electronAPI.getConfig().then(config => {
            if (config && config.projectFolder) currentFolderP.textContent = config.projectFolder;
        });

        selectFolderBtn.addEventListener("click", async () => {
            const folder = await window.electronAPI.selectFolder();
            if (folder) {
                await window.electronAPI.saveFolder(folder);
                alert(`✅ ${LANG.folderConfigured}: ${folder}`);
                currentFolderP.textContent = folder;
            }
        });

        resetWampBtn.addEventListener("click", async () => {
            const folder = "C:\\wamp64\\www";
            await window.electronAPI.saveFolder(folder);
            alert(`✅ ${LANG.folderConfigured}: ${folder}`);
            currentFolderP.textContent = folder;
        });

        resetXamppBtn.addEventListener("click", async () => {
            const folder = "C:\\xampp\\htdocs";
            await window.electronAPI.saveFolder(folder);
            alert(`✅ ${LANG.folderConfigured}: ${folder}`);
            currentFolderP.textContent = folder;
        });
    });
}

// =====================
// Navigation
// =====================
navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        navBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.tab;
        if (tab === "home") showHomeTab();
        if (tab === "editor") showEditorTab();
        if (tab === "settings") showSettingsTab();
    });
});

// =====================
// Docs Tab
// =====================
function showDocsTab() {
    document.getElementById("main").innerHTML = `
        <h1>${LANG.docs}</h1>
        <p class="muted">${LANG.docsInfo}</p>
        <div style="max-width:700px; margin-top:20px;">
            <button id="openDocsBtn" class="link-btn">${LANG.docs}</button>
        </div>
    `;

    const openDocsBtn = document.getElementById("openDocsBtn");
    openDocsBtn.addEventListener("click", async () => {
        try {
            await window.electronAPI.openExternal("https://studio.online-corps.net/docs/code-online/");
        } catch (err) {
            console.error("Erreur ouverture docs:", err);
            alert("Impossible d'ouvrir la documentation.");
        }
    });
}

// =====================
// Navigation
// =====================
navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        navBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.tab;
        if (tab === "home") showHomeTab();
        if (tab === "editor") showEditorTab();
        if (tab === "docs") showDocsTab(); // ← nouveau
        if (tab === "settings") showSettingsTab();
    });
});

// =====================
// Create Project Modal
// =====================
function openCreateProjectModal() {
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "projectModalOverlay";

    modalOverlay.innerHTML = `
        <div id="projectModal">
            <h2>${LANG.createProject}</h2>
            <label>${LANG.projectName}</label>
            <input id="projectNameInput" placeholder="my-super-project">
            <label>${LANG.description}</label>
            <textarea id="projectDescInput" placeholder="${LANG.projectDescriptionPlaceholder}"></textarea>
            <label>${LANG.logo}</label>
            <input type="file" id="projectLogoInput" accept="image/png, image/jpeg, image/webp">
            <div class="path-preview">
                <span>${LANG.path}:</span>
                <code id="projectPathPreview">...</code>
            </div>
            <div class="modal-actions">
                <button id="cancelProjectBtn">${LANG.cancel}</button>
                <button id="createProjectConfirmBtn">${LANG.confirm}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    const nameInput = document.getElementById("projectNameInput");
    const descInput = document.getElementById("projectDescInput");
    const logoInput = document.getElementById("projectLogoInput");
    const pathPreview = document.getElementById("projectPathPreview");
    const cancelBtn = document.getElementById("cancelProjectBtn");
    const confirmBtn = document.getElementById("createProjectConfirmBtn");

    // Charger le dossier de base du projet
    let baseFolder = "C:\\wamp64\\www"; // fallback par défaut
    window.electronAPI.getConfig().then(config => {
        if (config?.projectFolder) baseFolder = config.projectFolder;
        pathPreview.textContent = baseFolder + "\\...";
    });

    // Mettre à jour le chemin en temps réel
    nameInput.addEventListener("input", () => {
        const name = sanitizeName(nameInput.value);
        pathPreview.textContent = name ? baseFolder + "\\" + name : baseFolder + "\\...";
    });

    // Annuler création
    cancelBtn.addEventListener("click", () => modalOverlay.remove());

    // Confirmer création
    confirmBtn.addEventListener("click", async () => {
        const name = sanitizeName(nameInput.value);
        const desc = descInput.value.trim();
        const logoFile = logoInput.files[0];

        if (!name) {
            alert(LANG.invalidProjectName);
            return;
        }

        try {
            const result = await window.electronAPI.createFullProject({
                name,
                description: desc,
                logoPath: logoFile?.path || null
            });

            if (result?.success) {
                alert(LANG.projectCreated);
                modalOverlay.remove();
                showHomeTab(); // 🔹 recharge la liste de projets
            } else {
                alert(LANG.projectCreationError + (result?.error || ""));
            }
        } catch (err) {
            alert(LANG.projectCreationError + ": " + err.message);
        }
    });
}

// =====================
// Project Details
// =====================
function showProjectDetails(project) {
    document.getElementById('main').innerHTML = `
        <div id="projectDetails">
            <div class="details-header">
                <button id="backBtn">⬅ ${LANG.back}</button>
                <div class="details-actions">
                    <button id="openProjectBtn">${LANG.openProject}</button>
                    <button id="deleteProjectBtn">${LANG.deleteProject}</button>
                </div>
            </div>
            <div class="details-body">
                <div class="project-favicon">
                    ${project.favicon ? `<img src="file:///${project.path.replace(/\\/g, "/")}/${project.favicon}" alt="logo">` : "📦"}
                </div>
                <h2>${project.name}</h2>
                <p>${project.description || LANG.noDescription}</p>
                <ul class="project-meta-list">
                    <li>📅 ${LANG.createdAt}: ${project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "—"}</li>
                    <li>⏱ ${LANG.lastOpened}: ${project.lastOpenedAt ? new Date(project.lastOpenedAt).toLocaleString() : LANG.notOpened}</li>
                    <li>📁 ${LANG.path}: ${project.path}</li>
                </ul>
            </div>
        </div>
    `;

    document.getElementById("backBtn").addEventListener("click", showHomeTab);

    document.getElementById("openProjectBtn").addEventListener("click", async () => {
        const result = await window.electronAPI.openProjectLoader(project.path);

        if (!result?.success) {
            alert(LANG.projectOpenError || "Erreur ouverture projet");
        }
    });

    document.getElementById("deleteProjectBtn").addEventListener("click", () => {
        openDeleteProjectModal(project);
    });
}

// =====================
// Delete Project Modal
// =====================
function openDeleteProjectModal(project) {
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "deleteProjectModal";

    modalOverlay.innerHTML = `
        <div class="modal-content">
            <h2>${LANG.confirmDeletion}</h2>
            <p>${LANG.deleteProjectWarning.replace("{name}", project.name)}</p>
            <div class="modal-actions">
                <button id="cancelDeleteBtn">${LANG.cancel}</button>
                <button id="confirmDeleteBtn">${LANG.confirm}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // fermer modal
    document.getElementById("cancelDeleteBtn").addEventListener("click", () => modalOverlay.remove());

    // confirmer suppression
    document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
        try {
            const result = await window.electronAPI.deleteProjectFolder(project.path);
            if (result.success) {
                alert(LANG.projectDeleted);
                modalOverlay.remove();
                showHomeTab(); // 🔹 recharger la liste de projets
            } else {
                alert(`${LANG.projectDeletionError}: ${result.error}`);
            }
        } catch (err) {
            alert(`${LANG.projectDeletionError}: ${err.message}`);
        }
    });
}

// =====================
// Utilities
// =====================
function sanitizeName(str) {
    return str.toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

// =====================
// Start
// =====================
init();
