# 音源カタログ API（担当 B 向け）

ゲームロジックからは次だけ使えばよい。秘密鍵・外部 URL は不要。

- `listNotes(): NoteDefinition[]` — 音符定義（id / label / filePath / pitchHz）
- `getNoteById(id): NoteDefinition | undefined`
- `playCollectedNote(ctx: AudioContext, noteId: string): Promise<void>`
  - `public/sounds/` を fetch → `decodeAudioData`
  - 失敗時は既存と同じ短い sine にフォールバック

```ts
import { listNotes, playCollectedNote } from '../audio'

const notes = listNotes()
await playCollectedNote(audioContext, notes[0].id)
```

開発時（`npm run dev`）はページ読み込み後、コンソールでユーザー操作なしに確認できます。

```js
window.otohiroiAudio.listNotes()
await window.otohiroiAudio.playDevSample() // 最初の音符（ド）
await window.otohiroiAudio.playDevSample('g4')
```
