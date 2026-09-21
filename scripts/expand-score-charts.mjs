/**
 * 同梱譜面 JSON を生成（メロディ長尺 + ベースのみ ♪）。
 * node scripts/expand-score-charts.mjs
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'score-charts')

function buildDemoMelody() {
  const events = []
  for (let bar = 0; bar < 8; bar += 1) {
    const b = bar * 4
    events.push({ noteId: 'c4', beat: b, role: 'bass' })
    events.push({ noteId: 'g4', beat: b + 2, role: 'bass' })
    const melodyPattern = [
      [0, 'e4'],
      [0.5, 'g4'],
      [1, 'c5'],
      [1.5, 'g4'],
      [2, 'e4'],
      [2.5, 'g4'],
      [3, 'c5'],
      [3.5, 'e4'],
    ]
    for (const [offset, noteId] of melodyPattern) {
      events.push({ noteId, beat: b + offset, role: 'melody' })
    }
  }
  return {
    id: 'demo-melody',
    title: 'はじめてのメロディ',
    bpm: 96,
    events,
  }
}

function buildBounceMelody() {
  const events = []
  for (let bar = 0; bar < 8; bar += 1) {
    const b = bar * 4
    events.push({ noteId: 'c4', beat: b, role: 'bass' })
    events.push({ noteId: 'c4', beat: b + 1, role: 'bass' })
    events.push({ noteId: 'g4', beat: b + 2, role: 'bass' })
    events.push({ noteId: 'c4', beat: b + 3, role: 'bass' })
    const melodyPattern = [
      [0.5, 'e4'],
      [1, 'g4'],
      [1.5, 'c5'],
      [2.5, 'g4'],
      [3, 'e4'],
      [3.5, 'g4'],
    ]
    for (const [offset, noteId] of melodyPattern) {
      events.push({ noteId, beat: b + offset, role: 'melody' })
    }
  }
  return {
    id: 'bounce-melody',
    title: 'ぴょんぴょんメロディ',
    bpm: 108,
    events,
  }
}

for (const chart of [buildDemoMelody(), buildBounceMelody()]) {
  const path = join(root, `${chart.id}.json`)
  writeFileSync(path, `${JSON.stringify(chart, null, 2)}\n`)
  const bass = chart.events.filter((e) => e.role === 'bass').length
  const melody = chart.events.filter((e) => e.role === 'melody').length
  process.stdout.write(
    `Wrote ${path} (${melody} melody + ${bass} bass, ~${(8 * 4 * 60) / chart.bpm}s)\n`,
  )
}
