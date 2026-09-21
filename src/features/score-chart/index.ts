export type { ScoreChart, ScoreChartEvent, SpawnedChartNote } from './types'
export { loadScoreChart, parseScoreChart } from './loadScoreChart'
export {
  createChartNoteSpawner,
  createRandomNoteSpawner,
  type ChartNoteSpawner,
} from './noteSpawner'

/** Vite `base: './'` と Electron file:// でも public 配下を解決する */
export function resolveScoreChartUrl(relativePath: string): string {
  const relative = relativePath.replace(/^\//, '')
  const base = import.meta.env.BASE_URL || './'
  return new URL(relative, new URL(base, window.location.href)).href
}

export const DEFAULT_SCORE_CHART_URL = resolveScoreChartUrl(
  'score-charts/demo-melody.json',
)
