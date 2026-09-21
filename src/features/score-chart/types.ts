/** 譜面 JSON の 1 音（BGM 用）。 */
export type ScoreChartEvent = {
  noteId: string
  beat: number
  /** melody=BGM のみ（既定）, bass=BGM + ♪ 出現 */
  role?: 'melody' | 'bass'
}

export type ScoreChart = {
  id?: string
  title?: string
  bpm: number
  /** BGM に流す全音（メロディ + ベース） */
  events: ScoreChartEvent[]
  /** 省略時は role=bass のイベントだけ ♪ にする */
  rhythmEvents?: ScoreChartEvent[]
}

/** 画面上の ♪ インスタンス（ゲーム UI 用）。 */
export type SpawnedChartNote = {
  id: string
  x: number
  y: number
  noteId: string
  chartIndex: number | null
  beat: number | null
}
