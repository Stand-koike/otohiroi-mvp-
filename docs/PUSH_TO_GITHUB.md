# GitHub への初回 push

リモート: `https://github.com/Stand-koike/otohiroi-mvp-.git`

Cloud Agent の bot には新規リポジトリへの write 権限がない場合があります。  
**ご自身の GitHub アカウント**で次を実行してください。

## 方法 A: このフォルダから push

```bash
cd /path/to/otohiroi-mvp
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Stand-koike/otohiroi-mvp-.git
git push -u origin main
```

## 方法 B: GitHub が空で、フォルダだけ手元にある

```bash
git clone https://github.com/Stand-koike/otohiroi-mvp-.git
cd otohiroi-mvp-
# プロジェクト一式をこのディレクトリにコピー（.git は残す）
git add -A
git commit -m "Initial import: おとひろい MVP"
git push -u origin main
```

## 方法 C: bundle で持ち運び

ソースがあるマシンで:

```bash
cd otohiroi-mvp
git bundle create otohiroi-mvp.bundle main
```

別マシンで:

```bash
git clone https://github.com/Stand-koike/otohiroi-mvp-.git
cd otohiroi-mvp-
git pull /path/to/otohiroi-mvp.bundle main
git push -u origin main
```

## Cursor Cloud Agent でこのリポジトリを使う

push 後、Cursor の **New Agent** で `Stand-koike/otohiroi-mvp-` を選択してください。
