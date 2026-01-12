import logo from "../assets/images/logo.png"

export default function Bootstrap() {
  return (
    <div className="bootstrap">
      <div className="bootstrap-box">
        <img src={logo} alt="Launcher Logo" className="bootstrap-logo" />
        <div className="bootstrap-sub">Launcher başlatılıyor...</div>

        <div className="bootstrap-bar">
          <span />
        </div>
      </div>
    </div>
  )
}
