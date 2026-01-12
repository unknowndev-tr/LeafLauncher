import { useEffect, useState } from "react"
import "./SettingsModal.css"
import { X } from "lucide-react"

export default function SettingsModal({
  value,
  onSave,
  onReset,
  onClose
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  const MIN_RAM = 512

  const totalRamMb = window.system?.getTotalRamMb?.() ?? 8192
  const maxRam = Math.floor(totalRamMb * 0.8)

  const ADVANCED_OPTIONS = [
    {
      key: "keepLauncherOpen",
      label: "Başlatıcıyı açık tut",
      tooltip: "Oyun başlatıldıktan sonra başlatıcı açık kalır."
    },
    {
      key: "showAllVersions",
      label: "Tüm sürümleri göster",
      tooltip: "Snapshot dahil tüm Minecraft sürümlerini gösterir."
    }
  ]

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    setOpen(false)
    setTimeout(() => onClose?.(), 180)
  }

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) close()
  }

  const update = (path, val) => {
    setDraft(prev => {
      const next = structuredClone(prev)
      let ref = next
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]]
      }
      ref[path[path.length - 1]] = val
      return next
    })
  }

  return (
    <div className={`settings-overlay ${open ? "is-open" : ""}`} onMouseDown={onBackdrop}>
      <div className={`settings-modal ${open ? "is-open" : ""}`}>
        <button className="settings-close" onClick={close}>
          <X size={14} />
        </button>

        <h1 className="settings-title">Ayarlar</h1>

        <div className="settings-actions">
          <button onClick={() => onSave(draft)}>Kaydet</button>
          <button onClick={() => setDraft(value)}>Sıfırla</button>
        </div>

        <div className="settings-section">
          <label>Ayrılan RAM Miktarı</label>
          <div className="memory-row">
            <input
              type="range"
              min={MIN_RAM}
              max={maxRam}
              step={256}
              value={draft.memoryMb}
              onChange={(e) =>
                update(["memoryMb"], Number(e.target.value))
              }
            />
            <span>
              {draft.memoryMb} MB
              <span style={{ opacity: .45 }}>
                {" / "}{maxRam} MB
              </span>
            </span>
          </div>
        </div>

        <div className="settings-section">
          <label>Oyun Çözünürlüğü</label>

          <div className="resolution-row">
            <input
              type="number"
              value={draft.resolution.width}
              onChange={(e) => update(["resolution","width"], Number(e.target.value))}
              disabled={draft.resolution.useDesktop}
            />
            <span>×</span>
            <input
              type="number"
              value={draft.resolution.height}
              onChange={(e) => update(["resolution","height"], Number(e.target.value))}
              disabled={draft.resolution.useDesktop}
            />
          </div>
        </div>

        <div className="settings-section">
          <label>Başlatıcı Ayarları</label>

          {ADVANCED_OPTIONS.map(opt => (
            <label key={opt.key} className="check tooltip">
              <input
                type="checkbox"
                checked={draft.advanced[opt.key]}
                onChange={(e) =>
                  update(["advanced", opt.key], e.target.checked)
                }
              />
              {opt.label}

              <span className="tooltip-text">
                {opt.tooltip}
              </span>
            </label>
          ))}
        </div>
        
        <div className="settings-section">
          <label>Başlatıcı Klasörü</label>
          <input
            className="dir-input"
            value={draft.launcherDir}
            readOnly
          />
        </div>
      </div>
    </div>
  )
}
