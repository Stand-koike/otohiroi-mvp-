import { listNotes } from '../audio/noteCatalog'
import { randomSpawnPosition } from '../game/gameTuning'
import type { NormalizedPoint } from '../game/handCoords'
import type { ScoreChart, SpawnedChartNote } from './types'

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

function toSpawnedNote(
  noteId: string,
  chartIndex: number | null,
  beat: number | null,
  avoid?: NormalizedPoint | null,
): SpawnedChartNote {
  const { x, y } = randomSpawnPosition(avoid)
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

export function createChartNoteSpawner(chart: ScoreChart): ChartNoteSpawner {
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
    return toSpawnedNote(entry.noteId, entry.chartIndex, entry.beat, avoid)
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
      return toSpawnedNote(pickRandomNoteId(), null, null, avoid)
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
export function createRandomNoteSpawner(): ChartNoteSpawner {
  const randomOne = (avoid?: NormalizedPoint | null) =>
    toSpawnedNote(pickRandomNoteId(), null, null, avoid)

  return {
    bpm: 120,
    initialNotes(count, avoid) {
      return Array.from({ length: count }, () => randomOne(avoid))
    },
    replacementNote: randomOne,
    pollBeatSpawns: () => [],
  }
}
