#!/usr/bin/env bash
# PostToolUse(Edit|Write) リマインダ: ルート/スキーマ/型のソースを編集したら、
# 対応する docs の更新を促す（非ブロッキング。編集自体は完了済み）。
# exit 2 で stderr のメッセージを Claude に伝える。該当しなければ exit 0。
set -euo pipefail

input="$(cat)"

# file_path を抽出（jq があれば使い、無ければ JSON から grep で取り出す）
if command -v jq >/dev/null 2>&1; then
  fp="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
else
  fp="$(printf '%s' "$input" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed -E 's/.*:[[:space:]]*"//; s/"$//')"
fi

[ -z "$fp" ] && exit 0

remind() {
  echo "📝 docs リマインド: $1" >&2
  echo "   変更ファイル: $fp" >&2
  echo "   （docs は Markdown が正本。更新後は pnpm docs:build で HTML を再生成）" >&2
  exit 2
}

case "$fp" in
  */app/page.tsx | */app/*/page.tsx | */app/*/*/page.tsx)
    remind "ルートを変更した可能性があります。docs/routing.md のサイトマップ（状態欄・リンク）を確認・更新してください。" ;;
  */scripts/seed.ts)
    remind "スキーマ(DDL)を変更した可能性があります。docs/data-model.md の記述と types/ の整合を確認してください。" ;;
  */types/*.ts)
    remind "型を変更した可能性があります。docs/data-model.md の整合を確認してください。" ;;
esac

exit 0
