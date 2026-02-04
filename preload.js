const { contextBridge, ipcRenderer, shell } = require("electron");

let __projectFiles = [];

contextBridge.exposeInMainWorld("electronAPI", {
    openExternal: (url) => ipcRenderer.invoke("open-external", url),


    closeWindow: () => ipcRenderer.send("window-close"),
    minimizeWindow: () => ipcRenderer.send("window-minimize"),

    selectFolder: () => ipcRenderer.invoke("select-folder"),
    saveFolder: (folder) => ipcRenderer.invoke("save-folder", folder),
    getConfig: () => ipcRenderer.invoke("get-config"),

    getProjectFolders: () => ipcRenderer.invoke("get-project-folders"),
    createFullProject: (data) => ipcRenderer.invoke("create-full-project", data),
    deleteProjectFolder: (path) => ipcRenderer.invoke("delete-project-folder", path),


    getLanguage: () => ipcRenderer.invoke("get-language"),
    setLanguage: (lang) => ipcRenderer.invoke("set-language", lang),

    // Loader project
    openProjectLoader: async (path) => {
        const result = await ipcRenderer.invoke("open-project-loader", path);
        if (result?.files) __projectFiles = result.files;
        return result;
    },

    getProjectFiles: () => __projectFiles,

    launchProject: (path) => ipcRenderer.invoke("launch-project", path),
    cancelProjectLaunch: () => ipcRenderer.invoke("cancel-project-launch"),

    getLoaderFiles: () => ipcRenderer.invoke("get-loader-files"),
    getLoaderProjectPath: () => ipcRenderer.invoke("get-loader-project-path"),

    getProjectFiles: (path) => ipcRenderer.invoke("get-project-files", path),
    readFile: (path) => ipcRenderer.invoke("read-file", path),
    saveFile: (path, content) => ipcRenderer.invoke("save-file", path, content),
    createFile: (path) => ipcRenderer.invoke("create-file", path),
    deleteFile: (path) => ipcRenderer.invoke("delete-file", path),
    openProjectLoader: (path) => ipcRenderer.invoke("open-project-loader", path),

    // Editor
    getBlocks: () => ipcRenderer.invoke("get-blocks"),
    loadBlock: (type, name) => ipcRenderer.invoke("load-block", type, name),
    getProjectTree: (path) => ipcRenderer.invoke("get-project-tree", path),
    createFolder: (path) => ipcRenderer.invoke("create-folder", path),

});
