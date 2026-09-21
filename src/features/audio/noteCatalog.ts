export type NoteDefinition = {
  id: string
  label: string
  /** public/ からの相対パス（先頭スラッシュなし。外部 URL は使わない） */
  filePath: string
  /** フォールバック sine 用の周波数（Hz） */
  pitchHz?: number
}

export const NOTE_CATALOG: NoteDefinition[] = [
  { id: 'c4', label: 'ド', filePath: 'sounds/c4.wav', pitchHz: 261.63 },
  { id: 'e4', label: 'ミ', filePath: 'sounds/e4.wav', pitchHz: 329.63 },
  { id: 'g4', label: 'ソ', filePath: 'sounds/g4.wav', pitchHz: 392 },
  { id: 'c5', label: '高いド', filePath: 'sounds/c5.wav', pitchHz: 523.25 },
]

const notesById = new Map(NOTE_CATALOG.map((note) => [note.id, note]))

export function getNoteById(id: string): NoteDefinition | undefined {
  return notesById.get(id)
}

export function listNotes(): NoteDefinition[] {
  return NOTE_CATALOG.slice()
}

export function isKnownNoteId(id: string): boolean {
  return notesById.has(id)
}
