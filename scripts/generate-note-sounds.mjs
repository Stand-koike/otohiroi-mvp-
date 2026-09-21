import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SAMPLE_RATE = 44100
const DURATION_SEC = 0.32

const notes = [
  { name: 'c4', hz: 261.63 },
  { name: 'e4', hz: 329.63 },
  { name: 'g4', hz: 392 },
  { name: 'c5', hz: 523.25 },
]

function encodeWav(frequencyHz) {
  const sampleCount = Math.floor(SAMPLE_RATE * DURATION_SEC)
  const data = Buffer.alloc(sampleCount * 2)
  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / SAMPLE_RATE
    const attack = Math.min(1, t / 0.012)
    const envelope = attack * Math.exp(-t * 9)
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * envelope * 0.72
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample)) * 32767), i * 2)
  }

  const header = Buffer.alloc(44)
  const byteRate = SAMPLE_RATE * 2
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/sounds')
fs.mkdirSync(outDir, { recursive: true })
for (const note of notes) {
  fs.writeFileSync(path.join(outDir, `${note.name}.wav`), encodeWav(note.hz))
}
