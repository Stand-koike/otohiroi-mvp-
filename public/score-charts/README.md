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

## 同梱曲を増やす

1. このフォルダに JSON を追加
2. `src/features/score-chart/chartCatalog.ts` の `BUNDLED_CHARTS` に 1 行追加

ホーム画面の「なかまのきょく」に表示されます。

読み込み: `loadScoreChart` に `score-charts/demo-melody.json`（相対）または `DEFAULT_SCORE_CHART_URL` を渡す（`src/features/score-chart/`）
