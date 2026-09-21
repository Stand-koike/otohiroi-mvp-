# ゲーム調整定数

子ども向けの当たり判定・出現位置・コンボは **`src/features/game/gameTuning.ts`** に集約しています。

## リズムプレイ（DDR 風）

- **BGM**: 譜面 JSON の各 `noteId` を beat 時刻に自動再生（`src/features/rhythm/chartMusic.ts`）
- **♪ 表示**: 判定 beat の `NOTE_SPAWN_LEAD_BEATS`（既定 1 beat）前からランダム位置
- **判定**: AudioContext の時刻と BPM で Perfect / Good / Miss
- **点数**: Perfect 2 / Good 1 / Miss 0（取り逃しも Miss）

| 定数 | 既定 | 意味 |
|------|------|------|
| `NOTE_SPAWN_LEAD_BEATS` | 1 | 早め表示 |
| `JUDGMENT_PERFECT_BEATS` | 0.12 | Perfect 幅 |
| `JUDGMENT_GOOD_BEATS` | 0.28 | Good 幅 |
| `JUDGMENT_MISS_LATE_BEATS` | 0.38 | 過ぎたら消える |
| `CHART_MUSIC_GAIN` | 0.42 | BGM 音量 |

## 操作

| 定数 | 値 | 意味 |
|------|-----|------|
| `HIT_RADIUS_PX` | 98 | 指先〜♪ の距離 |
| `SPAWN_Y_MIN` / `SPAWN_Y_MAX` | 0.20 / 0.68 | 出現 Y 帯 |

## スコア

`gameScore.ts` — `points` / `combo` / perfect・good・miss カウント
