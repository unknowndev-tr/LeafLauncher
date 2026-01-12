const { app, BrowserWindow, ipcMain, shell } = require("electron")
const path = require("path")
const fs = require("fs")
const https = require("https")
const { exec } = require("child_process")
const os = require("os")

const { Client, Authenticator } = require("minecraft-launcher-core")
const launcher = new Client()

let mainWindow
let activeChild = null
let cancelled = false

const RPC = require("discord-rpc")
const rpc = new RPC.Client({ transport: "ipc" })

const DISCORD_CLIENT_ID = "1460224218099617872"
let rpcReady = false

/* ---------------- WINDOW ---------------- */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    frame: false,
    backgroundColor: "#0b0b0b",
    icon: path.join(__dirname, "../assets/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })
}

app.whenReady().then(() => {
  createWindow()

  rpc.login({ clientId: DISCORD_CLIENT_ID })
    .then(() => {
      rpcReady = true
      setIdlePresence()
    })
    .catch(console.error)
})

function setIdlePresence() {
  if (!rpcReady) return
  rpc.setActivity({
    state: "Ana Menü",
    largeImageKey: "minecraft",
    startTimestamp: Date.now()
  })
}

function setDownloadingPresence(version) {
  if (!rpcReady) return
  rpc.setActivity({
    details: "Minecraft indiriliyor...",
    state: "Sürüm: " + version,
    largeImageKey: "minecraft"
  })
}

function setPlayingPresence(version) {
  if (!rpcReady) return
  rpc.setActivity({
    details: "Minecraft oynuyor!",
    state: "Sürüm: " + version,
    largeImageKey: "minecraft"
  })
}

/* ---------------- HELPERS ---------------- */

function getGameDir() {
  const dir = path.join(app.getPath("appData"), ".leaf")
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ""
      res.on("data", c => data += c)
      res.on("end", () => resolve(JSON.parse(data)))
    }).on("error", reject)
  })
}

function checkJava() {
  return new Promise((resolve) => {
    exec("java -version", (err) => {
      resolve(!err)
    })
  })
}

function isGameRunning() {
  return activeChild && activeChild.exitCode === null && !activeChild.killed
}

function getLocalVersions(gameDir) {
  const versionsDir = path.join(gameDir, "versions")
  if (!fs.existsSync(versionsDir)) return []

  return fs.readdirSync(versionsDir)
    .filter(name => {
      const json = path.join(versionsDir, name, `${name}.json`)
      return fs.existsSync(json)
    })
    .map(name => ({
      id: name,
      type: "local"
    }))
}

/* ---------------- IPC ---------------- */

ipcMain.handle("leaf:getTotalRamMb", async () => {
  return Math.floor(os.totalmem() / 1024 / 1024)
})

ipcMain.handle("leaf:getGameDir", () => getGameDir())

ipcMain.handle("leaf:listVersions", async () => {
  const manifest = await fetchJson(
    "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
  )

  const gameDir = getGameDir()
  const localVersions = getLocalVersions(gameDir)

  const remote = manifest.versions.filter(v =>
    !localVersions.some(l => l.id === v.id)
  )

  return [
    ...localVersions,
    ...remote
  ]
})

ipcMain.handle("leaf:isInstalled", (_e, { gameDir, versionId }) => {
  return fs.existsSync(
    path.join(gameDir, "versions", versionId, `${versionId}.json`)
  )
})

ipcMain.handle("leaf:installOrLaunch", async (event, payload) => {
  cancelled = false
  const send = (msg) => event.sender.send("leaf:progress", msg)

  const {
    gameDir,
    versionId,
    versionType,
    username,
    uuid,
    memoryMb,
    resolution,
    keepLauncherOpen
  } = payload

  if (isGameRunning()) {
    event.sender.send("leaf:progress", {
      stage: "error",
      message: "Minecraft zaten çalışıyor."
    })
    return
  }

  if (versionId.toLowerCase().includes("optifine")) {
    const baseVersion = versionId.split("-")[0]

    const baseJson = path.join(gameDir, "versions", baseVersion, `${baseVersion}.json`)
    const baseJar  = path.join(gameDir, "versions", baseVersion, `${baseVersion}.jar`)

    if (!fs.existsSync(baseJson) || !fs.existsSync(baseJar)) {
      event.sender.send("leaf:progress", {
        stage: "error",
        message: `OptiFine çalışmadan önce ${baseVersion} sürümü indirilmelidir.`
      })
      return
    }
  }

  const hasJava = await checkJava()
  if (!hasJava) {
    send({
      stage: "error",
      message: "Java bulunamadı. Yüklediğinizden emin olun."
    })
    return
  }

  setDownloadingPresence(versionId)
  send({ stage: "preparing", message: "Hazırlanıyor..." })

  launcher.removeAllListeners()

  const versionObj = { number: versionId }
  if (versionType && versionType !== "local") {
    versionObj.type = versionType
  }

  const opts = {
    authorization: Authenticator.getAuth(username),
    root: gameDir,
    version: versionObj,
    memory: {
      max: `${Math.max(1, Math.floor(memoryMb / 1024))}G`,
      min: "1G"
    },
    overrides: {
      detached: false
    },
  }

  if (resolution && !resolution.useDesktop) {
    opts.window = {
      width: resolution.width,
      height: resolution.height
    }
  }

  launcher.on("debug", (line) => {
    if (cancelled) return
    const l = line.toLowerCase()

    if (l.includes("libraries")) {
      send({ stage: "libraries", message: "Kütüphaneler indiriliyor..." })
    } else if (l.includes("assets")) {
      send({ stage: "assets", message: "Assetler indiriliyor..." })
    }
  })

  launcher.on("data", (line) => {
    if (cancelled) return
    if (line.toLowerCase().includes("setting user")) {
      send({ stage: "launching", message: "Oyun başlatılıyor..." })
    }
  })

  try {
    activeChild = await launcher.launch(opts)  
    if (!keepLauncherOpen) mainWindow.hide()
    if (!activeChild) {
      event.sender.send("leaf:progress", {
        stage: "error",
        message: "Minecraft başlatılamadı (process oluşturulamadı)."
      })
      return
    }

    activeChild.on("exit", () => {
      activeChild = null

      if (!mainWindow.isDestroyed()) {
        mainWindow.show()
        mainWindow.focus()
      }
    })
    send({ stage: "running" })
    setPlayingPresence(versionId)
  } catch (err) {
    send({ stage: "error", message: err.message })
  }
})

ipcMain.handle("leaf:cancel", () => {
  cancelled = true
  if (activeChild && !activeChild.killed) {
    activeChild.kill()
  }
})

ipcMain.on("win:minimize", () => mainWindow.minimize())
ipcMain.on("win:close", () => mainWindow.close())