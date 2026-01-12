export function openExternal(url) {
  try {
    if (window?.launcher?.openExternal) {
      window.launcher.openExternal(url)
      return
    }
  } catch (e) {
    // sa
  }
  window.open(url, "_blank", "noopener,noreferrer")
}