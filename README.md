# andenknt31113.github.io

`app-ads.txt` の配信と、**ZER01 barber & lounge の Google ビジネスプロフィール自動投稿** を
このリポジトリで動かしています。

## Google ビジネスプロフィール 自動投稿

2日に1回、60パターンの本文を順番に使って「最新情報」を自動投稿します。

- **セットアップ手順 → [docs/SETUP.md](docs/SETUP.md)**
- 画像の置き方 → [images/README.md](images/README.md)

| ファイル | 役割 |
|---|---|
| `content/posts.json` | 投稿本文 60パターン |
| `content/config.json` | 投稿間隔・ボタン・画像URLの設定 |
| `content/state.json` | 前回投稿日時と次に使うパターン（自動更新） |
| `images/` | 投稿画像の置き場所 |
| `scripts/gbp_post.py` | 投稿プログラム |
| `.github/workflows/gbp-auto-post.yml` | 毎日10:00(JST)に起動するスケジュール |

### よく使うコマンド

```bash
python3 scripts/gbp_post.py --check     # 本文と画像の設定を検証
python3 scripts/gbp_post.py --dry-run   # 投稿せず、送信内容だけ確認
```

手動で投稿したいときは、GitHub の **Actions > GBP 自動投稿 > Run workflow** から実行できます。
