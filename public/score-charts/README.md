# score-charts/

譜面 JSON。**メロディは長く流す・♪ はベースリズムだけ** が基本です。

## 形式

```json
{
  "id": "demo-melody",
  "title": "はじめてのメロディ",
  "bpm": 96,
  "events": [
    { "noteId": "c4", "beat": 0, "role": "bass" },
    { "noteId": "e4", "beat": 0.5, "role": "melody" }
  ]
}
```

| フィールド | 意味 |
|-----------|------|
| `events` | **BGM** に流す全音（メロディ + ベース） |
| `role: "melody"` | BGM のみ（♪ なし）省略時も melody 扱い |
| `role: "bass"` | BGM + **♪ 出現**（リズム取り用） |
| `rhythmEvents` | 省略可。指定時はこちらだけ ♪（BGM は `events` のまま） |

## 長い曲を作る

```bash
node scripts/expand-score-charts.mjs
```

8 小節分の JSON を `demo-melody.json` / `bounce-melody.json` に書き出します。  
手編集する場合は `events` にメロディをたくさん足し、`role: "bass"` だけ ♪ に載せてください。

## 同梱曲を増やす

1. JSON を追加（または上記スクリプトを参考に作成）
2. `src/features/score-chart/chartCatalog.ts` の `BUNDLED_CHARTS` に 1 行
