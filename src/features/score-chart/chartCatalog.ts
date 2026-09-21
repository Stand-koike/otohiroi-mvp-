import { resolveScoreChartUrl } from './scoreChartUrl'

export type BundledChartEntry = {
  id: string
  title: string
  /** public/ からの相対パス */
  path: string
}

/** 同梱譜面一覧（曲を増やすときは JSON + ここに 1 行） */
export const BUNDLED_CHARTS: BundledChartEntry[] = [
  {
    id: 'demo-melody',
    title: 'はじめてのメロディ',
    path: 'score-charts/demo-melody.json',
  },
  {
    id: 'bounce-melody',
    title: 'ぴょんぴょんメロディ',
    path: 'score-charts/bounce-melody.json',
  },
]

export function getBundledChartById(id: string): BundledChartEntry | undefined {
  return BUNDLED_CHARTS.find((entry) => entry.id === id)
}

export function chartUrlForEntry(entry: BundledChartEntry): string {
  return resolveScoreChartUrl(entry.path)
}

export const DEFAULT_BUNDLED_CHART_ID = BUNDLED_CHARTS[0]?.id ?? 'demo-melody'
