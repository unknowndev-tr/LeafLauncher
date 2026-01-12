import { useState } from "react"
import "./MainMenu.css"
import { isElectron } from "../utils/electron"
import { openExternal } from "../utils/externalLink"
import {
  Info,
  Settings,
  Rocket,
  CircleArrowOutUpLeft,
  Minus,
  X,
  Youtube,
  MessageCircle,
  Globe,
  Facebook,
  Instagram
} from "lucide-react"
import AboutModal from "./AboutModal.jsx"
import AccountsModal from "./AccountsModal.jsx"
import AddAccountModal from "./AddAccountModal.jsx"
import SettingsModal from "./SettingsModal.jsx"
import LaunchModal from "./LaunchModal.jsx"

export default function MainMenu({ onLogout, username, accounts, onSwitchAccount, onRemoveAccount, onAddAccount, defaultSettings, onSaveSettings, settings }){
  const [aboutOpen, setAboutOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [launchOpen, setLaunchOpen] = useState(false)

  return(
    <>

      <div className="menu-center">
        <div className="menu-strip">
          <Menu label="Hakkımızda" onClick={() => setAboutOpen(true)}>
            <Info size={36}/>
          </Menu>
          {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

          <Menu label="Hesapların" onClick={() => setAccountsOpen(true)}>
            <img src={`https://minotar.net/avatar/${username}/40`} className="avatar"/>
          </Menu>
          {accountsOpen && (
            <AccountsModal
              accounts={accounts}
              currentUser={username}
              onSelect={(name) => onSwitchAccount(name)}
              onRemove={(name) => onRemoveAccount(name)}
              onAdd={() => {
                setAccountsOpen(false)
                setAddOpen(true)
              }}
              onClose={() => setAccountsOpen(false)}
            />
          )}
          {addOpen && (
            <AddAccountModal
              onAdd={(name) => {
                onAddAccount(name)
                setAddOpen(false)
              }}
              onClose={() => setAddOpen(false)}
            />
          )}

          <Menu label="Ayarlar" onClick={() => setSettingsOpen(true)}>
            <Settings size={36}/>
          </Menu>
          {settingsOpen && (
            <SettingsModal
              value={settings}
              onSave={(v) => {
                onSaveSettings(v)
                setSettingsOpen(false)
              }}
              onReset={() => {
                onSaveSettings(defaultSettings)
              }}
              onClose={() => setSettingsOpen(false)}
            />
          )}

          <Menu label="Oyunu Başlat" primary onClick={() => setLaunchOpen(true)}>
            <Rocket size={36}/>
          </Menu>
          {launchOpen && (
            <LaunchModal
              settings={settings}
              username={username}
              uuid={accounts.find(a => a.username === username)?.uuid}
              onClose={() => setLaunchOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="player-card">
        <img src={`https://minotar.net/avatar/${username}/28`} className="player-avatar"/>
        <span className="player-name">{username}</span>
        <button className="power-btn" onClick={onLogout}>
          <CircleArrowOutUpLeft size={14}/>
        </button>
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

      <div className="footer">LeafLauncher © 2026. Tüm hakları saklıdır.</div>  
    </>
  )
}

function Menu({ children, label, primary, onClick }){
  return(
    <div
      className={`menu-item ${primary?"primary":""}`}
      onClick={onClick}
    >
      {children}
      <span>{label}</span>
    </div>
  )
}
