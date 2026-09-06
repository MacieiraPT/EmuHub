/**
 * Generates EmuHub's application and tray icons.
 *
 * The artwork is drawn here with signed-distance functions and encoded as PNG
 * directly, so the repository carries no third-party image assets and the icons
 * can be regenerated at any size with `npm run icons`.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'resources')

const GRADIENT_TOP = [0x8b, 0x6d, 0xff]
const GRADIENT_BOTTOM = [0x59, 0x33, 0xd6]
const INK = [0xff, 0xff, 0xff]

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value)
const mix = (a, b, t) => a.map((channel, index) => Math.round(channel + (b[index] - channel) * t))

/** Signed distance to a rounded rectangle centred on (cx, cy). */
function sdRoundedRect(px, py, cx, cy, halfW, halfH, radius) {
  const dx = Math.abs(px - cx) - (halfW - radius)
  const dy = Math.abs(py - cy) - (halfH - radius)
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  return outside + Math.min(Math.max(dx, dy), 0) - radius
}

const sdCircle = (px, py, cx, cy, r) => Math.hypot(px - cx, py - cy) - r

/** Converts a signed distance into antialiased coverage. */
const coverage = (distance, feather) => clamp01(0.5 - distance / feather)

function renderIcon(size, { padding = 0 } = {}) {
  const pixels = Buffer.alloc(size * size * 4)
  const feather = Math.max(1.2, size / 64)
  const s = (value) => value * size
  const inset = padding * size
  const bodyHalf = size / 2 - inset

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5
      const py = y + 0.5

      const tile = coverage(
        sdRoundedRect(px, py, size / 2, size / 2, bodyHalf, bodyHalf, bodyHalf * 0.28),
        feather
      )

      // Gamepad silhouette: rounded body joined by two grip circles.
      const body = sdRoundedRect(px, py, size / 2, s(0.52), s(0.28), s(0.15), s(0.11))
      const leftGrip = sdCircle(px, py, s(0.31), s(0.6), s(0.115))
      const rightGrip = sdCircle(px, py, s(0.69), s(0.6), s(0.115))
      const padShape = Math.min(body, leftGrip, rightGrip)

      // Controls punched back out of the silhouette.
      const dpadV = sdRoundedRect(px, py, s(0.365), s(0.5), s(0.028), s(0.075), s(0.026))
      const dpadH = sdRoundedRect(px, py, s(0.365), s(0.5), s(0.075), s(0.028), s(0.026))
      const buttonA = sdCircle(px, py, s(0.63), s(0.455), s(0.042))
      const buttonB = sdCircle(px, py, s(0.7), s(0.535), s(0.042))
      const cutouts = Math.min(dpadV, dpadH, buttonA, buttonB)

      const glyph = clamp01(coverage(padShape, feather) - coverage(cutouts, feather))

      const gradient = mix(GRADIENT_TOP, GRADIENT_BOTTOM, y / size)
      const colour = mix(gradient, INK, glyph)
      const alpha = Math.round(tile * 255)

      const offset = (y * size + x) * 4
      pixels[offset] = colour[0]
      pixels[offset + 1] = colour[1]
      pixels[offset + 2] = colour[2]
      pixels[offset + 3] = alpha
    }
  }

  return encodePng(size, size, pixels)
}

/* ------------------------------- PNG encoder ------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const payload = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(payload))
  return Buffer.concat([length, payload, crc])
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // colour type: RGBA
  header[10] = 0
  header[11] = 0
  header[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/** Windows .ico container holding PNG-encoded entries (Vista and newer). */
function encodeIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)

  let offset = 6 + entries.length * 16
  const directory = []
  for (const entry of entries) {
    const record = Buffer.alloc(16)
    record[0] = entry.size >= 256 ? 0 : entry.size
    record[1] = entry.size >= 256 ? 0 : entry.size
    record[2] = 0
    record[3] = 0
    record.writeUInt16LE(1, 4)
    record.writeUInt16LE(32, 6)
    record.writeUInt32LE(entry.png.length, 8)
    record.writeUInt32LE(offset, 12)
    directory.push(record)
    offset += entry.png.length
  }

  return Buffer.concat([header, ...directory, ...entries.map((entry) => entry.png)])
}

mkdirSync(outputDir, { recursive: true })

const appIcon = renderIcon(512)
writeFileSync(path.join(outputDir, 'icon.png'), appIcon)
writeFileSync(path.join(outputDir, 'tray.png'), renderIcon(32, { padding: 0.02 }))
writeFileSync(path.join(outputDir, 'tray@2x.png'), renderIcon(64, { padding: 0.02 }))
writeFileSync(
  path.join(outputDir, 'icon.ico'),
  encodeIco([16, 24, 32, 48, 64, 128, 256].map((size) => ({ size, png: renderIcon(size) })))
)

console.log(`Icons written to ${outputDir}`)
