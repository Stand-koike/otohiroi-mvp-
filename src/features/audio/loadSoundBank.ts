import type { NoteDefinition } from './noteCatalog'
import { NOTE_CATALOG } from './noteCatalog'

export type SoundBank = {
  buffers: Map<string, AudioBuffer>
}

/** Vite `base: './'` でも Electron の file:// でも解決できる URL にする */
export function resolveSoundUrl(filePath: string): string {
  const relative = filePath.replace(/^\//, '')
  const base = import.meta.env.BASE_URL || './'
  return new URL(relative, new URL(base, window.location.href)).href
}

async function decodeNote(
  ctx: AudioContext,
  note: NoteDefinition,
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(resolveSoundUrl(note.filePath))
    if (!response.ok) return null
    const bytes = await response.arrayBuffer()
    return await ctx.decodeAudioData(bytes.slice(0))
  } catch {
    return null
  }
}

export async function loadSoundBank(
  ctx: AudioContext,
  notes: NoteDefinition[] = NOTE_CATALOG,
): Promise<SoundBank> {
  const buffers = new Map<string, AudioBuffer>()
  await Promise.all(
    notes.map(async (note) => {
      const buffer = await decodeNote(ctx, note)
      if (buffer) buffers.set(note.id, buffer)
    }),
  )
  return { buffers }
}
