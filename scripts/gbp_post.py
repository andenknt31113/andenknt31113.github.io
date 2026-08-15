#!/usr/bin/env python3
"""ZER01 barber & lounge の Google ビジネスプロフィールへ最新情報を自動投稿する。

60パターンの本文を順番に使い回し、images/ に置いた画像を組み合わせて
Google Business Profile API (v4 localPosts) へ投稿する。
標準ライブラリのみで動作する。

使い方:
    python3 scripts/gbp_post.py --check     # 本文と画像の設定だけ検証
    python3 scripts/gbp_post.py --dry-run   # 投稿せず内容だけ確認
    python3 scripts/gbp_post.py             # 前回から間隔が空いていれば投稿
    python3 scripts/gbp_post.py --force     # 間隔を無視して即投稿
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS_PATH = os.path.join(ROOT, "content", "posts.json")
CONFIG_PATH = os.path.join(ROOT, "content", "config.json")
STATE_PATH = os.path.join(ROOT, "content", "state.json")
IMAGES_DIR = os.path.join(ROOT, "images")

IMAGE_EXTS = (".jpg", ".jpeg", ".png")
TOKEN_URL = "https://oauth2.googleapis.com/token"
API_BASE = "https://mybusiness.googleapis.com/v4"
SUMMARY_LIMIT = 1500

# 投稿がスキップされたことを呼び出し元に伝える終了コード（失敗ではない）
EXIT_SKIPPED = 0


def load_json(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def log(msg: str) -> None:
    print(f"[gbp-post] {msg}", flush=True)


def list_images() -> list[str]:
    """images/ 直下の画像ファイル名を名前順で返す。"""
    if not os.path.isdir(IMAGES_DIR):
        return []
    names = [
        n
        for n in os.listdir(IMAGES_DIR)
        if n.lower().endswith(IMAGE_EXTS) and not n.startswith(".")
    ]
    return sorted(names)


def is_due(state: dict, interval_days: int, now: datetime) -> tuple[bool, str]:
    """前回投稿からの経過日数を見て、今回投稿すべきか判定する。"""
    last = state.get("lastPostedAt")
    if not last:
        return True, "初回投稿"
    try:
        last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
    except ValueError:
        return True, f"lastPostedAt を解釈できないため投稿します: {last!r}"
    elapsed = now - last_dt
    # 実行時刻の数分のブレでスキップされないよう、しきい値を少しだけ緩める
    threshold = timedelta(days=interval_days) - timedelta(hours=1)
    elapsed_text = f"{elapsed.days}日{int(elapsed.seconds // 3600)}時間"
    if elapsed >= threshold:
        return True, f"前回投稿から {elapsed_text} 経過"
    hours = int((threshold - elapsed).total_seconds() // 3600)
    return False, f"前回投稿から {elapsed_text} しか経っていません（あと約 {hours} 時間）"


def check_posts(posts: list[dict]) -> int:
    """posts.json の内容を検証する。問題があれば 1 を返す。"""
    problems: list[str] = []
    seen: dict[str, int] = {}
    for post in posts:
        for key in ("id", "topic", "summary"):
            if key not in post:
                problems.append(f"投稿{post.get('id', '?')}: {key} がありません")
        summary = post.get("summary", "")
        if not summary.strip():
            problems.append(f"投稿{post.get('id', '?')}: 本文が空です")
        if len(summary) > SUMMARY_LIMIT:
            problems.append(
                f"投稿{post.get('id')}: 本文が {len(summary)} 文字で上限 {SUMMARY_LIMIT} を超えています"
            )
        if summary in seen:
            problems.append(
                f"投稿{post.get('id')}: 投稿{seen[summary]} と本文が完全に同じです"
                "（Google に重複と判定されることがあります）"
            )
        else:
            seen[summary] = post.get("id")

    images = list_images()
    log(f"本文: {len(posts)} パターン / 画像: {len(images)} 枚")
    if images and len(images) < len(posts):
        log(f"補足: 画像が本文より少ないため、{len(images)} 枚を先頭から使い回します。")
    if problems:
        for p in problems:
            log(f"NG: {p}")
        return 1
    log("OK: 問題は見つかりませんでした。")
    return 0


def build_post_body(post: dict, config: dict, image_url: str | None) -> dict:
    body: dict = {
        "languageCode": config.get("languageCode", "ja"),
        "summary": post["summary"],
        "topicType": config.get("topicType", "STANDARD"),
    }
    cta = config.get("callToAction")
    if cta:
        body["callToAction"] = cta
    if image_url:
        body["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": image_url}]
    return body


def http_json(url: str, *, data: bytes | None = None, headers: dict | None = None) -> dict:
    req = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        raise SystemExit(f"APIエラー {e.code} {e.reason}\nURL: {url}\n{detail}") from e
    except urllib.error.URLError as e:
        raise SystemExit(f"通信エラー: {e.reason}\nURL: {url}") from e
    return json.loads(raw) if raw else {}


def get_access_token(client_id: str, client_secret: str, refresh_token: str) -> str:
    payload = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
    ).encode()
    res = http_json(
        TOKEN_URL,
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = res.get("access_token")
    if not token:
        raise SystemExit(f"アクセストークンを取得できませんでした: {res}")
    return token


def create_local_post(account: str, location: str, token: str, body: dict) -> dict:
    url = f"{API_BASE}/{account}/{location}/localPosts"
    return http_json(
        url,
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(
            f"環境変数 {name} が設定されていません。"
            " GitHub の Settings > Secrets and variables > Actions に登録してください。"
            " 詳細は docs/SETUP.md を参照。"
        )
    return value


def normalize_resource(value: str, prefix: str) -> str:
    """'123' でも 'accounts/123' でも受け付けて 'accounts/123' 形式に揃える。"""
    value = value.strip().strip("/")
    return value if value.startswith(f"{prefix}/") else f"{prefix}/{value}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Google ビジネスプロフィールへ自動投稿する")
    parser.add_argument("--dry-run", action="store_true", help="投稿せず内容だけ表示する")
    parser.add_argument("--force", action="store_true", help="投稿間隔を無視して投稿する")
    parser.add_argument(
        "--check", action="store_true", help="本文と画像の設定だけを検証する（投稿しない）"
    )
    args = parser.parse_args()

    config = load_json(CONFIG_PATH)
    posts = load_json(POSTS_PATH)["posts"]
    state = load_json(STATE_PATH)

    if not posts:
        raise SystemExit("content/posts.json に投稿本文がありません。")

    if args.check:
        return check_posts(posts)

    now = datetime.now(timezone.utc)
    interval_days = int(config.get("intervalDays", 2))

    due, reason = is_due(state, interval_days, now)
    if not due and not args.force:
        log(f"今回はスキップします（{reason}）")
        return EXIT_SKIPPED
    log(f"投稿します（{reason if due else '--force 指定'}）")

    index = int(state.get("nextIndex", 0)) % len(posts)
    post = posts[index]

    if len(post["summary"]) > SUMMARY_LIMIT:
        raise SystemExit(
            f"投稿{post['id']} の本文が {len(post['summary'])} 文字あり、"
            f"上限 {SUMMARY_LIMIT} 文字を超えています。"
        )

    image_url = post.get("imageUrl")
    image_name = None
    if not image_url:
        images = list_images()
        if images:
            image_name = images[index % len(images)]
            base = config.get("imageBaseUrl", "").rstrip("/")
            image_url = f"{base}/{urllib.parse.quote(image_name)}"
        else:
            log("images/ に画像がないため、テキストのみで投稿します。")

    body = build_post_body(post, config, image_url)

    log(f"パターン {index + 1}/{len(posts)}（投稿{post['id']}・{post['topic']}）")
    log(f"画像: {image_url or 'なし'}")

    if args.dry_run:
        log("--dry-run のため送信しません。送信予定の内容:")
        print(json.dumps(body, ensure_ascii=False, indent=2))
        return 0

    client_id = require_env("GBP_CLIENT_ID")
    client_secret = require_env("GBP_CLIENT_SECRET")
    refresh_token = require_env("GBP_REFRESH_TOKEN")
    account = normalize_resource(require_env("GBP_ACCOUNT_ID"), "accounts")
    location = normalize_resource(require_env("GBP_LOCATION_ID"), "locations")

    token = get_access_token(client_id, client_secret, refresh_token)
    result = create_local_post(account, location, token, body)
    log(f"投稿しました: {result.get('name', '(name なし)')}")

    posted_at = now.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    state["lastPostedAt"] = posted_at
    state["nextIndex"] = (index + 1) % len(posts)
    history = state.get("history", [])
    history.append(
        {
            "postedAt": posted_at,
            "postedAtJst": now.astimezone(JST).strftime("%Y-%m-%d %H:%M"),
            "postId": post["id"],
            "topic": post["topic"],
            "image": image_name,
            "name": result.get("name"),
        }
    )
    state["history"] = history[-60:]
    save_json(STATE_PATH, state)
    log(f"次回は パターン {state['nextIndex'] + 1} を使用します。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
