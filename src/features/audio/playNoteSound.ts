import { getNoteById, listNotes, type NoteDefinition } from './noteCatalog'
import { loadSoundBank, type SoundBank } from './loadSoundBank'

const bankByContext = new WeakMap<AudioContext, Promise<SoundBank>>()

function playSineFallback(ctx: AudioContext, frequencyHz: number) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequencyHz
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.24)
}

export function playNoteSound(
  ctx: AudioContext,
  note: NoteDefinition,
  bank?: SoundBank,
): void {
  const buffer = bank?.buffers.get(note.id)
  if (buffer) {
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    gain.gain.value = 0.9
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(ctx.currentTime)
    return
  }
  playSineFallback(ctx, note.pitchHz ?? 440)
}

function getOrLoadBank(ctx: AudioContext): Promise<SoundBank> {
  let pending = bankByContext.get(ctx)
  if (!pending) {
    pending = loadSoundBank(ctx)
    bankByContext.set(ctx, pending)
  }
  return pending
}

/** ゲーム側（担当 B）が拾った音符を鳴らす入口 */
export async function playCollectedNote(ctx: AudioContext, noteId: string): Promise<void> {
  const note = getNoteById(noteId)
  if (!note) {
    playSineFallback(ctx, 440)
    return
  }
  const bank = await getOrLoadBank(ctx)
  playNoteSound(ctx, note, bank)
}

/** ブラウザコンソール / 開発確認用。ユーザー操作なしでも Electron では鳴ることが多い */
export async function playDevSample(noteId?: string): Promise<void> {
  const ctx = new AudioContext()
  await ctx.resume()
  const id = noteId ?? listNotes()[0]?.id
  if (!id) return
  await playCollectedNote(ctx, id)
}
