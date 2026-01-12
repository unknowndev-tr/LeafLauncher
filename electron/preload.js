const { contextBridge, ipcRenderer, shell } = require("electron")

contextBridge.exposeInMainWorld("launcher", {
  minimize: () => ipcRenderer.send("win:minimize"),
  close: () => ipcRenderer.send("win:close"),
  openExternal: (url) => shell.openExternal(url),

  getTotalRamMb: () => ipcRenderer.invoke("leaf:getTotalRamMb"),

  getGameDir: () => ipcRenderer.invoke("leaf:getGameDir"),
  listVersions: () => ipcRenderer.invoke("leaf:listVersions"),
  isInstalled: (args) => ipcRenderer.invoke("leaf:isInstalled", args),
  installOrLaunch: (payload) => ipcRenderer.invoke("leaf:installOrLaunch", payload),
  cancel: () => ipcRenderer.invoke("leaf:cancel"),

  onProgress: (cb) => {
    const handler = (_e, msg) => cb(msg)
    ipcRenderer.on("leaf:progress", handler)
    return () => ipcRenderer.removeListener("leaf:progress", handler)
  }
})