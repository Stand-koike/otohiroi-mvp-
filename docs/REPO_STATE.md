# ブランチと main の整理

## 正しい開発ベース

**`main`** が唯一の統合ブランチです（2026-09-21 時点で以下を含む）。

- MVP 取り込み（#1）
- 音源カタログ（#2）
- 複数音符・スコア・コンボ（#3）
- ゲームからの音源再生配線（#5 相当、`cursor/note-catalog-game-audio-8486` の内容）

以前、Agent PR #2 / #3 が **`cursor/import-otohiroi-mvp-8486` 向け**にマージされていたため、`main` だけ見ると README のみに見える状態がありました。Cloud Agent が **`main` を `5f4bd90` まで fast-forward** 済みです。

## まだ main に入っていないもの

- **#4 Stylized avatar（指追従版）** — v2（全身 Pose + 両手）で置き換え予定のため、未マージ推奨
- **#5 Open PR** — 内容はすでに `main` に含まれている場合は PR を close してよい

## 新機能ブランチ

全身アバター + 両手: `cursor/full-body-dual-hands-8486`
