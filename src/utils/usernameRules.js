export function validateMcUsername(raw) {
  const value = raw.trim()
  const mcNameRegex = /^[A-Za-z0-9_]{3,16}$/
  const blocked = new Set([
    "admin","administrator","mod","moderator","support","owner","root","system",
    "minecraft","mojang","microsoft"
  ])

  if (!value) return "Kullanıcı adı boş bırakılamaz."
  if (value.length < 3 || value.length > 16) return "Kullanıcı adı 3-16 karakter olmalı."
  if (!mcNameRegex.test(value)) return "Sadece harf, rakam ve alt çizgi (_) kullanabilirsin."
  if (value.includes("__")) return "Alt çizgiyi (__) arka arkaya kullanamazsın."
  if (blocked.has(value.toLowerCase())) return "Bu kullanıcı adı kullanılamaz."
  return ""
}