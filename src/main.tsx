import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { App } from './App'

if (import.meta.env.DEV) {
  void import('./features/audio').then((audio) => {
    ;(window as Window & { otohiroiAudio?: typeof audio }).otohiroiAudio = audio
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
