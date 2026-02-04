const { dialog, app, shell } = require("electron");
const fs = require("fs-extra");
const path = require("path");
const https = require("https");

const configPath = path.join(__dirname, "data", "config.json");

// ===== Utils =====
function readConfig() {
    try {
        const raw = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

function writeConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf-8");
}

// ===== Vérifier la version =====
async function checkAppVersion() {
    return new Promise((resolve, reject) => {
        const url = "https://studio.online-corps.net/api-app/?code-access=A9F2-BX73-4KJD-Q8L1-Z0RP&type=PC&APP=CodeOnline";
        https.get(url, res => {
            let rawData = "";
            res.on("data", chunk => rawData += chunk);
            res.on("end", () => {
                try {
                    const json = JSON.parse(rawData);
                    resolve(json);
                } catch (err) {
                    reject(err);
                }
            });
        }).on("error", err => reject(err));
    });
}

// ===== Prompt mise à jour =====
async function promptUpdate(downloadLink) {
    const choice = dialog.showMessageBoxSync({
        type: "warning",
        buttons: ["Update", "Quit"],
        defaultId: 0,
        cancelId: 1,
        title: "Update Required",
        message: "A new version of CodeOnline is available. You must update to continue.",
        detail: `Download link: ${downloadLink}`
    });

    if (choice === 0) {
        // Ouvrir le lien de téléchargement
        shell.openExternal(downloadLink);
        app.quit();
    } else {
        // Quitter si l'utilisateur refuse
        app.quit();
    }
}

// ===== Vérification principale =====
async function verifyVersion() {
    try {
        const config = readConfig();
        const currentVersion = config.version || "0.0.0";

        const data = await checkAppVersion();
        if (!data || !data.data || !data.data["1.0.0"]) return;

        const latestVersionKey = Object.keys(data.data).sort().pop(); // récupérer la dernière version
        const latest = data.data[latestVersionKey];

        if (currentVersion !== latestVersionKey) {
            await promptUpdate(latest.link);
        } else {
            console.log("[Updater] Version à jour :", currentVersion);
        }
    } catch (err) {
        console.error("[Updater] Impossible de vérifier la version :", err);
    }
}

module.exports = { verifyVersion };
