# andenknt31113.github.io

`app-ads.txt` の配信と、**ZER01 barber & lounge の Google ビジネスプロフィール自動投稿** の
ソース置き場です。

## Google ビジネスプロフィール 自動投稿

2日に1回、60パターンの本文と画像を順番に使って「最新情報」を自動投稿します。
方式が2つあり、**現在はスプレッドシート版を採用**しています。

### ① スプレッドシート版（採用中・費用0円）

Googleスプレッドシートに投稿を並べ、Apps Scriptが投稿予定日に自動投稿します。
運用する人はスプレッドシートを見るだけで、GitHubを触る必要はありません。

**→ 手順書: [docs/SETUP-AppsScript.md](docs/SETUP-AppsScript.md)**

| ファイル | 役割 |
|---|---|
| `content/ZER01_投稿一覧.csv` | スプレッドシートに取り込む60件のデータ |
| `apps-script/Code.gs` | スプレッドシートに貼り付けるスクリプト |
| `apps-script/appsscript.json` | 同上（権限設定） |

### ② GitHub Actions版（停止中）

GitHub Actionsが毎日起動して投稿する方式。動作する状態ですが、
`.github/workflows/gbp-auto-post.yml` の定期実行はコメントアウトして止めてあります。
使う場合はコメントを外してください。

**→ 手順書: [docs/SETUP-GitHub.md](docs/SETUP-GitHub.md)**

| ファイル | 役割 |
|---|---|
| `content/posts.json` | 投稿本文60パターン |
| `content/config.json` | 投稿間隔・ボタンの設定 |
| `content/state.json` | 前回投稿日時と次のパターン（自動更新） |
| `images/` | 画像置き場（GitHub Pagesで公開される） |
| `scripts/gbp_post.py` | 投稿プログラム |

```bash
python3 scripts/gbp_post.py --check     # 本文と画像の設定を検証
python3 scripts/gbp_post.py --dry-run   # 投稿せず、送信内容だけ確認
```

## どちらの方式でも必要なこと

Googleビジネスプロフィールへプログラムから投稿するには、Google Cloudプロジェクト単位で
**Business Profile API の利用申請**（無料・審査は最大14日）を1回通す必要があります。
手順は各手順書に記載しています。

## 投稿文について

元のWordファイルは「60パターン」でしたが実際は20パターンの3回繰り返しだったため、
No.1〜20は原文のまま、No.21〜40 / No.41〜60 は同じトピック・同じ情報のまま言い回しを変えた版に
差し替えて重複を解消しています。
