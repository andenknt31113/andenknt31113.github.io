# ZER01 barber & lounge｜Google ビジネスプロフィール 自動投稿 セットアップ手順

2日に1回、60パターンの本文を順番に使って「最新情報」を自動投稿する仕組みです。
GitHub Actions が毎日 日本時間10:00 に起動し、前回投稿から2日経っていれば投稿します。

---

## 全体像

| 何を | どこ |
|---|---|
| 投稿本文 60パターン | `content/posts.json` |
| 投稿画像 | `images/` フォルダ（ご自身でアップロード） |
| 投稿間隔・ボタン設定 | `content/config.json` |
| 次に使うパターン・前回投稿日時 | `content/state.json`（自動更新） |
| 実行スケジュール | `.github/workflows/gbp-auto-post.yml` |
| 投稿プログラム | `scripts/gbp_post.py` |

画像は `images/` に置くと `https://andenknt31113.github.io/images/ファイル名` として
公開され、その URL を Google に渡して投稿します。

---

## 手順1. 画像をアップロードする

`images/` フォルダに投稿用の画像を置いてください。詳しくは `images/README.md` を参照。
ファイル名の並び順が投稿順になります（`01.jpg`, `02.jpg` …）。

## 手順2. GitHub Pages が有効か確認する

GitHub の **Settings > Pages** で、Source が `Deploy from a branch` / `main` / `/ (root)`
になっていることを確認してください。画像の URL はこの公開設定に依存します。

アップロード後、ブラウザで `https://andenknt31113.github.io/images/01.jpg` を開いて
画像が表示されれば OK です（反映まで数分かかることがあります）。

## 手順3. Google 側の準備（ここが一番の関門です）

Google ビジネスプロフィールへの API 投稿には、Google からの **API 利用申請の承認** が必要です。
承認には通常 数日〜2週間程度かかります。

### 3-1. Google Cloud プロジェクトを作る

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 「APIとサービス > ライブラリ」で以下を有効化
   - **My Business Account Management API**
   - **My Business Business Information API**
   - **Google My Business API**（v4。申請承認後に一覧へ出てきます）

### 3-2. API 利用を申請する

[Google Business Profile APIs のアクセス申請フォーム](https://developers.google.com/my-business/content/prereqs#request-access)
から申請します。作成した Google Cloud プロジェクト番号と、ビジネスプロフィールの
管理アカウント（オーナー権限のあるアカウント）が必要です。

> 承認が下りるまでは API から投稿できません。それまでは手動投稿を続けてください。

### 3-3. OAuth クライアントを作る

1. 「APIとサービス > OAuth 同意画面」を設定（ユーザーの種類は「外部」、テストユーザーに
   ビジネスプロフィールの管理アカウントを追加）
2. 「認証情報 > 認証情報を作成 > OAuth クライアント ID」→ 種類は **デスクトップアプリ**
3. 表示された **クライアント ID** と **クライアント シークレット** を控える

### 3-4. リフレッシュトークンを取得する

[OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) を使うのが簡単です。

1. 右上の歯車 → **Use your own OAuth credentials** にチェックを入れ、3-3 のクライアント ID /
   シークレットを入力
2. 左側の入力欄に次のスコープを貼り付けて **Authorize APIs**
   ```
   https://www.googleapis.com/auth/business.manage
   ```
3. ビジネスプロフィールの管理アカウントでログインして許可
4. **Exchange authorization code for tokens** を押し、表示された **Refresh token** を控える

> OAuth Playground を使う場合は、3-3 で作成したクライアントの「承認済みリダイレクト URI」に
> `https://developers.google.com/oauthplayground` を追加しておいてください。

### 3-5. アカウント ID と店舗（ロケーション）ID を調べる

3-4 で取得したアクセストークンを使い、次を実行します（`ACCESS_TOKEN` は置き換え）。

```bash
# アカウント一覧
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  https://mybusinessaccountmanagement.googleapis.com/v1/accounts

# 店舗一覧（accounts/123456789 は上で得た name に置き換え）
curl -H "Authorization: Bearer ACCESS_TOKEN" \
  "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123456789/locations?readMask=name,title"
```

- `accounts/123456789` の **123456789** が アカウント ID
- `locations/987654321` の **987654321** が ロケーション ID（ZER01 barber & lounge のもの）

## 手順4. GitHub に認証情報を登録する

GitHub の **Settings > Secrets and variables > Actions > New repository secret** で
以下の5つを登録します。

| Secret 名 | 中身 |
|---|---|
| `GBP_CLIENT_ID` | 3-3 のクライアント ID |
| `GBP_CLIENT_SECRET` | 3-3 のクライアント シークレット |
| `GBP_REFRESH_TOKEN` | 3-4 のリフレッシュトークン |
| `GBP_ACCOUNT_ID` | 3-5 のアカウント ID |
| `GBP_LOCATION_ID` | 3-5 のロケーション ID |

> これらは絶対にファイルに直接書かないでください。Secrets に入れれば、ログにも表示されません。

## 手順5. 動作確認

GitHub の **Actions > GBP 自動投稿 > Run workflow** から手動実行できます。

1. まず **dry_run にチェック** を入れて実行 → 投稿せず、送信予定の内容がログに出ます
2. 内容に問題なければ、**force にチェック** を入れて実行 → 実際に1件投稿されます
3. ビジネスプロフィールに反映されたら完了。あとは毎日10:00に自動判定され、2日おきに投稿されます

---

## 運用メモ

### 投稿間隔を変えたい

`content/config.json` の `intervalDays` を書き換えます（毎日にするなら `1`、3日おきなら `3`）。

### 投稿時刻を変えたい

`.github/workflows/gbp-auto-post.yml` の `cron: "0 1 * * *"` を書き換えます。
**UTC 表記**なので、日本時間から9時間引いた値を入れてください。

| 日本時間 | cron |
|---|---|
| 8:00 | `0 23 * * *` |
| 10:00 | `0 1 * * *` |
| 12:00 | `0 3 * * *` |
| 18:00 | `0 9 * * *` |

> GitHub Actions のスケジュール実行は、混雑状況により数分〜数十分ずれることがあります。

### 予約ボタンを付けたい

`content/config.json` の `callToAction` を次のように書き換えます。

```json
"callToAction": { "actionType": "BOOK", "url": "https://予約ページのURL" }
```

`actionType` は `BOOK`（予約）/ `ORDER` / `SHOP` / `LEARN_MORE`（詳細）/ `SIGN_UP` / `CALL`（電話。
この場合 `url` は不要）から選べます。不要なら `null` のままで構いません。

### 文章を追加・修正したい

`content/posts.json` の `posts` 配列を編集します。件数は60でなくても動きます。
1件あたりの `summary` は 1500文字以内（現在は最長248文字）。

編集したら、次のコマンド（または Actions の手動実行で dry_run）で検証できます。

```bash
python3 scripts/gbp_post.py --check
```

本文の重複・空欄・文字数オーバーがあれば指摘されます。この検証は自動投稿の前にも
毎回実行されるので、おかしな編集をすると投稿されずにエラーで止まります。

### 文章60パターンの構成について（重要）

いただいた Word ファイルは「60パターン」となっていましたが、中身は **20パターンが
3回繰り返されている状態**（投稿1＝投稿21＝投稿41、投稿2＝投稿22＝投稿42 …）でした。
Google は同じ本文の投稿を重複と判定して表示を抑えることがあるため、次のように整理しています。

| 投稿番号 | variant | 内容 |
|---|---|---|
| 1〜20 | `A` | いただいた原文そのまま |
| 21〜40 | `B` | 同じ20トピックを、言い回しを変えて表現 |
| 41〜60 | `C` | 同じ20トピックを、さらに別の言い回しで表現 |

トピックの並び順は原文のままです。B・C は原文にない情報（店舗の場所、料金、キャンペーン等）を
一切足さず、書き方だけを変えています。原文どおり3回繰り返しに戻したい場合は、
`content/posts.json` の 21〜60 の `summary` を 1〜20 の内容に書き換えてください。

### 一巡したらどうなる？

パターン60まで使い切ると自動的にパターン1へ戻ります。60パターン × 2日 = 約4か月で一巡します。

### 今どこまで進んでいるか知りたい

`content/state.json` を見てください。`nextIndex` が次に使うパターンの番号（0始まり）、
`history` に直近60件の投稿履歴が残ります。

### 一時的に止めたい

**Actions > GBP 自動投稿 > 右上の「…」> Disable workflow** で停止できます。
再開は同じ場所から。

---

## うまくいかないとき

| 症状 | 確認すること |
|---|---|
| `環境変数 GBP_... が設定されていません` | 手順4の Secrets が5つとも登録されているか |
| `APIエラー 403` | Google の API 利用申請が承認済みか。スコープ `business.manage` で認可したか |
| `APIエラー 401` | リフレッシュトークンが失効している。手順3-4をやり直す |
| `APIエラー 404` | `GBP_ACCOUNT_ID` / `GBP_LOCATION_ID` の値が正しいか |
| 画像が付かない | `images/` に画像があるか。`https://andenknt31113.github.io/images/ファイル名` が開けるか |
| 毎日投稿されてしまう | `content/state.json` が更新・コミットされているか（Actions のログを確認） |
| 何も投稿されない | ログに「今回はスキップします」と出ていれば正常。前回投稿から2日待ちの状態 |
