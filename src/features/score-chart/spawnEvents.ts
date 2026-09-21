import type { ScoreChart, ScoreChartEvent } from './types'

/** ♪ を出すイベント（ベースリズム優先） */
export function getSpawnEvents(chart: ScoreChart): ScoreChartEvent[] {
  if (chart.rhythmEvents?.length) {
    return chart.rhythmEvents
  }
  const bass = chart.events.filter((event) => event.role === 'bass')
  if (bass.length > 0) {
    return bass
  }
  return chart.events
}
