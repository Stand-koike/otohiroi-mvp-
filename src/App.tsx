import { useState } from 'react'
import { OtohiroiGame } from './features/game/OtohiroiGame'

export function App() {
  const [playing, setPlaying] = useState(false)

  if (!playing) {
    return (
      <main className="otohiroi-entry">
        <h1>おとひろい</h1>
        <p className="otohiroi-entry__hint">手で ♪ をひろって音をならそう</p>
        <button type="button" className="otohiroi-entry__start" onClick={() => setPlaying(true)}>
          はじめる
        </button>
      </main>
    )
  }

  return <OtohiroiGame onBack={() => setPlaying(false)} />
}
