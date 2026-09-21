import type { BundledChartEntry } from '../score-chart/chartCatalog'

type Props = {
  charts: BundledChartEntry[]
  selectedId: string
  onSelect: (id: string) => void
}

export function SongPicker({ charts, selectedId, onSelect }: Props) {
  return (
    <fieldset className="otohiroi-entry__songs">
      <legend className="otohiroi-entry__songs-label">なかまのきょく</legend>
      <ul className="otohiroi-entry__song-list">
        {charts.map((chart) => {
          const selected = chart.id === selectedId
          return (
            <li key={chart.id}>
              <button
                type="button"
                className={`otohiroi-entry__song${selected ? ' is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelect(chart.id)}
              >
                {chart.title}
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
