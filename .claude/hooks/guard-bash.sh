#!/usr/bin/env bash
# PreToolUse(Bash) ガード: 本番を壊す不可逆操作・秘密情報ダンプを実行前にブロックする。
# stdin に Claude Code から JSON が渡る。危険なら stderr にメッセージ + exit 2 でブロック。
# 意見が無ければ exit 0 で通常の許可フローに戻す（exit 0 は deny を上書きするので注意）。
set -euo pipefail

input="$(cat)"

# jq があれば JSON から command を抽出。無ければ raw 文字列で代替（フォールバック）。
if command -v jq >/dev/null 2>&1; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
else
  cmd="$input"
fi

[ -z "$cmd" ] && exit 0

block() {
  echo "🛑 guard-bash: ブロックしました: $1" >&2
  echo "   対象コマンド: $cmd" >&2
  echo "   本当に必要なら、ユーザーが手動で実行してください。" >&2
  exit 2
}

# --- 破壊的なファイル操作 ---
echo "$cmd" | grep -Eq '\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b' && block "rm -rf 系の再帰強制削除"
echo "$cmd" | grep -Eq '\bsudo\b'                                              && block "sudo"
echo "$cmd" | grep -Eq '\bchmod\s+(-R\s+)?0?777\b'                             && block "chmod 777"
echo "$cmd" | grep -Eq '\bcurl\b.*\|\s*(sudo\s+)?(ba)?sh\b'                    && block "curl ... | sh （リモートスクリプト実行）"
echo "$cmd" | grep -Eq '\bwget\b.*\|\s*(sudo\s+)?(ba)?sh\b'                    && block "wget ... | sh （リモートスクリプト実行）"

# --- git の不可逆操作 ---
echo "$cmd" | grep -Eq '\bgit\s+push\b.*(--force\b|--force-with-lease=|[[:space:]]-f\b)' && block "git push --force"
echo "$cmd" | grep -Eq '\bgit\s+reset\s+--hard\s+origin/'                                 && block "git reset --hard origin/*"

# --- 破壊的 SQL ---
echo "$cmd" | grep -Eiq '\bDROP\s+(TABLE|DATABASE|SCHEMA)\b' && block "DROP TABLE/DATABASE/SCHEMA"
echo "$cmd" | grep -Eiq '\bTRUNCATE\b'                       && block "TRUNCATE"
# WHERE を含まない DELETE FROM
echo "$cmd" | grep -Eiq '\bDELETE\s+FROM\b' && ! echo "$cmd" | grep -Eiq '\bWHERE\b' && block "WHERE 無しの DELETE FROM"

# --- 秘密情報ダンプ（Read deny を Bash 経路でも塞ぐ。.env.example/.sample/.template は除外） ---
echo "$cmd" | grep -Pq '\b(cat|less|more|head|tail|bat|xxd|od)\b[^|]*\.env(?!\.(example|sample|template)\b)' && block ".env（テンプレート除く）の内容ダンプ"
echo "$cmd" | grep -Eq '\bprintenv\b'        && block "printenv（環境変数ダンプ）"
echo "$cmd" | grep -Eq '(^|[;&|]|\bdo\b)\s*env\s*$' && block "env 単独実行（環境変数ダンプ）"

exit 0
