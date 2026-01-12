import { useEffect, useState } from "react"
import "./AccountsModal.css"
import { X, Plus, Trash2, Check } from "lucide-react"

export default function AccountsModal({
  accounts = [],
  currentUser,
  onSelect,
  onRemove,
  onAdd,
  onClose
}) {
  const [open, setOpen] = useState(false)

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

  return (
    <div className={`accounts-overlay ${open ? "is-open" : ""}`} onMouseDown={onBackdrop}>
      <div className={`accounts-modal ${open ? "is-open" : ""}`}>
        <button className="accounts-close" onClick={close} aria-label="Kapat">
          <X size={14} />
        </button>

        <h1 className="accounts-title">Hesapların</h1>

        <button className="accounts-add" onClick={onAdd} type="button">
          <Plus size={14} />
          <span>Yeni Hesap Ekle</span>
        </button>

        <div className="accounts-list">
          {accounts.map((acc) => {
            const active = acc.username === currentUser
            return (
              <div key={acc.username} className={`account-item ${active ? "active" : ""}`}>
                <img
                  src={`https://minotar.net/avatar/${acc.username}/32`}
                  className="account-avatar"
                />

                <div className="account-info">
                  <span className="account-name">{acc.username}</span>
                  <span className="account-uuid">{acc.uuid}</span>
                </div>

                <div className="account-actions">
                  {active ? (
                    <span className="account-active">
                      <Check size={16} />
                    </span>
                  ) : (
                    <button className="account-btn" onClick={() => onSelect?.(acc.username)} type="button">
                      Seç
                    </button>
                  )}

                  <button
                    className="account-btn danger"
                    onClick={() => onRemove?.(acc.username)}
                    type="button"
                    aria-label="Kaldır"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          {accounts.length === 0 ? (
            <div className="accounts-empty">Henüz kayıtlı hesap yok.</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}