import { useEffect, useState, useRef } from "react"
import "./index.css"
import LoginModal from "./pages/LoginModal"
import MainMenu from "./pages/MainMenu"
import Bootstrap from "./pages/Bootstrap"
import { offlineUUID } from "./utils/offlineUuid"
import { Minus, X, Music, Sparkles } from "lucide-react"
import { isElectron } from "./utils/electron"
import bgMusic from "./assets/sounds/bg-music.mp3"

const defaultSettings = {
  memoryMb: 2048,
  resolution: {
    width: 800,
    height: 600,
    useDesktop: false
  },
  advanced: {
    keepLauncherOpen: false,
    disableAnimations: false,
    disableHardwareAccel: false,
    disableAnimatedBg: false,
    showAllVersions: false
  },
  launcherDir: "C:\\Users\\User\\AppData\\Roaming\\LeafLauncher"
}

export default function App() {
  const [booting, setBooting] = useState(true)
  const [view, setView] = useState("login")
  const [fade, setFade] = useState("in")
  const [username, setUsername] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    const t = setTimeout(() => {
      setFade("out")
      setTimeout(() => {
        setBooting(false)       
        setView("login")      
        setFade("in")             
      }, 600)                 
    }, 5000)                    

    return () => clearTimeout(t)
  }, [])

  /* -------------------- GLOBAL STATES -------------------- */

  const [volume, setVolume] = useState(
    () => JSON.parse(localStorage.getItem("musicVolume") ?? "0.25")
  )

  const [animationsEnabled, setAnimationsEnabled] = useState(
    () => JSON.parse(localStorage.getItem("animationsEnabled") ?? "true")
  )

  useEffect(() => {
    localStorage.setItem("musicVolume", JSON.stringify(volume))
  }, [volume])

  useEffect(() => {
    localStorage.setItem("animationsEnabled", JSON.stringify(animationsEnabled))
  }, [animationsEnabled])

  /* -------------------- BACKGROUND MUSIC -------------------- */

  const bgMusicRef = useRef(null)
  const fadeIntervalRef = useRef(null)

  const fadeTo = (audio, target, duration = 600) => {
    if (!audio) return

    clearInterval(fadeIntervalRef.current)

    const start = audio.volume
    const diff = target - start
    const steps = 30
    let current = 0

    fadeIntervalRef.current = setInterval(() => {
      current++
      audio.volume = Math.min(
        1,
        Math.max(0, start + diff * (current / steps))
      )

      if (current >= steps) {
        clearInterval(fadeIntervalRef.current)
        fadeIntervalRef.current = null
      }
    }, duration / steps)
  }

  useEffect(() => {
    const audio = new Audio(bgMusic)
    audio.volume = 0
    audio.loop = true
    audio.volume = volume
    bgMusicRef.current = audio

    // İlk kullanıcı etkileşiminde başlat
    const resume = () => {
      if (audio.volume > 0) {
        audio.play().catch(() => {})
      }
      window.removeEventListener("click", resume)
    }

    window.addEventListener("click", resume)

    return () => {
      audio.pause()
      audio.src = ""
      window.removeEventListener("click", resume)
    }
  }, [])

  useEffect(() => {
    const audio = bgMusicRef.current
    if (!audio) return

    if (volume > 0) {
      audio.play().catch(() => {})
      fadeTo(audio, volume, 700)   // 🔥 FADE-IN / ADJUST
    } else {
      fadeTo(audio, 0, 600)        // 🔥 FADE-OUT
      setTimeout(() => {
        audio.pause()
      }, 650)
    }
  }, [volume])

  /* -------------------- INIT DATA -------------------- */

  useEffect(() => {
    const stored = localStorage.getItem("settings")
    if (stored) setSettings(JSON.parse(stored))
  }, [])

  useEffect(() => {
    const storedAccounts = JSON.parse(localStorage.getItem("accounts") || "[]")
    setAccounts(storedAccounts)

    const remembered = localStorage.getItem("rememberedUser")
    if (remembered) {
      setUsername(remembered)
      setView("menu")
    }
  }, [])

  /* -------------------- SETTINGS -------------------- */

  const saveSettings = (next) => {
    setSettings(next)
    localStorage.setItem("settings", JSON.stringify(next))
  }

  /* -------------------- AUTH -------------------- */

  function login(name, rememberMe) {
    setFade("out")

    setTimeout(() => {
      const uuid = offlineUUID(name)
      const now = Date.now()

      setAccounts(prev => {
        const copy = [...prev]
        const idx = copy.findIndex(a => a.username.toLowerCase() === name.toLowerCase())

        if (idx >= 0) {
          copy[idx] = { ...copy[idx], username: name, uuid, lastUsed: now }
        } else {
          copy.unshift({ username: name, uuid, lastUsed: now })
        }

        localStorage.setItem("accounts", JSON.stringify(copy))
        return copy
      })

      setUsername(name)

      if (rememberMe) {
        localStorage.setItem("rememberedUser", name)
      }

      setView("menu")
      setFade("in")
    }, 700)
  }

  function switchAccount(name) {
    setUsername(name)
    localStorage.setItem("rememberedUser", name)

    setAccounts(prev => {
      const updated = prev.map(acc =>
        acc.username === name
          ? { ...acc, lastUsed: Date.now() }
          : acc
      )
      localStorage.setItem("accounts", JSON.stringify(updated))
      return updated
    })
  }

  function removeAccount(name) {
    setAccounts(prev => {
      const next = prev.filter(a => a.username !== name)
      localStorage.setItem("accounts", JSON.stringify(next))

      if (name === username) {
        if (next.length > 0) {
          setUsername(next[0].username)
          localStorage.setItem("rememberedUser", next[0].username)
        } else {
          setUsername(null)
          localStorage.removeItem("rememberedUser")
          setView("login")
        }
      }

      return next
    })
  }

  function addAccount(name) {
    const uuid = offlineUUID(name)
    const now = Date.now()

    setAccounts(prev => {
      const list = [...prev]
      const idx = list.findIndex(a => a.username.toLowerCase() === name.toLowerCase())

      if (idx >= 0) {
        list[idx] = { ...list[idx], username: name, uuid, lastUsed: now }
      } else {
        list.unshift({ username: name, uuid, lastUsed: now })
      }

      localStorage.setItem("accounts", JSON.stringify(list))
      return list
    })

    setUsername(name)
    localStorage.setItem("rememberedUser", name)
    setView("menu")
  }

  function logout() {
    setFade("out")

    setTimeout(() => {
      setUsername(null)
      localStorage.removeItem("rememberedUser")
      setView("login")
      setFade("in")
    }, 700)
  }

  /* -------------------- RENDER -------------------- */

  return (
    <div className="app">
      <div className="drag-region" />
      {animationsEnabled && <div className="snow" />}

      <div className="top-controls">
        {/* Animasyon Toggle */}
        <button
          className={`wc ${!animationsEnabled ? "is-off" : ""}`}
          onClick={() => setAnimationsEnabled(v => !v)}
          title="Animasyonlar"
        >
          <Sparkles size={14} />
        </button>

        {/* Volume */}
        <div className="wc volume">
          <Music size={14} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>

        <button
          className="wc"
          onClick={() => isElectron() && window.launcher.minimize()}
        >
          <Minus size={14} />
        </button>

        <button
          className="wc close"
          onClick={() => isElectron() && window.launcher.close()}
        >
          <X size={14} />
        </button>
      </div>

      <div className="bg" />
      <div className="bg-dim" />
      <div className="bg-vignette" />

      <div className={`stage fade-${fade} ${animationsEnabled ? "" : "no-anim"}`}>
        {booting && <Bootstrap />}

        {!booting && view === "login" && (
          <LoginModal onSuccess={login} />
        )}

        {!booting && view === "menu" && (
          <MainMenu
            username={username}
            accounts={accounts}
            settings={settings}
            defaultSettings={defaultSettings}
            onSaveSettings={saveSettings}
            onSwitchAccount={switchAccount}
            onRemoveAccount={removeAccount}
            onAddAccount={addAccount}
            onLogout={logout}
          />
        )}
      </div>
    </div>
  )
}