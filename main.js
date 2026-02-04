const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { verifyVersion } = require("./update-check");
const fs = require("fs-extra");
const path = require("path");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const configPath = path.join(dataDir, "config.json");
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, "{}", "utf-8");

let mainWindow;
let loaderFilesCache = [];
let loaderProjectPath = null;

// ====== Utils ======
function readConfig() {
    try {
        const raw = fs.readFileSync(configPath, "utf-8");
        if (!raw || raw.trim() === "{}" || raw.trim() === "") return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

// ====== Fenêtre principale ======
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        frame: false,
        show: false,
        icon: path.join(__dirname, "assets", "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, "pages", "hub.html"));
    mainWindow.once("ready-to-show", () => mainWindow.show());
}

app.whenReady().then(async () => {
    await verifyVersion();  // Vérifie la version avant de lancer l'app
    createMainWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// ====== Fenêtres et navigation ======
ipcMain.on("window-close", () => mainWindow?.close());
ipcMain.on("window-minimize", () => mainWindow?.minimize());

ipcMain.handle("open-external", async (event, url) => {
    try {
        await shell.openExternal(url);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// ====== Config ======
ipcMain.handle("get-config", async () => readConfig());

ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("save-folder", async (event, folderPath) => {
    fs.writeFileSync(configPath, JSON.stringify({ projectFolder: folderPath }, null, 2));
    return true;
});

// ====== Gestion projets ======
ipcMain.handle("get-project-folders", async () => {
    const config = readConfig();
    if (!config?.projectFolder || !fs.existsSync(config.projectFolder)) return [];

    const entries = fs.readdirSync(config.projectFolder, { withFileTypes: true });
    const projects = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const projectDir = path.join(config.projectFolder, entry.name);
        const projectConfigPath = path.join(projectDir, "Code_Online.config");
        if (!fs.existsSync(projectConfigPath)) continue;

        try {
            const data = JSON.parse(fs.readFileSync(projectConfigPath, "utf-8"));
            projects.push({
                folderName: entry.name,
                name: data.name || entry.name,
                description: data.description || "",
                favicon: data.favicon || null,
                path: projectDir,
                createdAt: data.createdAt || null
            });
        } catch (err) {
            console.warn("Config invalide :", projectConfigPath);
        }
    }

    return projects;
});

ipcMain.handle("create-full-project", async (event, data) => {
    try {
        const config = readConfig();
        if (!config?.projectFolder) return { success: false, error: "Dossier projet non configuré" };

        const projectName = data.name?.trim();
        if (!projectName) return { success: false, error: "Nom de projet invalide" };

        const projectDir = path.join(config.projectFolder, projectName);
        if (fs.existsSync(projectDir)) return { success: false, error: "Projet déjà existant" };

        // Création dossiers
        fs.mkdirSync(path.join(projectDir, "assets", "img"), { recursive: true });

        // Favicon
        let faviconFile = null;
        if (data.logoPath && fs.existsSync(data.logoPath)) {
            const ext = path.extname(data.logoPath);
            faviconFile = "favicon" + ext;
            fs.copyFileSync(data.logoPath, path.join(projectDir, "assets", "img", faviconFile));
        }

        // index.php
        const indexPhpContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${data.description || 'Welcome to our website!'}">
    <meta name="keywords" content="${data.keywords || ''}">
    <meta name="author" content="${data.author || ''}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${data.url || 'https://yoursite.com/'}">
    <meta property="og:title" content="${projectName}">
    <meta property="og:description" content="${data.description || ''}">
    <meta property="og:image" content="${data.ogImage || '/assets/img/og-image.png'}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${data.url || 'https://yoursite.com/'}">
    <meta property="twitter:title" content="${projectName}">
    <meta property="twitter:description" content="${data.description || ''}">
    <meta property="twitter:image" content="${data.ogImage || '/assets/img/og-image.png'}">

    <title>${projectName}</title>

    ${faviconFile ? `<link rel="icon" type="image/png" href="/assets/img/${faviconFile}">` : ""}

    <!-- Library CSS -->
    <link rel="stylesheet" href="https://studio.online-corps.net/api-css/">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
</head>
<body>

    <!-- HEADER -->
    <header class="header-classic">
        <div class="container container-xl">
            <a href="/" class="logo">${projectName}</a>
            <nav>
                <ul class="nav-menu">
                    <li><a href="#home" class="nav-link">Home</a></li>
                    <li><a href="#about" class="nav-link">About</a></li>
                    <li><a href="#services" class="nav-link">Services</a></li>
                    <li><a href="#contact" class="nav-link">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- HERO SECTION -->
    <section class="section-hero-image" id="home">
        <div class="hero-content">
            <h1>${projectName}</h1>
            <p>${data.description || "Welcome to our website!"}</p>
            <div class="hero-actions">
                <button class="btn btn-primary btn-lg">Get Started</button>
                <button class="btn btn-secondary btn-lg">See Demo</button>
            </div>
        </div>
    </section>

    <!-- FEATURES SECTION -->
    <section class="section-features" id="services">
        <div class="container container-xl">
            <div class="section-header">
                <h2>Our Features</h2>
                <p class="subtitle">Discover what makes our solution unique</p>
            </div>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🎨</div>
                    <h3>Modern Design</h3>
                    <p>Pre-designed, elegant blocks to impress your visitors.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <h3>Ultra Fast</h3>
                    <p>Optimized CSS for maximum performance and instant loading.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📱</div>
                    <h3>Responsive</h3>
                    <p>Fully adapts to all screen sizes and devices.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ABOUT SECTION -->
    <section class="section-about" id="about">
        <div class="container container-xl">
            <div class="about-grid">
                <div class="about-content">
                    <h2>About Us</h2>
                    <p>We are passionate about creating tools that simplify life for developers and content creators.</p>
                    <button class="btn btn-primary mt-6">Learn More</button>
                </div>
                <div class="about-image" style="background-image: url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800');"></div>
            </div>
        </div>
    </section>

    <!-- CTA SECTION -->
    <section class="section-cta">
        <div class="container container-xl">
            <div class="cta-content">
                <h2>Ready to get started?</h2>
                <p>Create your website today and join thousands of happy users</p>
                <div class="hero-actions">
                    <button class="btn btn-primary btn-lg">Start for Free</button>
                    <button class="btn btn-outline btn-lg">View Documentation</button>
                </div>
            </div>
        </div>
    </section>

    <!-- CONTACT SECTION -->
    <section class="section-contact" id="contact">
        <div class="container container-xl">
            <div class="contact-grid">
                <div class="contact-info">
                    <h2>Contact Us</h2>
                    <p>Have a question or suggestion? Our team is here to help.</p>
                    <div class="contact-details">
                        <div class="contact-item">
                            <div class="contact-icon">📧</div>
                            <div>
                                <div>Email</div>
                                <div>${data.email || 'contact@yoursite.com'}</div>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-icon">📞</div>
                            <div>
                                <div>Phone</div>
                                <div>${data.phone || '+1 123 456 7890'}</div>
                            </div>
                        </div>
                        <div class="contact-item">
                            <div class="contact-icon">📍</div>
                            <div>
                                <div>Address</div>
                                <div>${data.address || '123 Example Street, City, Country'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="contact-form">
                    <form>
                        <div class="form-group">
                            <label class="form-label" for="name">Full Name</label>
                            <input type="text" id="name" class="input" placeholder="John Doe" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="email">Email</label>
                            <input type="email" id="email" class="input" placeholder="john@example.com" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="subject">Subject</label>
                            <select id="subject" class="select" required>
                                <option value="">Choose a subject</option>
                                <option value="support">Technical Support</option>
                                <option value="sales">Sales Inquiry</option>
                                <option value="partnership">Partnership</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="message">Message</label>
                            <textarea id="message" class="textarea" placeholder="Your message..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Send Message</button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer-classic">
        <div class="container container-xl">
            <p>&copy; <?php echo date("Y"); ?> - ${projectName}. All rights reserved.</p>
        </div>
    </footer>

    <!-- JAVASCRIPT -->
    <script>
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        const contactForm = document.querySelector('.contact-form form');
        if(contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Form submitted! (Add your form logic here)');
            });
        }
    </script>
</body>
</html>
`;
        fs.writeFileSync(path.join(projectDir, "index.php"), indexPhpContent, "utf-8");

        // Config projet
        fs.writeFileSync(path.join(projectDir, "Code_Online.config"),
            JSON.stringify({
                name: projectName,
                description: data.description || "",
                createdAt: new Date().toISOString(),
                path: projectDir,
                favicon: faviconFile ? `assets/img/${faviconFile}` : null
            }, null, 2), "utf-8");

        return { success: true };

    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle("delete-project-folder", async (event, projectPath) => {
    try {
        await fs.remove(projectPath);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// ====== Langue ======
ipcMain.handle("get-language", async () => readConfig()?.language || "EN");
ipcMain.handle("set-language", async (event, lang) => {
    const config = readConfig() || {};
    config.language = lang;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    return true;
});

// ====== Loader et editor ======
ipcMain.handle("open-project-loader", async (event, projectPath) => {
    if (!projectPath || typeof projectPath !== "string" || !fs.existsSync(projectPath))
        return { success: false, error: "Projet invalide" };

    loaderFilesCache = [];
    loaderProjectPath = projectPath;

    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else loaderFilesCache.push(full);
    });
    walk(projectPath);

    if (!mainWindow.isMinimized()) mainWindow.minimize();

    const loaderWindow = new BrowserWindow({
        width: 600, height: 420, frame: false, resizable: false, alwaysOnTop: true,
        webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false }
    });
    global.__loaderWindow = loaderWindow;
    loaderWindow.loadFile(path.join(__dirname, "pages", "loader.html"));
    loaderWindow.once("ready-to-show", () => loaderWindow.show());

    return { success: true, count: loaderFilesCache.length };
});

ipcMain.handle("launch-project", async (event, projectPath) => {
    if (!projectPath) return { success: false };
    if (global.__loaderWindow) { global.__loaderWindow.close(); global.__loaderWindow = null; }

    const editorWindow = new BrowserWindow({
        width: 1500, height: 900, show: false,
        webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
        maximizable: true
    });
    editorWindow.maximize();
    editorWindow.loadFile(path.join(__dirname, "pages", "editor.html"), { query: { path: projectPath } });
    editorWindow.once("ready-to-show", () => editorWindow.show());

    return { success: true };
});

ipcMain.handle("cancel-project-launch", async () => {
    loaderFilesCache = [];
    loaderProjectPath = null;
    return true;
});

ipcMain.handle("get-loader-project-path", async () => loaderProjectPath);
ipcMain.handle("get-loader-files", async () => loaderFilesCache);

// ====== Files ======
ipcMain.handle("get-project-files", async (e, projectPath) => {
    const list = [];
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else list.push(full);
    });
    walk(projectPath);
    return list;
});

ipcMain.handle("read-file", async (e, filePath) => fs.readFileSync(filePath, "utf-8"));
ipcMain.handle("save-file", async (e, filePath, content) => { fs.writeFileSync(filePath, content, "utf-8"); return true; });
ipcMain.handle("create-file", async (e, filePath) => { fs.writeFileSync(filePath, "", "utf-8"); return true; });
ipcMain.handle("delete-file", async (e, filePath) => { fs.unlinkSync(filePath); return true; });

// ====== Blocks ======
const BLOCKS_DIR = path.join(__dirname, "blocks");

ipcMain.handle("get-blocks", async () => {
    const scan = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".html")) : [];
    return { headers: scan(path.join(BLOCKS_DIR, "headers")), footers: scan(path.join(BLOCKS_DIR, "footers")), body: scan(path.join(BLOCKS_DIR, "body")) };
});

ipcMain.handle("load-block", async (event, type, name) => {
    const filePath = path.join(BLOCKS_DIR, type, name);
    return fs.readFileSync(filePath, "utf-8");
});

ipcMain.handle("get-project-tree", async (event, basePath) => {
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).map(item => {
        const full = path.join(dir, item.name);
        return item.isDirectory() ? { type: "folder", name: item.name, path: full, children: walk(full) } : { type: "file", name: item.name, path: full };
    });
    return walk(basePath);
});

ipcMain.handle("create-folder", async (event, folderPath) => { if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true }); return true; });
