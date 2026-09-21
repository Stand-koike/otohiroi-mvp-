# ゲーム調整定数

`src/features/game/OtohiroiGame.tsx` および関連モジュールで使う主な値です。

| 定数 | 値 | 意味 |
|------|-----|------|
| `SIMULTANEOUS_NOTE_COUNT` | 3 | 同時表示 ♪ |
| `NOTE_RADIUS_PX` | 52 | 音符の表示半径 |
| `FINGER_RADIUS_PX` | 28 | 当たり判定用（指先） |
| `HIT_RADIUS_PX` | 80 | 取得距離（上2つの和） |
| `MARGIN` | 0.1 | 出現位置の余白（正規化） |
| `SPAWN_CLEARANCE` | 0.14 | 再スポーン時、指の近くを避ける距離 |
| `POSE_STABLE_FRAMES` | 45 | とりくみ完了までの Pose 連続フレーム（FullBodyAvatar） |

コンボ時間などは `src/features/game/gameScore.ts` を参照してください。
