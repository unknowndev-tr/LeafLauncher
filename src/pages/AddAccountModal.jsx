import { useEffect, useRef, useState } from "react"
import "./AddAccountModal.css"
import { X, Save } from "lucide-react"
import { validateMcUsername } from "../utils/usernameRules"

export default function AddAccountModal({ onClose, onAdd }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

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

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  const submit = () => {
    const err = validateMcUsername(username)
    if (err) {
      setFieldError(err)
      triggerShake()
      inputRef.current?.focus()
      return
    }
    setFieldError("")
    onAdd?.(username.trim())
  }

  return (
    <div className={`addacc-overlay ${open ? "is-open" : ""}`} onMouseDown={onBackdrop}>
      <div className={`addacc-modal ${open ? "is-open" : ""} ${shake ? "is-shake" : ""}`}>
        <button className="addacc-close" onClick={close} aria-label="Kapat">
          <X size={14} />
        </button>

        <h1 className="addacc-title">Hesap Ekle</h1>
        <p className="addacc-sub">Yeni bir Minecraft hesabı ekleyin.</p>

        <div className="addacc-field">
          <input
            ref={inputRef}
            className={`addacc-input ${fieldError ? "is-error" : ""}`}
            placeholder="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            spellCheck={false}
            inputMode="text"
          />
          {fieldError ? <div className="addacc-error">{fieldError}</div> : null}
          <div className="addacc-hint">* Karakter kurallarına uygun olmalı.</div>
        </div>

        <button className="addacc-primary" type="button" onClick={submit}>
          <span>Kaydet</span>
          <span className="addacc-icon">
            <Save size={16} />
          </span>
        </button>
      </div>
    </div>
  )
}
