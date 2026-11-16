# 행운핑 (프론트엔드)

함께 하는 작은 활동으로 일상을 돌보고, 힘든 날엔 실제 도움으로 이어주는 모바일 웹앱(PWA).

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 규칙 단위 테스트 (vitest)
npm run build    # 타입 검사 + 프로덕션 빌드 + 서비스 워커
```

## 구조

```
src/
  app/          라우터, 레이아웃(탭·전체화면·온보딩 가드), 모바일 프레임
  pages/        화면 (onboarding, groups, mission, checkin, help, records, my)
  components/   공통 UI (Button, BottomSheet, HelpCard, MoodChip, Ping, ProgressBar, Form, Toast), Character, GroupCard, TabBar
  features/     규칙(순수 함수: 성장·기분·미션·점검·도움 필터) + 기능 컴포넌트(기분 팝업, 점검 팝업, 미션 패널)
  data/         미션 주제 풀, 도움받을 곳(공공서비스 큐레이션), 점검 문항, 지역
  services/     목업 저장소(db.ts) + API 함수(api.ts). 백엔드가 정해지면 api.ts 내부만 교체
  styles/       Figma 변수 기반 토큰
```

## 목업 범위

- 백엔드 미정(#1)이라 데이터는 `localStorage`의 목업 저장소에 둔다. 다른 구성원의 완료·핑은 결정적 해시로 흉내 낸다.
- 카카오 로그인은 목업. 웹 푸시는 권한 요청까지(발송은 서버 필요).
- 마이 › 시연 도구: 시연 데이터(소은) 불러오기, 하루 넘기기, 점검 요일로 이동. 친구 그룹 시연 코드 `CLOVER`.
