# サロン予約サイト（ホットペッパービューティー型）

美容サロン向けの**自社予約サイト**です。ホットペッパービューティーと同じ情報構成・予約フロー
（メニュー → スタッフ → 空席カレンダー → お客様情報 → 確認 → 完了）を、
GitHub Pages にそのまま置ける静的サイトとして実装しています。

ビルド不要・依存パッケージなし。HTML / CSS / 素の JavaScript のみで動作します。

---

## ページ構成

| ファイル | 内容 |
| --- | --- |
| `index.html` | サロンTOP（ヒーロー・クーポン・スタイル・スタッフ・口コミ・店舗情報・FAQ） |
| `gallery.html` | ヘアスタイル一覧（長さ別の絞り込み） |
| `staff.html` | スタッフ紹介（指名予約への導線つき） |
| `menu.html` | クーポン・通常メニュー（カテゴリ別タブ） |
| `reviews.html` | 口コミ一覧 |
| `reserve.html` | **ネット予約フロー（STEP1〜5）／空席カレンダー** |
| `mypage.html` | ご予約の確認・キャンセル（お客様向け） |
| `admin.html` | 予約管理（スタッフ用・パスコード式） |

| スクリプト | 役割 |
| --- | --- |
| `assets/js/data.js` | **サロン設定（ここだけ書き換えれば自社用になります）** |
| `assets/js/common.js` | ヘッダー/フッター描画・共通関数・予約データ保存・空席計算 |
| `assets/js/pages.js` | 一覧系ページの描画 |
| `assets/js/reserve.js` | 予約フローの制御 |
| `assets/js/mypage.js` | 予約確認・キャンセル |
| `assets/js/admin.js` | 予約管理・CSV出力 |

---

## 自社用へのカスタマイズ

編集するのは基本的に **`assets/js/data.js` の1ファイルだけ**です。

### 1. 基本情報

```js
name: 'Beauty Salon LUMIÈRE',   // サロン名
branch: '表参道店',
tel: '03-1234-5678',
address: '東京都渋谷区神宮前0-0-0',
access: '表参道駅 A2出口より徒歩4分',
```

### 2. 営業時間・予約枠

```js
business: {
  openTime: '10:00',      // 営業開始
  closeTime: '20:00',     // 営業終了
  lastOrder: '19:00',     // 最終受付
  slotMinutes: 30,        // 予約枠の刻み
  closedWeekdays: [2],    // 定休日（0=日 … 6=土）
  closedDates: ['2026-08-20'],  // 臨時休業日
  bookableDays: 60,       // 何日先まで予約を受けるか
  minLeadHours: 2,        // 当日予約の締め切り（施術の何時間前まで）
  calendarDays: 14        // 空席カレンダーの表示日数
}
```

### 3. メニュー・クーポン・スタッフ・スタイル・口コミ

`coupons` / `menuCategories` / `staff` / `styles` / `reviews` の配列を
書き換え・追加してください。追加した内容は各ページと予約フローに自動で反映されます。

スタッフの `workdays`（出勤曜日）と `nominationFee`（指名料）は
空席カレンダーと料金計算にそのまま使われます。

### 4. ブランドカラー

`assets/css/style.css` の先頭にある `:root` の `--accent` を変更してください。
サイト全体の配色が切り替わります。

---

## 予約データの扱い

GitHub Pages は静的ホスティングのためサーバー処理がありません。
そのため本サイトは次の2モードで動作します。

### デモモード（初期状態）

`SALON.reservationEndpoint` が空の場合、予約はブラウザの `localStorage` に保存されます。
そのブラウザ内では予約確認・キャンセル・管理画面がひととおり動作しますが、
**店舗側に予約は届きません。** 動作確認・社内レビュー用です。

### 実運用モード

`assets/js/data.js` の `reservationEndpoint` に受信先 URL を設定すると、
予約確定時にその URL へ予約内容が JSON で POST されます。

```js
reservationEndpoint: 'https://script.google.com/macros/s/xxxxx/exec',
```

送信される JSON の例:

```json
{
  "code": "LM-8F3K2",
  "status": "reserved",
  "createdAt": "2026-08-15T04:12:00.000Z",
  "date": "2026-08-20",
  "time": "11:00",
  "endTime": "13:30",
  "staffId": "st01",
  "staffName": "佐藤 美咲",
  "menus": [{ "id": "cp02", "name": "カット + イルミナカラー", "price": 11000, "minutes": 150 }],
  "nominationFee": 1100,
  "totalPrice": 12100,
  "totalMinutes": 150,
  "customer": {
    "name": "山田 花子", "kana": "ヤマダ ハナコ",
    "tel": "09012345678", "email": "hanako@example.com",
    "visit": "初めて", "request": "肩につくくらいの長さに", "agree": true
  }
}
```

受信先には次のような選択肢があります。

- **Google Apps Script（無料・おすすめ）** — スプレッドシートに1行追加し、店舗へメール通知
- **Formspree / Getform など** — フォーム受信サービス
- 自社のAPIサーバー

Google Apps Script を使う場合の最小例:

```js
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.appendRow([
    data.code, data.date, data.time, data.staffName,
    data.customer.name, data.customer.tel, data.customer.email,
    data.menus.map(m => m.name).join(' / '), data.totalPrice
  ]);
  MailApp.sendEmail('salon@example.com', '【新規予約】' + data.code,
    data.date + ' ' + data.time + ' / ' + data.customer.name + '様');
  return ContentService.createTextOutput('ok');
}
```

「デプロイ → 新しいデプロイ → ウェブアプリ」で公開し、
アクセスできるユーザーを「全員」にしたうえで、発行された URL を `reservationEndpoint` に設定してください。

---

## 空席状況について

初期状態の空席カレンダーは、次のルールで**擬似的に**生成しています。

- 定休日・臨時休業日・過去日・受付期限（`minLeadHours`）を除外
- スタッフの出勤曜日（`workdays`）を反映
- 選択中メニューの合計所要時間ぶん、連続した空き枠があるかを判定
- このブラウザで入った予約は、その担当者の枠を実際に埋める

記号は `◎`（空きあり） / `○`（残りわずか） / `△`（残り1枠） / `×`（予約不可） / `-`（休業日）です。

実際の予約管理システムと連携する場合は、
`assets/js/common.js` の `Availability.isStaffSlotFree()` を
自社の空き状況を返す処理に差し替えてください。ここ1箇所の変更で全画面に反映されます。

---

## 管理画面

`admin.html` から、そのブラウザに入っている予約の一覧・絞り込み・CSV出力・キャンセルができます。
入口のパスコードは `data.js` の `adminPasscode` です。

> **注意:** これはあくまで簡易的な入口で、ソースを読めばパスコードは分かります。
> 本番で顧客情報を扱う場合は、必ずサーバー側の認証を用意してください。

---

## ローカルでの確認

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

`file://` で直接開いても概ね動作しますが、ブラウザによっては制限がかかるため
簡易サーバー経由での確認を推奨します。

---

## 公開について

`main` ブランチに置けば GitHub Pages でそのまま公開されます。
独自ドメインを使う場合はリポジトリに `CNAME` ファイルを追加してください。

サイト内の掲載写真はグラデーションのプレースホルダーです。
実際の撮影画像に差し替える場合は、`assets/js/pages.js` の
`styleCard()` / `staffCard()` の `.style-thumb` `.avatar` 部分を `<img>` に置き換えてください。
