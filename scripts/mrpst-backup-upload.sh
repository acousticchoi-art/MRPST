#!/usr/bin/env bash
# Upload only an existing age-encrypted MRPST backup. Never sync or delete.
set -euo pipefail
umask 077
: "${MRPST_DRIVE_REMOTE:?Set the authorized rclone Google Drive remote name (without colon)}"
: "${MRPST_DRIVE_FOLDER_ID:?Set the approved Drive folder ID locally}"
[[ "$MRPST_DRIVE_REMOTE" =~ ^[A-Za-z0-9_-]+$ && "$MRPST_DRIVE_FOLDER_ID" =~ ^[A-Za-z0-9_-]+$ ]] || { echo "Invalid Drive configuration" >&2; exit 1; }
for cmd in rclone cmp head; do
  command -v "$cmd" >/dev/null || { echo "Missing dependency: $cmd" >&2; exit 1; }
done
[[ $# -eq 1 && -f "$1" && ! -L "$1" && -s "$1" ]] || { echo "Provide one existing encrypted backup file" >&2; exit 1; }
file=$(cd "$(dirname "$1")" && pwd -P)/$(basename "$1")
name=$(basename "$file")
[[ "$name" =~ ^mrpst-[0-9]{8}T[0-9]{6}Z-[0-9]+\.tar\.gz\.age$ ]] || { echo "Unexpected backup filename" >&2; exit 1; }
[[ "$(head -n 1 "$file")" == 'age-encryption.org/v1' ]] || { echo "Not an age encrypted archive" >&2; exit 1; }
# rclone copy keeps all older remote files and only includes the exact encrypted filename.
rclone copy "$(dirname "$file")" "$MRPST_DRIVE_REMOTE:" --drive-root-folder-id "$MRPST_DRIVE_FOLDER_ID" --include "/$name" --max-depth 1 --immutable
# Read back the encrypted bytes; failure never removes the local backup.
rclone cat "$MRPST_DRIVE_REMOTE:$name" --drive-root-folder-id "$MRPST_DRIVE_FOLDER_ID" | cmp - "$file"
printf 'Drive backup verified byte-for-byte: %s\nLocal copy retained: %s\n' "$name" "$file"
