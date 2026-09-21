import { getNoteById } from '../audio/noteCatalog'
import { loadSoundBank } from '../audio/loadSoundBank'
import { CHART_MUSIC_GAIN } from '../game/gameTuning'
import type { ScoreChart } from '../score-chart/types'

const MELODY_GAIN = CHART_MUSIC_GAIN * 0.78
const BASS_GAIN = CHART_MUSIC_GAIN * 1.05

/** 譜面イベントを BGM として AudioContext 上にスケジュール（外部ファイルなし）。 */
export async function scheduleChartMusic(
  ctx: AudioContext,
  chart: ScoreChart,
  songStartTime: number,
): Promise<() => void> {
  const bank = await loadSoundBank(ctx)
  const sources: AudioBufferSourceNode[] = []

  for (const event of chart.events) {
    const note = getNoteById(event.noteId)
    if (!note) continue
    const buffer = bank.buffers.get(note.id)
    if (!buffer) continue

    const when = songStartTime + (event.beat * 60) / chart.bpm
    if (when < ctx.currentTime - 0.05) continue

    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    gain.gain.value = event.role === 'bass' ? BASS_GAIN : MELODY_GAIN
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(when)
    sources.push(source)
  }

  return () => {
    for (const source of sources) {
      try {
        source.stop()
      } catch {
        // already stopped
      }
    }
  }
}
