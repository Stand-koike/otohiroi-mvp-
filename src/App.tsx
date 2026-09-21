import { useMemo, useState } from 'react'
import { OtohiroiGame } from './features/game/OtohiroiGame'
import { SongPicker } from './features/game/SongPicker'
import {
  BUNDLED_CHARTS,
  DEFAULT_BUNDLED_CHART_ID,
  chartUrlForEntry,
  getBundledChartById,
} from './features/score-chart'

export function App() {
  const [playing, setPlaying] = useState(false)
  const [selectedChartId, setSelectedChartId] = useState(DEFAULT_BUNDLED_CHART_ID)

  const selectedChart = useMemo(
    () => getBundledChartById(selectedChartId) ?? BUNDLED_CHARTS[0],
    [selectedChartId],
  )

  const chartUrl = useMemo(
    () => (selectedChart ? chartUrlForEntry(selectedChart) : ''),
    [selectedChart],
  )

  if (!playing) {
    return (
      <main className="otohiroi-entry">
        <h1>おとひろい</h1>
        <p className="otohiroi-entry__hint">おんがくにあわせて ♪ をリズムでひろおう</p>
        <SongPicker
          charts={BUNDLED_CHARTS}
          selectedId={selectedChart.id}
          onSelect={setSelectedChartId}
        />
        <button
          type="button"
          className="otohiroi-entry__start"
          onClick={() => setPlaying(true)}
        >
          はじめる
        </button>
      </main>
    )
  }

  return (
    <OtohiroiGame
      chartUrl={chartUrl}
      songTitle={selectedChart.title}
      onBack={() => setPlaying(false)}
    />
  )
}
