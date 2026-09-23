보안 및 배포 설정

## 1) Vercel 환경변수 (Project Settings → Environment Variables)

필요한 것
- SUPABASE_URL = https://<project>.supabase.co
- SUPABASE_SERVICE_ROLE_KEY = <Supabase Service Role Key> (서버 전용. 절대 REACT_APP_ 붙이지 말 것)

삭제할 것 (더 이상 사용 안 함)
- BACKUP_SECRET
- REACT_APP_BACKUP_SECRET  ← REACT_APP_로 시작하는 값은 브라우저에 그대로 노출됨

변경 후 Redeploy 필요.

## 2) 백업 API (/api/backup) 인증 방식

- 브라우저는 로그인 세션의 access token을 `Authorization: Bearer <token>` 헤더로 보냄
- 서버는 `supabase.auth.getUser(token)`으로 진짜 로그인 사용자인지 확인
- `profiles` 테이블에서 사용자의 group_id / role 조회
  - 자기 여선교회(group_id) 데이터만 백업 가능, 본부(role = head)는 전체 가능
- 허용 테이블: members, products, rounds, orders / 최대 5000행

## 3) 백업이 정상 동작하는 것 확인 후 anon 권한 회수 (Supabase SQL Editor)

`revoke_order_backups.sql` 실행:

```sql
REVOKE INSERT ON public.order_backups FROM anon;
REVOKE USAGE ON SEQUENCE public.order_backups_id_seq FROM anon;
DROP POLICY IF EXISTS allow_anon_insert_order_backups ON public.order_backups;
```

## 4) 확인 방법

- 배포 사이트에서 로그인 → 데이터 저장 → Supabase `order_backups` 테이블에 새 행이 생기는지 확인
- 실패 시 Vercel → Functions 로그에서 `/api/backup` 오류 확인
  - 401: 토큰 문제 (로그아웃 후 재로그인)
  - 403: profiles에 group_id/role이 없거나 다른 그룹
  - 500: SUPABASE_SERVICE_ROLE_KEY 누락

참고: 로컬 `npm start`에서는 `/api/backup`이 없어서 백업만 실패함 (저장 자체는 정상, 콘솔에 로그만 남음)
