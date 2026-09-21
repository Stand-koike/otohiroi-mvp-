export type { ScoreChart, ScoreChartEvent, SpawnedChartNote } from './types'
export { loadScoreChart, parseScoreChart } from './loadScoreChart'
export {
  createChartNoteSpawner,
  createRandomNoteSpawner,
  type ChartNoteSpawner,
} from './noteSpawner'

export const DEFAULT_SCORE_CHART_URL = '/score-charts/demo-melody.json'
