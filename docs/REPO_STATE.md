# リポジトリの見方

## 開発ベース

**`main` のみ**をベースにしてください。機能 PR も `main` 向けに作成します。

## 含まれる主要機能（main）

- 手追跡（MediaPipe Hand Landmarker、最大 2 手）
- 全身アバター + **とりくみ**（Pose + デフォルメ顔 + 両手 SVG）
- 複数 ♪・スコア・コンボ
- 音源カタログ（`public/sounds/` + Web Audio）
- **プレゼン PDF / ジェスチャー操作コードは削除済み**

## クローズ済み・取り込まない PR

| PR | 理由 |
|----|------|
| #4 指追従アバター | #6（全身 + 両手）で置き換え |

## 手追跡の同期

コア改善は [presenter-gesture-mvp](https://github.com/Stand-koike/presenter-gesture-mvp) 側で行い、必要な差分だけ本リポジトリへ手動で取り込みます（自動 force-push ワークフローは使いません）。
