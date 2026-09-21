# otohiroi-mvp- リモートへ反映する

Cloud Agent（`cursor[bot]`）は **`presenter-gesture-mvp` にしか push できない**ため、おとひろい本体はブランチ `export/otohiroi-mvp-initial` に置いてあります。

## 方法 A: GitHub Actions（推奨）

1. GitHub → **Stand-koike/presenter-gesture-mvp** → **Settings → Secrets and variables → Actions**
2. **New repository secret**
   - Name: `OTOHIROI_MVP_PUSH_TOKEN`
   - Value: [Fine-grained PAT](https://github.com/settings/tokens?type=beta)（`otohiroi-mvp-` の Contents: Read and write）
3. **Actions** → **Publish to otohiroi-mvp-** → **Run workflow**

成功すると https://github.com/Stand-koike/otohiroi-mvp- の `main` が埋まります。

## 方法 B: 手元の git（PAT または SSH）

```bash
git clone --branch export/otohiroi-mvp-initial --depth 1 \
  https://github.com/Stand-koike/presenter-gesture-mvp.git otohiroi-temp
cd otohiroi-temp
git remote set-url origin https://github.com/Stand-koike/otohiroi-mvp-.git
git push -u origin HEAD:main
```

## Cursor で otohiroi-mvp- を開く

リモートに `main` ができたあと、Cloud Agent のリポジトリを **Stand-koike/otohiroi-mvp-** にしてください。
