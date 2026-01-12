function leftRotate(x, c) {
  return (x << c) | (x >>> (32 - c))
}

function toBytesUtf8(str) {
  return new TextEncoder().encode(str)
}

function md5Bytes(inputBytes) {
  const bytes = inputBytes
  const origLenBits = bytes.length * 8

  const withOne = new Uint8Array(bytes.length + 1)
  withOne.set(bytes)
  withOne[bytes.length] = 0x80

  let padLen = withOne.length
  while ((padLen % 64) !== 56) padLen++

  const padded = new Uint8Array(padLen + 8)
  padded.set(withOne)

  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 8, origLenBits >>> 0, true)
  dv.setUint32(padded.length - 4, Math.floor(origLenBits / 2 ** 32) >>> 0, true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const K = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0
  }

  const s = [
    7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
    5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
    4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
    6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21,
  ]

  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i++) {
      M[i] = dv.getUint32(offset + i * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F, g

      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }

      const tmp = D
      D = C
      C = B
      const sum = (A + F + K[i] + M[g]) >>> 0
      B = (B + leftRotate(sum, s[i])) >>> 0
      A = tmp
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const out = new Uint8Array(16)
  const outDv = new DataView(out.buffer)
  outDv.setUint32(0, a0, true)
  outDv.setUint32(4, b0, true)
  outDv.setUint32(8, c0, true)
  outDv.setUint32(12, d0, true)
  return out
}

function bytesToUuidV3(bytes16) {
  const b = new Uint8Array(bytes16)

  b[6] = (b[6] & 0x0f) | 0x30
  b[8] = (b[8] & 0x3f) | 0x80

  const hex = [...b].map(x => x.toString(16).padStart(2, "0")).join("")
  return (
    hex.slice(0, 8) + "-" +
    hex.slice(8, 12) + "-" +
    hex.slice(12, 16) + "-" +
    hex.slice(16, 20) + "-" +
    hex.slice(20)
  )
}

export function offlineUUID(username) {
  const name = `OfflinePlayer:${username}`
  const digest = md5Bytes(toBytesUtf8(name))
  return bytesToUuidV3(digest)
}
