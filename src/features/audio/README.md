# 音源カタログ API

ゲームからは次を利用します。秘密鍵・外部 URL は不要です。

- `listNotes(): NoteDefinition[]` — id / label / filePath / pitchHz
- `getNoteById(id): NoteDefinition | undefined`
- `playCollectedNote(ctx: AudioContext, noteId: string): Promise<void>`
  - `public/sounds/` を fetch → `decodeAudioData`
  - 失敗時は短い sine にフォールバック

```ts
import { listNotes, playCollectedNote } from '../audio'

await playCollectedNote(audioContext, listNotes()[0].id)
```

開発時（`npm run dev`）はコンソールから確認できます。

```js
window.otohiroiAudio.listNotes()
await window.otohiroiAudio.playDevSample()
await window.otohiroiAudio.playDevSample('g4')
```
