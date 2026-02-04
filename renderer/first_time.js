const folderInput = document.getElementById('folderPath');
const browseBtn = document.getElementById('browseBtn');
const nextBtn = document.getElementById('nextBtn');

browseBtn.addEventListener('click', async () => {
    const folder = await window.electronAPI.selectFolder();
    if(folder) folderInput.value = folder;
});

nextBtn.addEventListener('click', () => {
    if(!folderInput.value) return alert("Veuillez choisir un dossier.");
    const configPath = require('path').join(__dirname,'..','data','config.json');
    require('fs').mkdirSync(require('path').dirname(configPath),{recursive:true});
    require('fs').writeFileSync(configPath, JSON.stringify({projectFolder: folderInput.value}, null, 2));
    window.location.href='../pages/home.html';
});
