# MRPST 무료 데이터 백업 및 복구 절차

상태: 최초 구성 단계. 실제 데이터 백업 및 별도 프로젝트 복구 검증 전에는 복구 가능성을 보장하지 않는다.

## 최초 설정 (학교 관리자의 신뢰할 수 있는 컴퓨터)

- Supabase CLI, Docker, PostgreSQL 17 이상 클라이언트, age 설치.
- 학교 관리자가 `age-keygen -o mrpst-recovery.key`로 복구 키 생성. 키는 암호화된 오프라인 저장소에 보관하고 별도 보관본 확보. 비밀 키를 GitHub, Drive 백업 폴더, 채팅, 환경변수에 올리지 않는다. 생성된 공개 recipient만 백업에 사용한다.
- 관리자가 지정한 MRPST site Drive 폴더를 사용한다. 현재 링크를 가진 누구나 편집할 수 있으므로 원본 데이터·키·비밀번호는 올리지 않는다. 링크 공개 범위는 관리자 결정에 따라 유지한다. 접근 제한을 여전히 권장하며 외부 편집자가 파일을 삭제·변조할 수 있으므로 독립적인 로컬 사본을 반드시 보관한다. 폴더 ID는 공개 저장소에 기록하지 않고 로컬 환경변수로만 설정한다.
- 개인 PC의 암호화 디스크에 Git 저장소 외부 백업 디렉터리를 만든다. Drive 동기화 디렉터리는 임시 작업 경로로 사용하지 않는다.
- Supabase Dashboard > Connect에서 MRPST의 Session pooler(5432) 연결 URL 확인. 기존 비밀번호를 채팅/GitHub에 제공하지 않는다. 운영 DB 비밀번호는 임의로 재설정하지 않는다.

## 백업

업무 입력이 없는 시간에 실행한다. CLI의 역할/스키마/데이터 덤프는 각각 별도 스냅샷이므로 실행 중 데이터 변경이나 마이그레이션을 피한다.

```bash
export MRPST_BACKUP_DIR="/absolute/private/encrypted/local/folder"
export MRPST_AGE_RECIPIENT="age1...학교_공개키"
bash scripts/mrpst-backup.sh
```

연결 URL은 숨김 입력으로 입력한다. 스크립트는 공식 CLI의 역할, 스키마, 데이터 덤프와 마이그레이션 이력 및 별도 인증 트리거를 묶어 age로 암호화한다. 출력은 .tar.gz.age 하나뿐이다. 평문 임시 파일은 종료 시 제거한다(강제 종료 시 숨김 작업 폴더를 확인하고 삭제). 암호화 파일만 승인된 학교 Drive 폴더에 업로드한다. Drive 업로드 후 파일 크기와 SHA-256을 비교한다. 원본 데이터나 키를 GitHub에 커밋하지 않는다.

권장 운영: 매일 업무 종료 후 백업, 주 1회 복구 가능성 확인, 최근 7일 및 월말 백업 3개월 유지. 보존 기간은 학교 내부 정책 확정 후 적용한다. 자동 삭제는 구현하지 않는다. 스케줄 자동 실행은 아직 구성하지 않았다. 아래 선택적 업로드 설정이 없으면 로컬 백업만 수행한다.

## 선택적 Google Drive 업로드

신뢰할 수 있는 관리자 PC에 rclone을 설치하고 `rclone config`에서 Google Drive 연결을 생성한다. 학교 관리자 계정으로 직접 승인하며 토큰과 설정 파일을 비공개로 관리한다. 지정된 폴더 링크의 마지막 ID를 로컬에서 입력한다.

```bash
export MRPST_DRIVE_REMOTE="mrpst-drive"
export MRPST_DRIVE_FOLDER_ID="관리자가_지정한_폴더_ID"
bash scripts/mrpst-backup.sh
```

새 백업을 만든 후 해당 암호화 파일 하나만 복사하고 원격 바이트를 다시 읽어 로컬 파일과 비교한다. 이전 백업을 삭제하거나 동기화하지 않는다. 업로드에 실패하면 암호화 로컬 사본은 유지되며 기존 사본만 다시 업로드할 수 있다.

```bash
bash scripts/mrpst-backup-upload.sh /private/path/mrpst-YYYYMMDDTHHMMSSZ-PID.tar.gz.age
```

공유 폴더의 다른 파일은 건드리지 않는다. 최초 실제 실행 후 업로드 위치와 공유 상태, 복호화 가능 여부를 확인한다. 원격 파일은 나중에 다른 편집자가 삭제/변조할 수 있으므로 읽기 검증 성공이 장기 보존을 보장하지 않는다.

공식 rclone 문서: https://rclone.org/drive/ 및 https://rclone.org/commands/rclone_copy/

## 복구 확인

운영 DB에는 복구 명령을 실행하지 않는다. 별도 격리된 테스트 프로젝트/로컬 Supabase를 사용한다. 실제 복구 프로젝트의 비용과 권한은 사전 확인한다.

1. Drive의 암호화 파일을 다운로드하여 로컬 파일과 SHA-256 비교.
2. 승인된 복구 키로 암호화 디스크의 임시 폴더에 복호화 (`age -d -i /private/key -o backup.tar.gz backup.tar.gz.age`). tar 목록 검토 후 별도 폴더에 압축 해제.
3. 공식 Supabase CLI 복구 문서를 따라 역할·스키마·데이터를 새 DB에 복구한다. 기존 MRPST 프로젝트를 대상 URL로 사용하지 않는다.
4. 마이그레이션 이력 복구 여부 및 auth.users의 mrpst_require_admin_provisioned_auth_user 트리거를 확인한다. 누락된 경우 auth_trigger.sql을 검토한 후 테스트 DB에서만 적용한다. 이미 존재하면 중복 생성하지 않는다. auth/storage 별도 정책, 트리거 및 확장 설정은 실제 복구 전 원본과 비교한다.
5. 학생/성적/재정/도서관 등 테이블별 건수, 권한 정책, 테스트 계정 로그인과 샘플 업무 기능을 확인한다. 실사용자에게 메일 발송하지 않도록 테스트 설정을 분리한다.
6. Vercel 환경변수, Supabase Auth 설정, SMTP, 외부 연동 자격증명과 Storage 실제 객체는 DB 덤프만으로 복구되지 않는다. 학교 관리자가 별도의 비밀 저장소와 설정 목록으로 관리한다. 2026-11-26 조회 시 Storage 객체 0개; 객체가 생기면 스크립트는 중단한다. 객체 백업 방식을 추가하기 전 운영 백업을 완전하다고 간주하지 않는다.

공식 자료:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://github.com/FiloSottile/age
