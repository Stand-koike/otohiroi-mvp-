# おとひろい MVP

子ども向け身体操作ゲーム「おとひろい」の専用リポジトリです。  
手追跡は [presenter-gesture-mvp](https://github.com/Stand-koike/presenter-gesture-mvp) の `GestureController` / MediaPipe パイプラインを移植しています（プレゼン PDF 機能は含みません）。

## Cursor でこのリポジトリを開く

1. リポジトリ: **https://github.com/Stand-koike/otohiroi-mvp-**
2. 初回 push（手元の PC または権限のある環境で）:

```bash
cd otohiroi-mvp
git remote add origin https://github.com/Stand-koike/otohiroi-mvp-.git
git push -u origin main
```

空の GitHub リポジトリだけある場合は、下記「初回アップロード」も使えます。

3. **Cursor → Open Folder** または **Cloud Agent → このリポジトリを選択**
4. `.cursor/environment.json` により `npm install` とモデル取得が走ります

## セットアップ

```bash
npm install
npm run predev
npm run setup:models
```

## 開発

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## プレゼンツールとの関係

| リポジトリ | 用途 |
|-----------|------|
| `presenter-gesture-mvp` | PDF プレゼン + ジェスチャー操作 |
| `otohiroi-mvp`（本リポジトリ） | おとひろいゲームのみ |

ゲームの新機能は **本リポジトリ** で開発してください。手追跡コアの改善は必要なら元リポジトリと手動で同期します。
