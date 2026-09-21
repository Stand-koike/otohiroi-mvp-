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
- `beat` は 0 起点。**BGM と ♪ は同じ beat 時刻**に揃います（AudioContext 同期）
- ♪ は判定の約 1 beat 前からランダム位置に表示
- 指で触るタイミングで Perfect / Good / Miss（早すぎる触りは無効）

## 同梱曲を増やす

1. このフォルダに JSON を追加
2. `src/features/score-chart/chartCatalog.ts` の `BUNDLED_CHARTS` に 1 行追加

ホーム画面の「なかまのきょく」に表示されます。

読み込み: `loadScoreChart` に `score-charts/demo-melody.json`（相対）または `DEFAULT_SCORE_CHART_URL` を渡す（`src/features/score-chart/`）
