#!/usr/bin/env bash
# Run only on the authorized school administrator's trusted computer.
set -euo pipefail
umask 077
for cmd in supabase docker age tar psql mktemp; do
  command -v "$cmd" >/dev/null || { echo "Missing dependency: $cmd" >&2; exit 1; }
done
: "${MRPST_BACKUP_DIR:?Set an absolute private, encrypted local directory outside the repository}"
: "${MRPST_AGE_RECIPIENT:?Set the school recovery public age recipient (age1...)}"
[[ "$MRPST_BACKUP_DIR" = /* && -d "$MRPST_BACKUP_DIR" ]] || { echo "Invalid backup directory" >&2; exit 1; }
[[ "$MRPST_AGE_RECIPIENT" = age1* ]] || { echo "Invalid age public recipient" >&2; exit 1; }
backup_dir=$(cd "$MRPST_BACKUP_DIR" && pwd -P)
repo_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
case "$backup_dir/" in "$repo_dir/"*) echo "Do not store backups in the repository" >&2; exit 1;; esac
if [[ -z "${MRPST_DB_URL:-}" ]]; then
  read -rsp "MRPST session pooler connection URL (hidden): " MRPST_DB_URL
  printf '\n'
fi
case "$MRPST_DB_URL" in
  postgresql://postgres.rxbnxkntianqktvhjllv:*@aws-*-ap-southeast-2.pooler.supabase.com:5432/postgres|postgresql://postgres:*@db.rxbnxkntianqktvhjllv.supabase.co:5432/postgres) ;;
  *) echo "URL does not identify the MRPST production database on session/direct port 5432" >&2; exit 1;;
esac
export PGSSLMODE=require
stamp=$(date -u +%Y%m%dT%H%M%SZ)
work=$(mktemp -d "$backup_dir/.mrpst-work.XXXXXXXX")
partial="$backup_dir/.mrpst-$stamp-$$.tar.gz.age.partial"
final="$backup_dir/mrpst-$stamp-$$.tar.gz.age"
cleanup(){ rm -rf -- "$work"; rm -f -- "$partial"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Fail if future Storage files require a separate object backup.
objects=$(psql "$MRPST_DB_URL" -XAt --set=ON_ERROR_STOP=1 -c 'select count(*) from storage.objects;')
[[ "$objects" = 0 ]] || { echo "Storage objects exist; a separate object backup is required. Stop." >&2; exit 1; }
supabase db dump --db-url "$MRPST_DB_URL" -f "$work/roles.sql" --role-only
supabase db dump --db-url "$MRPST_DB_URL" -f "$work/schema.sql"
supabase db dump --db-url "$MRPST_DB_URL" -f "$work/data.sql" --use-copy --data-only -x storage.buckets_vectors -x storage.vector_indexes
supabase db dump --db-url "$MRPST_DB_URL" -f "$work/history_schema.sql" --schema supabase_migrations
supabase db dump --db-url "$MRPST_DB_URL" -f "$work/history_data.sql" --use-copy --data-only --schema supabase_migrations
psql "$MRPST_DB_URL" -XAt --set=ON_ERROR_STOP=1 -c "select pg_get_triggerdef(t.oid)||';' from pg_trigger t where t.tgrelid='auth.users'::regclass and t.tgname='mrpst_require_admin_provisioned_auth_user' and not t.tgisinternal;" > "$work/auth_trigger.sql"
for f in roles schema data history_schema history_data auth_trigger; do
  [[ -s "$work/$f.sql" ]] || { echo "Missing backup component: $f" >&2; exit 1; }
done
printf 'project=MRPST\ncreated_utc=%s\nstorage_objects=0\nrestore_test=not_yet_verified\n' "$stamp" > "$work/manifest.txt"
tar -C "$work" -czf - roles.sql schema.sql data.sql history_schema.sql history_data.sql auth_trigger.sql manifest.txt | age -r "$MRPST_AGE_RECIPIENT" -o "$partial"
[[ -s "$partial" ]] || { echo "Encryption failed" >&2; exit 1; }
mv -- "$partial" "$final"
printf 'Encrypted backup created: %s\nUpload only this .age file to the restricted school Drive folder. Verify recovery separately.\n' "$final"
