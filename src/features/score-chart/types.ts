/** 譜面 JSON の 1 イベント（noteId + beat）。 */
export type ScoreChartEvent = {
  noteId: string
  beat: number
}

export type ScoreChart = {
  id?: string
  title?: string
  bpm: number
  events: ScoreChartEvent[]
}

/** 画面上の ♪ インスタンス（ゲーム UI 用）。 */
export type SpawnedChartNote = {
  id: string
  x: number
  y: number
  noteId: string
  /** 譜面 events 内のインデックス（重複 spawn 防止）。ランダム fallback 時は null。 */
  chartIndex: number | null
  beat: number | null
}
