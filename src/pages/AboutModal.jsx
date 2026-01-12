import { useEffect, useState } from "react"
import "./AboutModal.css"
import { X, Bug } from "lucide-react"

export default function AboutModal({ onClose }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    setOpen(false)
    window.setTimeout(() => onClose?.(), 180)
  }

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) close()
  }

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div
      className={`about-overlay ${open ? "is-open" : ""}`}
      onMouseDown={onBackdrop}
    >
      <div className={`about-modal ${open ? "is-open" : ""}`}>
        <button className="about-close" onClick={close} aria-label="Kapat">
          <X size={14} />
        </button>

        <h1 className="about-title">Hakkımızda</h1>

        <div className="about-section">
          <span className="about-muted">LeafLauncher © 2026</span>
          <br></br>
          <span className="about-muted">Mojang Studios'a bağlı bir proje değildir.</span>
        </div>

        <button
          className="about-report"
          onClick={() => window.open("https://github.com/yourrepo/issues", "_blank")}
          type="button"
        >
          <Bug size={14} />
          <span>Bir Hata Bildir!</span>
        </button>
        
        <div className="about-section">
          <h3>Uygulama</h3>
          <ul>
            <li>Versiyon: v1.0.0 (Geliştirici Sürümü)</li>
            <li>Platform: Windows 10, Windows 11</li>
            <li>Geliştiriciler: UnknownDev</li>
          </ul>
        </div>
        
        <br></br>

        <div className="about-section">
          <h3>Geliştirici Notu</h3>
          <ul>
            <li>Bu uygulama UnknownDev tarafından aktif olarak geliştirilmektedir. LeafLauncher, güvenilir olmayan başlatıcıların yanı sıra; açık kaynak kodlu olup tamamen özelleştirilebilir bir projedir.</li>
          </ul>
        </div>

        <div className="about-footer">
          LeafLauncher, sevgi ile yapıldı! ❤️
        </div>
      </div>
    </div>
  )
}
