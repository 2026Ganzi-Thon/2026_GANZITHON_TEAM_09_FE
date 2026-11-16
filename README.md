# 행운핑 (프론트엔드)

함께 하는 작은 활동으로 일상을 돌보고, 힘든 날엔 실제 도움으로 이어주는 모바일 웹앱(PWA).

- 매일 기분을 한 번 고르고, 각자 작은 미션을 하며, 친구·온라인·1인 그룹과 캐릭터를 함께 키운다.
- 주 1회 마음 점검과 기분 흐름에 따라 실제 공공 지원(상담·센터·바우처)으로 이어준다.
- 도움받기 탭은 계정 없이, 인터넷이 끊겨도 열린다.

기준 문서: 서비스 기획서, MVP PRD, API 명세(api.md), 사용자 흐름(UserFlow.md), 아키텍처, ERD, Figma 「행운핑」 페이지(앱 화면 1~27).
작업 경과와 결정 사항은 [docs/작업기록.md](docs/작업기록.md)에 있다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 규칙 단위 테스트 + 목업 서버 계약 테스트 (vitest)
npm run build    # 타입 검사 + 프로덕션 빌드 + 서비스 워커
npm run lint
```

### 실서버 연결

기본은 기기 안의 **목업 서버**다(api.md와 같은 응답·에러 코드). 백엔드가 준비되면 `.env`만 바꾼다.

```bash
# .env
VITE_API_MODE=http                      # mock(기본) | http
VITE_API_PROXY=http://localhost:8080    # 개발 서버가 /api를 넘길 백엔드 주소
```

화면과 API는 같은 도메인 `/api/v1`, 세션 쿠키(`hp_session`) + CSRF(`XSRF-TOKEN` → `X-XSRF-TOKEN`).

## 기술 스택

| 영역 | 사용 |
| --- | --- |
| 화면 | React 19 + TypeScript, Vite, React Router |
| 서버 데이터 | TanStack Query (로딩·오류·오프라인 상태, 변경 후 다시 불러오기) |
| 스타일 | CSS Modules + Figma 변수 기반 토큰(`src/styles/tokens.css`) |
| 오프라인 | vite-plugin-pwa (앱 셸 프리캐시, `/api/v1/help/items` stale-while-revalidate) |
| 테스트 | Vitest |

## 화면 (UserFlow 화면 ID)

| 경로 | 화면 |
| --- | --- |
| `/` | 앱 실행 스플래시 → 계정 확인 후 자동 이동 |
| `/welcome` | S01·S02 시작 |
| `/onboarding/install` → `nickname` → `profile` → `consent` → `notifications` → `group` | S03 홈 화면 추가 → S04 닉네임(익명 계정 생성) → S05 선택 정보 → S06 민감정보 동의 → S07 알림 → S08 첫 그룹 |
| `/groups` | S20 그룹 탭: 오늘의 내 미션, 그룹 목록, 가벼운 도움 카드, 온라인 대기 카드 |
| `/groups/new` | S28 그룹 만들기·참여 (친구 코드·온라인 자기 확인·혼자) |
| `/groups/:groupId` | S24 그룹 상세 + S21 미션 준비 |
| `/mission`, `/mission/timer`, `/mission/done` | S21 미션 준비 · S22 타이머 · S23 완료·핑 |
| `/checkin/result` | P03 점검 결과 (P01 기분·P02 점검은 탭 화면 위 팝업) |
| `/help`, `/help/:serviceId` | S40 도움받기 · S41 상세 (계정 없이 열림) |
| `/records` | S30~S32 내 기록 |
| `/collection`, `/collection/:groupId/:characterId` | 캐릭터 도감 · 성장 과정 |
| `/my`, `/my/*` | S50 마이 · 내 정보 · S51 알림 · S53 개인정보 · S52 고지 |

## 폴더 구조

```
src/
  api/          api.md 타입(types.ts), 클라이언트 인터페이스, http 구현, 목업 서버(mock/), React Query 훅(queries.ts)
  app/          라우터, 레이아웃·가드, 진입 규칙(entry.ts), 모바일 프레임
  pages/        화면 (launch, onboarding, groups, mission, checkin, help, records, collection, my)
  components/   공통 UI, 캐릭터(마스코트 SVG·단계 표시), 그룹 카드, 탭바
  features/     규칙(순수 함수: 성장·기분·미션·점검·도움 필터) + 기능 컴포넌트(기분·점검 팝업, 미션 패널)
  device/       기기에만 두는 데이터 (선택 정보 IndexedDB, 화면 상태 localStorage)
  data/         미션 주제 20쌍, 도움받을 곳 시드, 점검 문항, 감정·핑·지역
  services/     웹 푸시 권한·구독
  styles/       토큰, 전역 스타일
```

## 시연 (목업 서버)

마이 › 시연 도구:
- **시연 데이터 불러오기 (소은)**: 서울 마포구 대학생 26세, 친구 그룹 '우리 셋', 온라인 그룹 '아침 산책단'(5명 중 4명 완료, 49.8 → 소은 완료 시 50.2로 3단계)
- **하루 넘기기 / 일요일 19시로 / 실제 시각으로**: 시연 시계 (`PUT /demo/clock`)
- 초대 코드 시연: `HAPPYPNG`(참여) · `EXPRDCDE`(만료) · `FULLGRPS`(가득 참)

## 백엔드 연동이 남은 부분

코드에 `[백엔드 연동]`으로 표시되어 있다. 자세한 요청은 docs/작업기록.md의 「백엔드 전달 사항」 참고.
- `GET /missions/today` 응답에 시작 때 고른 `minutes`·`place`·`size` 추가 요청 (지금은 기기 저장값으로 대체)
- 웹 푸시: VAPID 공개키가 비어 있으면 권한 요청까지만 동작
- 캐릭터 단계별 도달일·날짜별 성장 그래프: 성장 기록 API 제안
