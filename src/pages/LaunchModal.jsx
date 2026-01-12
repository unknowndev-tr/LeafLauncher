import { useEffect, useMemo, useState } from "react"
import "./LaunchModal.css"
import { X, Rocket, Download, CirclePause, Square } from "lucide-react"

export default function LaunchModal({
  onClose,
  settings,
  username,
  uuid
}) {
  const [open, setOpen] = useState(false)
  const [gameDir, setGameDir] = useState("")
  const [versions, setVersions] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(true)

  const [state, setState] = useState({
    selectedVersion: "",
    status: "idle",
    isInstalled: false,
    error: "",
    progress: {
      percent: 0,
      downloadedFiles: 0,
      totalFiles: 0,
      currentFile: ""
    }
  })

  const showSnapshots = !!settings?.advanced?.showAllVersions

  const visibleVersions = useMemo(() => {
    return versions.filter(v => v.type === "release" || showSnapshots)
  }, [versions, showSnapshots])

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    const onKey = (e) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  const close = () => {
    setOpen(false)
    setTimeout(() => onClose?.(), 180)
  }

  useEffect(() => {
    let off = null

    ;(async () => {
      setLoadingVersions(true)

      const dir = await window.launcher.getGameDir()
      setGameDir(dir)

      const list = await window.launcher.listVersions()
      setVersions(list || [])
      setLoadingVersions(false)

      const last = localStorage.getItem("lastVersion") || ""
      const firstVisible = (list || []).find(v => v.type === "release" || showSnapshots)?.id || ""

      const initial = (last && (list || []).some(v => v.id === last)) ? last : firstVisible
      if (initial) {
        localStorage.setItem("lastVersion", initial)
        setState(s => ({ ...s, selectedVersion: initial, status: "checking", error: "" }))
      }
    })()

    off = window.launcher.onProgress((msg) => {
      if (!msg) return

      if (msg.stage === "preparing") {
        setState(s => ({
          ...s,
          status: "checking",
          error: "",
          progress: {
            percent: msg.percent ?? 0,
            downloadedFiles: msg.downloadedFiles ?? 0,
            totalFiles: msg.totalFiles ?? 0,
            currentFile: msg.currentFile ?? ""
          }
        }))
        return
      }

      if (msg.stage === "downloading") {
        setState(s => ({
          ...s,
          status: "downloading",
          error: "",
          progress: {
            percent: msg.percent ?? s.progress.percent ?? 0,
            downloadedFiles: msg.downloadedFiles ?? s.progress.downloadedFiles ?? 0,
            totalFiles: msg.totalFiles ?? s.progress.totalFiles ?? 0,
            currentFile: msg.currentFile ?? ""
          }
        }))
        return
      }

      if (msg.stage === "launching") {
        setState(s => ({ ...s, status: "launching", error: "" }))
        return
      }

      if (msg.stage === "running") {
        setState(s => ({ ...s, status: "running", isInstalled: true, error: "" }))
        return
      }

      if (msg.stage === "error") {
        setState(s => ({ ...s, status: "error", error: msg.message || "Bir hata oluştu." }))
      }
    })

    return () => off?.()
  }, [showSnapshots])

  useEffect(() => {
    if (!state.selectedVersion || !gameDir) return

    ;(async () => {
      setState(s => ({ ...s, status: "checking", error: "" }))

      const installed = await window.launcher.isInstalled({
        gameDir,
        versionId: state.selectedVersion
      })

      setState(s => ({
        ...s,
        isInstalled: installed,
        status: installed ? "ready" : "idle"
      }))
    })()
  }, [state.selectedVersion, gameDir])

  const onSelectVersion = (v) => {
    localStorage.setItem("lastVersion", v)
    setState(s => ({
      ...s,
      selectedVersion: v,
      status: "checking",
      isInstalled: false,
      error: "",
      progress: { percent: 0, downloadedFiles: 0, totalFiles: 0, currentFile: "" }
    }))
  }

  const onPrimary = async () => {
    if (!state.selectedVersion) return

    const selected = visibleVersions.find(v => v.id === state.selectedVersion)
    const versionType = selected?.type === "snapshot" ? "snapshot" : "release"

    setState(s => ({
      ...s,
      status: state.isInstalled ? "launching" : "downloading",
      error: ""
    }))

    await window.launcher.installOrLaunch({
      gameDir,
      versionId: state.selectedVersion,
      versionType,
      username,
      uuid,
      memoryMb: settings?.memoryMb ?? 2048,
      resolution: settings?.resolution ?? { width: 800, height: 600, useDesktop: false },
      keepLauncherOpen: settings.advanced.keepLauncherOpen
    })
  }

  const onSecondary = async () => {
    if (state.status === "downloading" || state.status === "launching" || state.status === "checking") {
      await window.launcher.cancel()
      setState(s => ({
        ...s,
        status: state.isInstalled ? "ready" : "idle",
        error: "",
        progress: { percent: 0, downloadedFiles: 0, totalFiles: 0, currentFile: "" }
      }))
      return
    }
    close()
  }

  const primaryLabel = !state.isInstalled ? "Yükle" : "Başlat"
  const primaryIcon = !state.isInstalled ? <Download size={14} /> : <Rocket size={14} />

  const secondaryLabel = (state.status === "downloading" || state.status === "launching" || state.status === "checking")
    ? "Durdur"
    : "İptal"

  const secondaryIcon = (state.status === "downloading" || state.status === "launching" || state.status === "checking")
    ? <CirclePause size={14} />
    : null

  const primaryDisabled =
    loadingVersions ||
    !state.selectedVersion ||
    state.status === "downloading" ||
    state.status === "checking"

  return (
    <div
      className={`launch-overlay ${open ? "is-open" : ""}`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className={`launch-modal ${open ? "is-open" : ""}`}>
        <button className="launch-close" onClick={close} aria-label="Kapat">
          <X size={14} />
        </button>

        <h1 className="launch-title">Oyunu Başlat</h1>

        <div className="launch-section">
          <label>Oyun Sürümü</label>
          <select
            value={state.selectedVersion}
            disabled={loadingVersions || state.status === "downloading" || state.status === "checking"}
            onChange={(e) => onSelectVersion(e.target.value)}
          >
            {visibleVersions.map(v => (
              <option key={v.id} value={v.id}>
                {v.id}
                {v.type === "local" ? " (Modlu)" : ""}
                {v.type === "snapshot" ? " (Snapshot)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="launch-status">
          {loadingVersions && <span>Sürümler yükleniyor...</span>}

          {!loadingVersions && state.status === "idle" && (
            <span>Bu sürüm henüz yüklü değil.</span>
          )}

          {["preparing","libraries","assets"].includes(state.stage) && (
            <span>{state.message}</span>
          )}

          {!loadingVersions && state.status === "ready" && (
            <span className="ready">Oyun yüklendi. Başlatabilirsiniz.</span>
          )}

          {state.status === "checking" && (
            <span>Oyun kontrol ediliyor... Lütfen bekleyin!</span>
          )}

          {state.status === "downloading" && (
            <>
              <span>{state.progress.currentFile || "İndiriliyor..."}</span>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${state.progress.percent || 0}%` }}
                />
              </div>

              <div className="progress-meta">
                {state.progress.downloadedFiles} / {state.progress.totalFiles} dosya
                <span>{state.progress.percent || 0}%</span>
              </div>
            </>
          )}

          {state.status === "launching" && (
            <span className="launching">Oyun başlatılıyor...</span>
          )}

          {state.status === "error" && (
            <span style={{ color:"#ff6464" }}>
              {state.error === "Minecraft zaten çalışıyor."
                ? "Minecraft zaten çalışıyor. Önce oyunu kapatın."
                : state.error}
            </span>
          )}
        </div>

        <div className="launch-section">
          <label>Oyun Klasörü</label>
          <input value={gameDir} readOnly />
        </div>

        <div className="launch-actions">
          <button className="secondary" onClick={onSecondary}>
            {secondaryIcon}{secondaryLabel}
          </button>

          <button
            className="primary"
            disabled={primaryDisabled}
            onClick={onPrimary}
          >
            {primaryIcon}{primaryLabel}
          </button>
        </div>
      </div>
    </div>
  )
}