# おとひろい MVP

子ども向け身体操作ゲーム「おとひろい」の専用リポジトリです。  
手追跡は [presenter-gesture-mvp](https://github.com/Stand-koike/presenter-gesture-mvp) の `GestureController` / MediaPipe パイプラインを移植しています（プレゼン PDF 機能は含みません）。

リポジトリ URL: **https://github.com/Stand-koike/otohiroi-mvp-**（末尾ハイフンに注意）

## セットアップ

```bash
npm install
npm run predev
npm run setup:models   # hand + pose モデル
```

## 開発

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/ARCHITECTURE.md` | カメラ → 推論 → ゲームの流れ |
| `docs/REPO_STATE.md` | ブランチ方針・PR の整理 |
| `src/features/audio/README.md` | 音源 API |

## プレゼンツールとの関係

| リポジトリ | 用途 |
|-----------|------|
| `presenter-gesture-mvp` | PDF プレゼン + ジェスチャー操作 |
| `otohiroi-mvp-`（本リポジトリ） | おとひろいゲームのみ |

ゲームの新機能は **本リポジトリ** で開発してください。
