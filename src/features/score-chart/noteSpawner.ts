import { listNotes } from '../audio/noteCatalog'
import type { NormalizedPoint } from '../game/handCoords'
import type { ScoreChart, SpawnedChartNote } from './types'

const DEFAULT_MARGIN = 0.1
const DEFAULT_SPAWN_CLEARANCE = 0.14

export type NoteSpawnerOptions = {
  margin?: number
  spawnClearance?: number
}

type OrderedEvent = {
  chartIndex: number
  noteId: string
  beat: number
}

let instanceSeq = 0

function nextInstanceId(): string {
  instanceSeq += 1
  return `note-${instanceSeq}`
}

function pickRandomNoteId(): string {
  const pool = listNotes()
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return pick?.id ?? 'c4'
}

function randomPosition(
  margin: number,
  clearance: number,
  avoid?: NormalizedPoint | null,
): { x: number; y: number } {
  for (let attempt = 0; attempt < 16; attempt++) {
    const x = margin + Math.random() * (1 - margin * 2)
    const y = margin + Math.random() * (1 - margin * 2)
    if (avoid && Math.hypot(x - avoid.x, y - avoid.y) < clearance) {
      continue
    }
    return { x, y }
  }
  return {
    x: margin + Math.random() * (1 - margin * 2),
    y: margin + Math.random() * (1 - margin * 2),
  }
}

function toSpawnedNote(
  noteId: string,
  chartIndex: number | null,
  beat: number | null,
  margin: number,
  clearance: number,
  avoid?: NormalizedPoint | null,
): SpawnedChartNote {
  const { x, y } = randomPosition(margin, clearance, avoid)
  return {
    id: nextInstanceId(),
    x,
    y,
    noteId,
    chartIndex,
    beat,
  }
}

export type ChartNoteSpawner = {
  bpm: number
  /** プレイ開始時など、最初の同時表示分。 */
  initialNotes: (count: number, avoid?: NormalizedPoint | null) => SpawnedChartNote[]
  /** 取得後の補充（譜面が尽きたら noteId のみランダム fallback）。 */
  replacementNote: (avoid?: NormalizedPoint | null) => SpawnedChartNote
  /** 経過 beat に達した未スポーンイベントを返す。 */
  pollBeatSpawns: (elapsedMs: number, playStartMs: number) => SpawnedChartNote[]
}

export function createChartNoteSpawner(
  chart: ScoreChart,
  options: NoteSpawnerOptions = {},
): ChartNoteSpawner {
  const margin = options.margin ?? DEFAULT_MARGIN
  const clearance = options.spawnClearance ?? DEFAULT_SPAWN_CLEARANCE
  const ordered: OrderedEvent[] = chart.events
    .map((event, chartIndex) => ({ chartIndex, noteId: event.noteId, beat: event.beat }))
    .sort((a, b) => a.beat - b.beat || a.chartIndex - b.chartIndex)

  const spawnedChartIndices = new Set<number>()
  let replacementCursor = 0

  const markSpawned = (chartIndex: number) => {
    spawnedChartIndices.add(chartIndex)
    while (
      replacementCursor < ordered.length &&
      spawnedChartIndices.has(ordered[replacementCursor].chartIndex)
    ) {
      replacementCursor += 1
    }
  }

  const spawnFromChartIndex = (
    entry: OrderedEvent,
    avoid?: NormalizedPoint | null,
  ): SpawnedChartNote => {
    markSpawned(entry.chartIndex)
    return toSpawnedNote(entry.noteId, entry.chartIndex, entry.beat, margin, clearance, avoid)
  }

  const nextChartEntryForReplacement = (): OrderedEvent | null => {
    for (let i = replacementCursor; i < ordered.length; i += 1) {
      const entry = ordered[i]
      if (spawnedChartIndices.has(entry.chartIndex)) continue
      replacementCursor = i
      return entry
    }
    return null
  }

  return {
    bpm: chart.bpm,
    initialNotes(count, avoid) {
      const notes: SpawnedChartNote[] = []
      for (let i = 0; i < ordered.length && notes.length < count; i += 1) {
        const entry = ordered[i]
        if (spawnedChartIndices.has(entry.chartIndex)) continue
        notes.push(spawnFromChartIndex(entry, avoid))
      }
      return notes
    },
    replacementNote(avoid) {
      const entry = nextChartEntryForReplacement()
      if (entry) {
        return spawnFromChartIndex(entry, avoid)
      }
      return toSpawnedNote(pickRandomNoteId(), null, null, margin, clearance, avoid)
    },
    pollBeatSpawns(elapsedMs, playStartMs) {
      const elapsedSec = Math.max(0, (elapsedMs - playStartMs) / 1000)
      const elapsedBeats = (elapsedSec * chart.bpm) / 60
      const spawned: SpawnedChartNote[] = []
      for (const entry of ordered) {
        if (spawnedChartIndices.has(entry.chartIndex)) continue
        if (entry.beat > elapsedBeats) continue
        spawned.push(spawnFromChartIndex(entry))
      }
      return spawned
    },
  }
}

/** 譜面ロード前の暫定 spawner（従来どおりランダム noteId）。 */
export function createRandomNoteSpawner(
  options: NoteSpawnerOptions = {},
): ChartNoteSpawner {
  const margin = options.margin ?? DEFAULT_MARGIN
  const clearance = options.spawnClearance ?? DEFAULT_SPAWN_CLEARANCE
  const randomOne = (avoid?: NormalizedPoint | null) =>
    toSpawnedNote(pickRandomNoteId(), null, null, margin, clearance, avoid)

  return {
    bpm: 120,
    initialNotes(count, avoid) {
      return Array.from({ length: count }, () => randomOne(avoid))
    },
    replacementNote: randomOne,
    pollBeatSpawns: () => [],
  }
}
