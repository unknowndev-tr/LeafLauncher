import "./LoginModal.css"
import { isElectron } from "../utils/electron"
import { useEffect, useMemo, useRef, useState } from "react"
import { openExternal } from "../utils/externalLink"
import {
  ArrowRight,
  Youtube,
  MessageCircle,
  Globe,
  Facebook,
  Instagram,
  AlertTriangle,
  Minus,
  X
} from "lucide-react"

export default function LoginModal({ onSuccess }) {
  const [username, setUsername] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [toast, setToast] = useState({ open: false, message: "" })
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)
  const [rememberMe, setRememberMe] = useState(true)

  const mcNameRegex = useMemo(() => /^[A-Za-z0-9_]{3,16}$/, [])
  const blockedNames = useMemo(
    () =>
      new Set([
        "admin",
        "administrator",
        "mod",
        "moderator",
        "support",
        "owner",
        "root",
        "system",
        "minecraft",
        "mojang",
        "microsoft",
      ]),
    []
  )

  const triggerShake = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 450)
  }

  const validateUsername = (raw) => {
    const value = raw.trim()

    if (!value) return "Kullanıcı adı boş bırakılamaz."
    if (value.length < 3 || value.length > 16) return "Kullanıcı adı 3-16 karakter olmalı."
    if (!mcNameRegex.test(value)) return "Sadece harf, rakam ve alt çizgi (_) kullanabilirsin."
    if (value.includes("__")) return "Alt çizgiyi (__) arka arkaya kullanamazsın."
    if (blockedNames.has(value.toLowerCase())) return "Bu kullanıcı adı kullanılamaz."

    return ""
  }

  const handleOfflineLogin = () => {
    const err = validateUsername(username)
    if (err) {
      setFieldError(err)
      triggerShake()
      inputRef.current?.focus()
      return
    }

    setFieldError("")
    onSuccess?.(username.trim(), rememberMe)
  }

  const handleMicrosoftClick = () => {
    const msg = "Microsoft ile giriş geçici olarak devre dışı."
    setFieldError(msg)
    triggerShake()
  }

  useEffect(() => {
    if (fieldError) {
      const err = validateUsername(username)
      if (!err) setFieldError("")
    }
  }, [username])

  return (
    <>
      <div className="modal-wrap">
        <div className={`modal ${shake ? "is-shake" : ""}`}>
          <div className="modal-head">
            <h1 className="title">Hoşgeldin!</h1>
            <p className="subtitle">
              Buralarda yeni misin? <a className="link" onClick={() => openExternal("https://your-site.com/register")}>Kayıt ol!</a>
            </p>
          </div>

          <div className="form">
            <div className="field">
              <input
                ref={inputRef}
                className={`input ${fieldError ? "is-error" : ""}`}
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                spellCheck={false}
                inputMode="text"
              />
              {fieldError ? <div className="field-error">{fieldError}</div> : null}
              <div className="field-hint">* Karakter kurallarına uygun olmalı.</div>
            </div>

            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Bu hesabı hatırla.
            </label>

            <button className="btn-primary" type="button" onClick={handleOfflineLogin}>
              <span className="btn-text">Giriş Yap</span>
              <span className="btn-icon">
                <ArrowRight size={16} />
              </span>
            </button>

            <div className="divider">
              <div className="divider-line"></div>
              <div className="divider-text">YA DA</div>
              <div className="divider-line"></div>
            </div>

            <button className="btn-ms is-disabled" type="button" onClick={handleMicrosoftClick}>
              <div className="ms-mark">
                <span className="msq q1"></span>
                <span className="msq q2"></span>
                <span className="msq q3"></span>
                <span className="msq q4"></span>
              </div>

              <div className="btn-ms-text">
                Giriş yap:
                <span className="ms-word">Microsoft</span>
              </div>
            </button>
          </div>

          {toast.open ? (
            <div className="toast" role="status" aria-live="polite">
              <span className="toast-ico">
                <AlertTriangle size={14} />
              </span>
              <span className="toast-text">{toast.message}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="social-bar">
        <div className="social-box" onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openExternal("https://www.youtube.com/channel/UCvzy5-Za0Xx9Qu0W3VHm1-g")}}>
          <Youtube size={16}/>
        </div>
        <div className="social-box" onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openExternal("https://discord.gg/RbC7QF32vq")}}>
          <MessageCircle size={16}/>
        </div>
        <div className="social-box" onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openExternal("https://unknowndev.netlify.app/")}}>
          <Globe size={16}/>
        </div>
        <div className="social-box" onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openExternal("https://facebook.com")}}>
          <Facebook size={16}/>
        </div>
        <div className="social-box" onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openExternal("https://instagram.com/ardb.y")}}>
          <Instagram size={16}/>
        </div>
      </div>
    </>
  )
}
