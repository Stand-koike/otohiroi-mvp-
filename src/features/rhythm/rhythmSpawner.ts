import { NOTE_SPAWN_LEAD_BEATS, randomSpawnPosition } from '../game/gameTuning'
import { getSpawnEvents } from '../score-chart/spawnEvents'
import type { ScoreChart, SpawnedChartNote } from '../score-chart/types'

type ChartEventRef = {
  chartIndex: number
  noteId: string
  targetBeat: number
}

let instanceSeq = 0

function nextInstanceId(): string {
  instanceSeq += 1
  return `note-${instanceSeq}`
}

export type RhythmNoteSpawner = {
  bpm: number
  /** 表示開始 beat に達した未出現イベントをランダム位置に出す */
  pollSpawnNotes: (currentBeat: number) => SpawnedChartNote[]
}

export function createRhythmNoteSpawner(chart: ScoreChart): RhythmNoteSpawner {
  const spawnEvents = getSpawnEvents(chart)
  const ordered: ChartEventRef[] = spawnEvents
    .map((event, chartIndex) => ({
      chartIndex,
      noteId: event.noteId,
      targetBeat: event.beat,
    }))
    .sort((a, b) => a.targetBeat - b.targetBeat || a.chartIndex - b.chartIndex)

  const spawnedChartIndices = new Set<number>()

  return {
    bpm: chart.bpm,
    pollSpawnNotes(currentBeat) {
      const spawned: SpawnedChartNote[] = []
      for (const entry of ordered) {
        if (spawnedChartIndices.has(entry.chartIndex)) continue
        const spawnAt = entry.targetBeat - NOTE_SPAWN_LEAD_BEATS
        if (currentBeat < spawnAt) continue
        spawnedChartIndices.add(entry.chartIndex)
        const { x, y } = randomSpawnPosition()
        spawned.push({
          id: nextInstanceId(),
          x,
          y,
          noteId: entry.noteId,
          chartIndex: entry.chartIndex,
          beat: entry.targetBeat,
        })
      }
      return spawned
    },
  }
}
