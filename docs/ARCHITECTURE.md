# ARCHITECTURE（おとひろい）

## データフロー

```text
Camera (getUserMedia)
  → Hand Landmarker（最大2手）— GestureController
  → Pose Landmarker — FullBodyAvatar
  → onStatusChange（handsLandmarks）
  → touchPointsFromSnapshot → 当たり判定・スコア
  → アバター SVG（骨格 + デフォルメ顔 + 両手）
```

プレゼン用ジェスチャー（スワイプ・PDF 操作）は **本リポジトリには含めません**。

## レイヤー

| パス | 役割 |
|------|------|
| `camera/` | カメラ起動・エラー |
| `gesture/` | Hand Landmarker のみ（`GestureController`） |
| `pose/` | Pose Landmarker 初期化 |
| `avatar/` | とりくみ UI・デフォルメ・全身 SVG |
| `game/` | 音符・スコア・画面 |
| `audio/` | 音源カタログと再生 |

## Electron

- contextIsolation: true
- nodeIntegration: false
- sandbox: true
