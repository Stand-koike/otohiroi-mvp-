# ゲーム調整定数

子ども向けの当たり判定・出現位置・コンボは **`src/features/game/gameTuning.ts`** に集約しています。値を変えたら `npm run build` で確認してください。

## ゲームプレイ（gameTuning.ts）

| 定数 | 値 | 意味 |
|------|-----|------|
| `NOTE_RADIUS_PX` | 58 | 音符 ♪ の表示半径 |
| `HIT_RADIUS_PX` | 98 | 取得距離（指先〜音符中心）。表示より広め |
| `SIMULTANEOUS_NOTE_COUNT` | 2 | 同時表示 ♪（認知負荷を抑える） |
| `SPAWN_X_MARGIN` | 0.08 | 左右の出現余白（正規化） |
| `SPAWN_Y_MIN` / `SPAWN_Y_MAX` | 0.20 / 0.68 | 出現 Y 帯（腰〜胸付近。画面上下端を避ける） |
| `SPAWN_CLEARANCE` | 0.16 | 再スポーン時、指の近くを避ける距離 |
| `COMBO_IDLE_RESET_MS` | 2400 | コンボが途切れるまでの猶予（ms） |
| `COMBO_EXPIRE_POLL_MS` | 120 | コンボ UI の更新間隔 |

## スコア（gameScore.ts）

`COMBO_IDLE_RESET_MS` は `gameTuning.ts` から import しています。

## アバター準備（変更しない場合の参考）

| 定数 | 場所 | 値 | 意味 |
|------|------|-----|------|
| `POSE_STABLE_FRAMES` | `FullBodyAvatar.tsx` | 45 | とりくみ完了までの Pose 連続フレーム |
