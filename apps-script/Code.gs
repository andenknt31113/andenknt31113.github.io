/**
 * ZER01 barber & lounge
 * Google ビジネスプロフィール 自動投稿（Google スプレッドシート版）
 *
 * スプレッドシートに並べた投稿を、投稿予定日が来たものから1日1件ずつ自動投稿します。
 * 使い方は docs/SETUP-AppsScript.md を参照してください。
 */

// ===== 設定 =========================================================

const SHEET_NAME = '投稿一覧';

/** 投稿にボタンを付ける場合はここを書き換えます。付けない場合は null のまま。
 *  例: { actionType: 'BOOK', url: 'https://予約ページのURL' }
 *  actionType は BOOK / ORDER / SHOP / LEARN_MORE / SIGN_UP / CALL */
const CALL_TO_ACTION = null;

/** 1回の実行で投稿する最大件数。予定日を過ぎた投稿が溜まっても一気に投稿しないための上限。 */
const MAX_POSTS_PER_RUN = 1;

// ===== 以下は通常さわりません =========================================

const COL = { NO: 1, DATE: 2, DOW: 3, TOPIC: 4, BODY: 5, IMAGE: 6, DONE: 7, POSTED_AT: 8, RESULT: 9 };
const HEADERS = ['No', '投稿予定日', '曜日', 'トピック', '本文', '画像URL', '投稿済み', '投稿日時', '結果・エラー'];
const FIRST_DATA_ROW = 2;
const SUMMARY_LIMIT = 1500;
const API_BASE = 'https://mybusiness.googleapis.com/v4';
const DONE_MARK = '済';

/** スプレッドシートを開いたときにメニューを追加する。 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('GBP自動投稿')
    .addItem('① 店舗ID・アカウントIDを設定', 'setIds')
    .addItem('② 画像をドライブから読み込む', 'fillImageUrlsFromDrive')
    .addItem('③ 内容をチェックする', 'checkAll')
    .addSeparator()
    .addItem('次の投稿内容を確認（投稿しない）', 'previewNext')
    .addItem('今すぐ1件投稿する', 'postNow')
    .addSeparator()
    .addItem('毎日の自動投稿をオンにする', 'createTrigger')
    .addItem('毎日の自動投稿をオフにする', 'deleteTrigger')
    .addItem('自動投稿の状態を確認', 'showTriggerStatus')
    .addToUi();
}

// ===== 初期設定 ======================================================

/** ビジネスプロフィールのアカウントID・店舗IDを登録する。 */
function setIds() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();

  const a = ui.prompt(
    'アカウントIDの設定',
    '「accounts/」に続く数字を入力してください。\n例: accounts/123456789012345 → 123456789012345\n\n※ 調べ方は手順書の「アカウントID・店舗IDを調べる」を参照',
    ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;

  const l = ui.prompt(
    '店舗IDの設定',
    '「locations/」に続く数字を入力してください。\n例: locations/987654321098765 → 987654321098765',
    ui.ButtonSet.OK_CANCEL);
  if (l.getSelectedButton() !== ui.Button.OK) return;

  const accountId = a.getResponseText().trim().replace(/^accounts\//, '');
  const locationId = l.getResponseText().trim().replace(/^locations\//, '');
  if (!accountId || !locationId) {
    ui.alert('入力が空でした。設定を中止します。');
    return;
  }
  props.setProperty('ACCOUNT_ID', accountId);
  props.setProperty('LOCATION_ID', locationId);
  ui.alert('保存しました。\n\nアカウント: accounts/' + accountId + '\n店舗: locations/' + locationId);
}

/** Google ドライブのフォルダから画像を読み込み、画像URL列に流し込む。 */
function fillImageUrlsFromDrive() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt(
    '画像フォルダの指定',
    'Google ドライブの画像フォルダを開いて、アドレスバーのURLをそのまま貼り付けてください。',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;

  const folderId = extractDriveId_(res.getResponseText());
  if (!folderId) {
    ui.alert('URLからフォルダIDを読み取れませんでした。フォルダのURLを貼り付けてください。');
    return;
  }

  let folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (e) {
    ui.alert('フォルダを開けませんでした。URLが正しいか、閲覧権限があるかを確認してください。');
    return;
  }

  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (/^image\/(jpeg|png)$/.test(f.getMimeType())) files.push(f);
  }
  if (!files.length) {
    ui.alert('このフォルダに JPG / PNG の画像が見つかりませんでした。');
    return;
  }
  files.sort((x, y) => x.getName().localeCompare(y.getName(), 'ja', { numeric: true }));

  // Google が画像を取得できるよう、リンクを知っている全員が閲覧できる状態にする
  let shareFailed = 0;
  files.forEach(f => {
    try {
      f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      shareFailed++;
    }
  });

  const sheet = getSheet_();
  const rows = getRowCount_(sheet);
  const urls = [];
  for (let i = 0; i < rows; i++) {
    const f = files[i % files.length];   // 画像が足りなければ先頭から使い回す
    urls.push(['https://lh3.googleusercontent.com/d/' + f.getId()]);
  }
  sheet.getRange(FIRST_DATA_ROW, COL.IMAGE, rows, 1).setValues(urls);

  let msg = files.length + ' 枚の画像を ' + rows + ' 行に割り当てました。';
  if (files.length < rows) msg += '\n画像が行数より少ないため、先頭から順に使い回しています。';
  if (shareFailed) msg += '\n\n注意: ' + shareFailed + ' 件の画像で共有設定を変更できませんでした。'
    + '手動で「リンクを知っている全員が閲覧可」にしてください。';
  msg += '\n\n続けて「③ 内容をチェックする」を実行して、画像が表示できるか確認してください。';
  ui.alert(msg);
}

/** ドライブのURLからファイル／フォルダIDを取り出す。 */
function extractDriveId_(input) {
  const s = String(input || '').trim();
  const m = s.match(/[-\w]{25,}/);
  return m ? m[0] : '';
}

// ===== チェック ======================================================

/** 本文・画像URL・IDの設定をまとめて検証する。 */
function checkAll() {
  const sheet = getSheet_();
  const data = readRows_(sheet);
  const problems = [];
  const seen = {};

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ACCOUNT_ID') || !props.getProperty('LOCATION_ID')) {
    problems.push('アカウントID／店舗IDが未設定です（メニューの「①」から設定してください）');
  }

  data.forEach(r => {
    const where = r.row + '行目（No.' + r.no + '）';
    if (!r.body) {
      problems.push(where + ': 本文が空です');
    } else if (r.body.length > SUMMARY_LIMIT) {
      problems.push(where + ': 本文が ' + r.body.length + ' 文字で上限 ' + SUMMARY_LIMIT + ' 文字を超えています');
    } else if (seen[r.body]) {
      problems.push(where + ': ' + seen[r.body] + '行目と本文が完全に同じです（重複と判定されることがあります）');
    } else {
      seen[r.body] = r.row;
    }
    if (!r.date) problems.push(where + ': 投稿予定日が空か、日付として読み取れません（この行は投稿されません）');
  });

  // 画像URLは同じものが繰り返し使われるため、重複を除いて確認する
  const urls = [];
  data.forEach(r => { if (r.image && urls.indexOf(r.image) === -1) urls.push(r.image); });
  let ngImages = 0;
  urls.forEach(u => {
    if (!isImageReachable_(u)) {
      ngImages++;
      if (ngImages <= 5) problems.push('画像を取得できません: ' + u);
    }
  });
  if (ngImages > 5) problems.push('ほか ' + (ngImages - 5) + ' 件の画像も取得できませんでした');

  const summary = '投稿 ' + data.length + ' 件 / 画像URL ' + urls.length + ' 種類';
  const ui = SpreadsheetApp.getUi();
  if (problems.length) {
    ui.alert('チェック結果（要修正）', summary + '\n\n' + problems.join('\n'), ui.ButtonSet.OK);
  } else {
    ui.alert('チェック結果', summary + '\n\n問題は見つかりませんでした。', ui.ButtonSet.OK);
  }
}

/** 画像URLが外部から取得できるか確かめる。 */
function isImageReachable_(url) {
  try {
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (res.getResponseCode() !== 200) return false;
    return /^image\//.test(res.getHeaders()['Content-Type'] || res.getHeaders()['content-type'] || '');
  } catch (e) {
    return false;
  }
}

// ===== 投稿 ==========================================================

/** 時間主導型トリガーから呼ばれる入口。予定日が来ている投稿を処理する。 */
function autoPost() {
  const result = runPost_(false);
  console.log(result.message);
}

/** メニューから「今すぐ1件投稿する」。予定日を待たずに次の1件を投稿する。 */
function postNow() {
  const ui = SpreadsheetApp.getUi();
  const target = findNextRow_(readRows_(getSheet_()), true);
  if (!target) {
    ui.alert('未投稿の行がありません。すべて投稿済みです。');
    return;
  }
  const ok = ui.alert('今すぐ投稿します',
    'No.' + target.no + '（' + target.topic + '）を今すぐ投稿します。よろしいですか？\n\n' + target.body,
    ui.ButtonSet.OK_CANCEL);
  if (ok !== ui.Button.OK) return;

  const result = runPost_(true);
  ui.alert(result.message);
}

/** 投稿せずに、次に投稿される内容を表示する。 */
function previewNext() {
  const ui = SpreadsheetApp.getUi();
  const rows = readRows_(getSheet_());
  const due = findNextRow_(rows, false);
  const next = findNextRow_(rows, true);

  if (!next) {
    ui.alert('未投稿の行がありません。すべて投稿済みです。');
    return;
  }
  let msg = '【次に投稿される内容】\n'
    + 'No.' + next.no + '（' + next.topic + '）\n'
    + '投稿予定日: ' + formatDate_(next.date) + '\n'
    + '画像: ' + (next.image || 'なし') + '\n\n'
    + next.body + '\n\n';
  msg += due
    ? '※ 予定日を迎えているため、次の自動実行で投稿されます。'
    : '※ まだ予定日前です。' + formatDate_(next.date) + ' 以降の自動実行で投稿されます。';
  ui.alert('次の投稿内容', msg, ui.ButtonSet.OK);
}

/**
 * 投稿処理の本体。
 * @param {boolean} force true なら投稿予定日を無視する
 */
function runPost_(force) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return { posted: 0, message: '他の処理が実行中のため中止しました。' };
  }
  try {
    const sheet = getSheet_();
    const rows = readRows_(sheet);
    const props = PropertiesService.getScriptProperties();
    const accountId = props.getProperty('ACCOUNT_ID');
    const locationId = props.getProperty('LOCATION_ID');
    if (!accountId || !locationId) {
      return { posted: 0, message: 'アカウントID／店舗IDが未設定です。メニューの「①」から設定してください。' };
    }

    let posted = 0;
    const messages = [];
    for (let i = 0; i < MAX_POSTS_PER_RUN; i++) {
      const target = findNextRow_(rows, force);
      if (!target) break;

      try {
        validateRow_(target);
        const body = buildPostBody_(target);
        const res = createLocalPost_(accountId, locationId, body);
        markDone_(sheet, target, '投稿しました' + (res.name ? '（' + res.name + '）' : ''));
        messages.push('No.' + target.no + '（' + target.topic + '）を投稿しました。');
        posted++;
      } catch (e) {
        markError_(sheet, target, e.message);
        messages.push('No.' + target.no + ' の投稿に失敗しました: ' + e.message);
        break;   // 失敗したら次の行へは進まず、その場で止める
      }
      target.done = DONE_MARK;   // 同じ行を再度拾わないようにする
    }

    if (!messages.length) messages.push('投稿対象の行がありませんでした。');
    return { posted: posted, message: messages.join('\n') };
  } finally {
    lock.releaseLock();
  }
}

/** 未投稿の行のうち、投稿すべき最初の1件を返す。 */
function findNextRow_(rows, ignoreDate) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.done) continue;
    if (!ignoreDate && (!r.date || r.date > today)) continue;
    return r;
  }
  return null;
}

function validateRow_(r) {
  if (!r.body) throw new Error('本文が空です');
  if (r.body.length > SUMMARY_LIMIT) throw new Error('本文が ' + r.body.length + ' 文字で上限を超えています');
  if (r.image && !isImageReachable_(r.image)) {
    throw new Error('画像を取得できません（共有設定が「リンクを知っている全員」になっているか確認してください）: ' + r.image);
  }
}

function buildPostBody_(r) {
  const body = { languageCode: 'ja', summary: r.body, topicType: 'STANDARD' };
  if (CALL_TO_ACTION) body.callToAction = CALL_TO_ACTION;
  if (r.image) body.media = [{ mediaFormat: 'PHOTO', sourceUrl: r.image }];
  return body;
}

function createLocalPost_(accountId, locationId, body) {
  const url = API_BASE + '/accounts/' + accountId + '/locations/' + locationId + '/localPosts';
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json; charset=utf-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error(describeApiError_(code, text));
  }
  return JSON.parse(text || '{}');
}

/** APIのエラーを、原因が分かる日本語にして返す。 */
function describeApiError_(code, text) {
  let detail = text;
  try {
    const parsed = JSON.parse(text);
    if (parsed.error && parsed.error.message) detail = parsed.error.message;
  } catch (e) { /* JSONでなければ本文をそのまま使う */ }

  const hints = {
    401: 'APIの認証に失敗しました。スクリプトの承認をやり直してください。',
    403: 'APIの利用が許可されていません。Google への API 利用申請が承認済みか、'
       + 'Apps Script が申請したGoogle Cloudプロジェクトに紐付いているかを確認してください。',
    404: 'アカウントIDまたは店舗IDが見つかりません。メニューの「①」で設定し直してください。',
    429: 'APIの利用回数の上限に達しました。時間をおいて再実行してください。',
  };
  const hint = hints[code] ? hints[code] + ' / ' : '';
  return 'APIエラー ' + code + ': ' + hint + detail;
}

// ===== シート操作 ====================================================

function getSheet_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('「' + SHEET_NAME + '」という名前のシートが見つかりません。シート名を確認してください。');
  return sheet;
}

function getRowCount_(sheet) {
  return Math.max(0, sheet.getLastRow() - FIRST_DATA_ROW + 1);
}

function readRows_(sheet) {
  const count = getRowCount_(sheet);
  if (count <= 0) return [];
  const values = sheet.getRange(FIRST_DATA_ROW, 1, count, HEADERS.length).getValues();
  return values.map((v, i) => ({
    row: FIRST_DATA_ROW + i,
    no: v[COL.NO - 1],
    date: toDate_(v[COL.DATE - 1]),
    topic: String(v[COL.TOPIC - 1] || ''),
    body: String(v[COL.BODY - 1] || '').trim(),
    image: String(v[COL.IMAGE - 1] || '').trim(),
    done: String(v[COL.DONE - 1] || '').trim(),
  })).filter(r => r.body || r.no);
}

function markDone_(sheet, target, message) {
  sheet.getRange(target.row, COL.DONE).setValue(DONE_MARK);
  sheet.getRange(target.row, COL.POSTED_AT).setValue(new Date());
  sheet.getRange(target.row, COL.RESULT).setValue(message);
}

function markError_(sheet, target, message) {
  sheet.getRange(target.row, COL.RESULT).setValue('エラー: ' + message);
}

/**
 * セルの値を日付に変換する。
 * CSVを取り込んだ直後などは「2026/09/01」のような文字列で入っていることがあるため、
 * 日付として扱えない値を無言で無視せず、文字列も解釈する。
 */
function toDate_(value) {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number' && value > 0) {
    // スプレッドシートのシリアル値（1899/12/30 起点）
    return new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  }
  const s = String(value || '').trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function formatDate_(d) {
  return d ? Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy/MM/dd') : '(未設定)';
}

// ===== トリガー ======================================================

/** 毎日 10時台に autoPost を実行するトリガーを作る。 */
function createTrigger() {
  deleteTrigger_();
  ScriptApp.newTrigger('autoPost').timeBased().atHour(10).everyDays(1).inTimezone('Asia/Tokyo').create();
  SpreadsheetApp.getUi().alert(
    '自動投稿をオンにしました。\n\n毎日10時台に動き、投稿予定日を迎えた行があれば1件投稿します。\n'
    + '（Google の仕様で、実行は10:00〜11:00の間のどこかになります）');
}

function deleteTrigger() {
  const removed = deleteTrigger_();
  SpreadsheetApp.getUi().alert(removed
    ? '自動投稿をオフにしました。'
    : '自動投稿は元々オフでした。');
}

function deleteTrigger_() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'autoPost') {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  return removed;
}

function showTriggerStatus() {
  const on = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'autoPost');
  const rows = readRows_(getSheet_());
  const done = rows.filter(r => r.done).length;
  const next = findNextRow_(rows, true);
  SpreadsheetApp.getUi().alert('自動投稿の状態',
    '自動投稿: ' + (on ? 'オン（毎日10時台）' : 'オフ') + '\n'
    + '投稿済み: ' + done + ' / ' + rows.length + ' 件\n'
    + '次の投稿: ' + (next ? 'No.' + next.no + '（' + next.topic + '） ' + formatDate_(next.date) : 'なし'),
    SpreadsheetApp.getUi().ButtonSet.OK);
}
