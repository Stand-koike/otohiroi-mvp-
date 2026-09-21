# score-charts/

譜面 JSON（`{ noteId, beat }` の列）を置きます。外部 API は使いません。

## 形式

```json
{
  "id": "demo-melody",
  "bpm": 96,
  "events": [
    { "noteId": "c4", "beat": 0 },
    { "noteId": "e4", "beat": 1 }
  ]
}
```

- `noteId` は `src/features/audio/noteCatalog.ts` に存在する ID のみ
- `beat` は 0 起点。経過時間 `(beat * 60) / bpm` 秒で ♪ がスポーンします
- 取得後の補充も譜面順（未スポーン分）→ 尽きたら従来どおりランダム `noteId`

読み込み: `loadScoreChart('/score-charts/demo-melody.json')`（`src/features/score-chart/`）
