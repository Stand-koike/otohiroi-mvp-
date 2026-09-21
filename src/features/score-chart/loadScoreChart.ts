import { getNoteById } from '../audio/noteCatalog'
import type { ScoreChart, ScoreChartEvent } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseEvent(raw: unknown, index: number): ScoreChartEvent {
  if (!isRecord(raw)) {
    throw new Error(`events[${index}] must be an object`)
  }
  const noteId = raw.noteId
  const beat = raw.beat
  if (typeof noteId !== 'string' || !noteId.trim()) {
    throw new Error(`events[${index}].noteId must be a non-empty string`)
  }
  if (typeof beat !== 'number' || !Number.isFinite(beat) || beat < 0) {
    throw new Error(`events[${index}].beat must be a non-negative number`)
  }
  if (!getNoteById(noteId)) {
    throw new Error(`events[${index}].noteId "${noteId}" is not in the sound catalog`)
  }
  let role: ScoreChartEvent['role'] = 'melody'
  if (raw.role !== undefined) {
    if (raw.role !== 'melody' && raw.role !== 'bass') {
      throw new Error(`events[${index}].role must be "melody" or "bass"`)
    }
    role = raw.role
  }
  return { noteId, beat, role }
}

export function parseScoreChart(json: unknown): ScoreChart {
  if (!isRecord(json)) {
    throw new Error('chart must be a JSON object')
  }
  const bpm = json.bpm
  if (typeof bpm !== 'number' || !Number.isFinite(bpm) || bpm <= 0) {
    throw new Error('chart.bpm must be a positive number')
  }
  const eventsRaw = json.events
  if (!Array.isArray(eventsRaw) || eventsRaw.length === 0) {
    throw new Error('chart.events must be a non-empty array')
  }
  const events = eventsRaw.map((item, index) => parseEvent(item, index))

  let rhythmEvents: ScoreChartEvent[] | undefined
  const rhythmRaw = json.rhythmEvents
  if (rhythmRaw !== undefined) {
    if (!Array.isArray(rhythmRaw) || rhythmRaw.length === 0) {
      throw new Error('chart.rhythmEvents must be a non-empty array when set')
    }
    rhythmEvents = rhythmRaw.map((item, index) => parseEvent(item, index))
  }

  return {
    id: typeof json.id === 'string' ? json.id : undefined,
    title: typeof json.title === 'string' ? json.title : undefined,
    bpm,
    events,
    rhythmEvents,
  }
}

/** public/ 配下の譜面 JSON を取得する（外部 API なし）。 */
export async function loadScoreChart(url: string): Promise<ScoreChart> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`failed to load chart: ${response.status}`)
  }
  const json: unknown = await response.json()
  return parseScoreChart(json)
}
