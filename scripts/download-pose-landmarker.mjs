import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dest = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'models',
  'pose_landmarker_lite.task',
)
const url =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

mkdirSync(dirname(dest), { recursive: true })
process.stdout.write(`Downloading PoseLandmarker model to ${dest}\n`)

const response = await fetch(url)
if (!response.ok) {
  throw new Error(`Failed to download model: HTTP ${response.status}`)
}

const buffer = Buffer.from(await response.arrayBuffer())
const { writeFileSync } = await import('node:fs')
writeFileSync(dest, buffer)
process.stdout.write(`Saved ${buffer.byteLength} bytes\n`)
