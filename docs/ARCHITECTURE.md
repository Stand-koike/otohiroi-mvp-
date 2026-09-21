# ARCHITECTURE（おとひろい MVP）

## データフロー

```text
Camera (getUserMedia)
  → MediaPipe HandLandmarker (最大2手) + Pose Landmarker（全身）
  → GestureController (gesturesActive=false, handsLandmarks)
  → handCoords.touchPointsFromSnapshot → OtohiroiGame（両手当たり判定）
  → FullBodyAvatar（Pose + キャプチャデフォルメ）
```

プレゼン用の `GestureRecognizer.observe()` はゲーム中は呼ばれません（`gesturesActive={false}`）。

## レイヤー

- **camera/** — カメラ起動とエラーメッセージ
- **gesture/** — HandLandmarker 初期化・RAF ループ（元 presenter-gesture-mvp からコピー）
- **game/** — ゲーム固有 UI とロジック
- **presentation/commands.ts** — `GestureRecognizer` が参照するコマンド型のみ（PDF レンダラはなし）

## セキュリティ（Electron）

`electron/main.cjs` と同様:

- contextIsolation: true
- nodeIntegration: false
- sandbox: true
