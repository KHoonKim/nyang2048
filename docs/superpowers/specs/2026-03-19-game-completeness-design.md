# 냥2048 게임 완성도 개선 설계

**Date:** 2026-03-19
**Status:** Approved

---

## 개요

냥2048의 핵심 리텐션 문제 두 가지를 해결한다:
1. 스테이지 클리어 후 더 할 게 없어 보임
2. 반복 플레이가 지루해짐

세 가지 접근을 함께 적용한다:
- **A) 콘텐츠 층위** — 스테이지 메달 시스템 + 데일리 챌린지
- **B) 메타 루프** — 고양이 희귀도 등급
- **C) 데일리 인게이지먼트** — 데일리 미션 + 주간 랭킹 + 출석 스트릭 + 포인트 교환

---

## 결정 사항 요약

| 항목 | 결정 |
|------|------|
| 기존 별점 시스템 | 메달(브론즈/실버/골드)로 **대체** |
| 서버 포트 | **4006** |
| 코인 보상 방식 | gift-cat NORMAL_TIERS 동일 확률 뽑기 |
| 7일 출석 보너스 | gift-cat 동일 패턴 (LUCKY_TIERS 뽑기) |
| 코인 교환 비율 | 10코인 = 1포인트 (gift-cat 동일) |
| 데일리 챌린지 재도전 | 횟수 제한 없음, 하루 1회 보상 |
| 인피니트 모드 | 데일리 미션 진행도에 포함 |
| 날짜 기준 | 전체 KST (Asia/Seoul) |
| 인증 방식 | Toss OAuth (gift-cat `auth.js` 패턴 복사) |

---

## A. 스테이지 메달 시스템

### 개요
기존 1-3성 시스템을 브론즈/실버/골드 메달로 **대체**한다. 이미 클리어한 스테이지에도 상위 메달 달성이라는 재도전 동기를 부여한다.

### 메달 기준

| 메달 | 조건 |
|------|------|
| 브론즈 | 스테이지 클리어 |
| 실버 | 클리어 + `medalTargets.silver` 점수 이상 |
| 골드 | 클리어 + `medalTargets.gold` 점수 이상 |

- `medalTargets`는 `stages.js` 각 스테이지에 신규 필드로 추가 (타일값이 아닌 점수 기준)
- 현재 `play.js`의 별점 계산 로직 제거
- 메달은 localStorage에 저장 (`score.js`의 stars 관련 함수 대체)

### UI 변경
- `home.js` 스테이지 카드: 별 아이콘 → 메달 아이콘 (🥉🥈🥇)
- `result.js`: 클리어 시 획득 메달 표시 + 애니메이션

### 클라이언트 변경 파일
- `src/game/stages.js` — `medalTargets: { silver, gold }` 필드 추가
- `src/game/score.js` — `saveMedal(stageId, medal)`, `getMedal(stageId)` 추가; 기존 star 함수 제거
- `src/ui/home.js` — 메달 아이콘 렌더링
- `src/ui/result.js` — 메달 표시 및 저장 호출
- `src/ui/play.js` — 별점 계산 로직 제거

---

## B. 데일리 챌린지

### 개요
매일 하나의 특별 스테이지를 제공한다. 클리어 시 코인 보상 지급 (하루 1회). 재도전 횟수 제한 없음.

### 챌린지 조건
서버에서 KST 날짜를 seed로 하여 결정:
- 오늘의 스테이지 (날짜 기반 인덱스로 스테이지 선택)
- 초기 타일 배치 조건 (날짜 seed 기반 랜덤 배치)

### 보드 저장 키 충돌 방지
일반 스테이지와 구분되는 키 사용: `daily_YYYY-MM-DD`

### 코인 보상
NORMAL_TIERS 기준 확률 뽑기 1회

### 서버 API
- `GET /daily-challenge` — 오늘의 챌린지 조건 반환 (KST 날짜 기반 seed)
- `POST /daily-challenge/complete` — 완료 처리, 코인 지급 (userHash + 오늘 날짜로 중복 차단)

### 클라이언트 변경 파일
- `src/ui/home.js` — 데일리 챌린지 진입 버튼
- `src/ui/play.js` — 챌린지 모드 지원 (보드 키 분리)
- `src/ui/result.js` — 챌린지 완료 보상 표시

---

## C. 고양이 희귀도 등급

### 등급 정의

| 등급 | 테두리 색상 | 타일값 기준 |
|------|------------|------------|
| Common | 회색 (`#9E9E9E`) | 2-32 |
| Rare | 파란색 (`#2196F3`) | 64-256 |
| Epic | 보라색 (`#9C27B0`) | 512-2048 |
| Legendary | 황금색 (`#FFD700`) | 4096+ |

### 클라이언트 변경
- `src/game/stages.js` — 각 고양이에 `rarity: 'common' | 'rare' | 'epic' | 'legendary'` 필드 추가
- `src/ui/collection.js` — 도감 카드에 희귀도 테두리/뱃지 표시; 미수집은 현재처럼 실루엣 유지
- `src/styles/main.css` — `.rarity-common`, `.rarity-rare`, `.rarity-epic`, `.rarity-legendary` CSS 추가

---

## D. 데일리 미션

### 개요
매일 3가지 미션 자동 생성 (KST 00:00 초기화). 완료 시 코인 보상. 인피니트 모드 포함.

### 미션 풀

| 미션 타입 | 설명 | 보상 |
|-----------|------|------|
| `play_games` | 게임 3판 플레이 | NORMAL_TIERS 뽑기 |
| `reach_tile` | 2048 이상 타일 만들기 | NORMAL_TIERS 뽑기 |
| `clear_stage` | 스테이지 하나 클리어 | NORMAL_TIERS 뽑기 |
| `score_threshold` | 합계 점수 50,000점 달성 | NORMAL_TIERS 뽑기 |

- 날짜 seed로 매일 3개 미션 고정 선택
- 서버에서 진행도 저장 (`mission_progress` 테이블)
- 미션 완료 여부는 서버에서 검증 (클라이언트가 이벤트 타입만 전송, 서버가 카운트)

### 서버 API
- `GET /missions/:userHash` — 오늘의 미션 + 진행도
- `POST /missions/event` — 이벤트 보고 (`{ userHash, event: 'game_played' | 'tile_reached' | 'stage_cleared' | 'score_earned', value }`)

### 클라이언트 변경
- `src/ui/home.js` — 미션 진행도 패널 (접을 수 있는 섹션)
- `src/ui/play.js` — 게임 완료/타일 달성/스코어 이벤트 서버 전송
- `src/ui/result.js` — 미션 완료 알림

---

## E. 주간 랭킹

### 개요
이번 주 최고 점수 기준 상위 20명 + 내 순위 표시. 매주 월요일 00:00 KST 초기화.

### 익명화
닉네임: `이름 앞 1글자 + **` (예: 김**)

### 점수 제출 제한
- `game_sessions` 테이블에 `UNIQUE(user_hash, week)` 제약으로 주당 최고 점수만 유지
- rate limiting: 유저당 시간당 최대 30회 제출 (서버 메모리 기반 카운터)

### 서버 API
- `GET /ranking/weekly` — 이번 주 상위 20명 + 요청자 순위
- `POST /game/session` — 게임 결과 제출 (`{ userHash, score, stage }`)

### 클라이언트 변경
- 신규 `src/ui/ranking.js` — 주간 랭킹 화면
- `src/ui/home.js` — 랭킹 진입 버튼
- `src/ui/result.js` — 게임 세션 서버 제출

---

## F. 출석 스트릭

### 개요
앱 진입 시 KST 날짜 기준 출석 기록. 7일 연속 출석 시 LUCKY_TIERS 뽑기 보상.

### 동작 방식
- `POST /attendance` — 오늘 출석 기록 (중복 무시, `PRIMARY KEY(user_hash, date)`)
- 연속 출석 판정: `attendance` 테이블에서 어제 날짜 레코드 존재 여부로 streak 계산
- 7일 달성 시 LUCKY_TIERS 코인 지급 후 streak 리셋
- 홈 화면에 스트릭 카운터 표시 (예: 🔥 5일 연속)

### 서버 API
- `POST /attendance` — 출석 기록 + streak 계산 반환
- `GET /attendance/:userHash` — 현재 streak 조회

### 클라이언트 변경
- `src/ui/home.js` — 앱 진입 시 출석 API 호출, streak 카운터 표시

---

## G. 포인트 교환 화면

gift-cat `exchange.js`, `promo.js` 패턴 그대로 이식.

- 코인 잔액 표시
- 교환 버튼 (10코인 = 1포인트)
- 교환 내역
- Toss 프로모션 API 연동 (mTLS)
- 신규 `src/ui/exchange.js` 화면

---

## 서버 아키텍처

### 기술 스택
- Express.js + better-sqlite3 (gift-cat 동일)
- 포트: **4006**
- PM2 프로세스명: `nyang2048`
- VPS: Hostinger (76.13.210.78), `/var/www/nyang2048/`
- API 경로 prefix: `/api/nyang2048`

### 디렉토리 구조
```
server/
├── index.js
├── db/
│   ├── schema.sql
│   └── init.js
├── routes/
│   ├── auth.js           # Toss OAuth (gift-cat 복사)
│   ├── coins.js          # 코인 잔액/뽑기 (gift-cat 복사)
│   ├── exchange.js       # 코인→포인트 교환 (gift-cat 복사)
│   ├── promo.js          # 프로모 코드 (gift-cat 복사)
│   ├── game.js           # 게임 세션, 주간 랭킹
│   ├── missions.js       # 데일리 미션
│   ├── attendance.js     # 출석 스트릭
│   └── daily-challenge.js
├── push.js               # Toss 푸시 알림 (gift-cat 복사)
└── package.json
```

### DB 스키마

기존 gift-cat 테이블 (users, coin_transactions, exchanges, promo_records, settings, play_sessions, ad_boosts) + 신규:

```sql
-- 게임 세션 (주간 랭킹용)
CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  score INTEGER NOT NULL,
  stage TEXT,
  week TEXT NOT NULL,  -- 'YYYY-WNN' KST 기준
  created_at TEXT DEFAULT (datetime('now', '+9 hours'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_user_week
  ON game_sessions(user_hash, week);

-- 데일리 미션 진행도
CREATE TABLE IF NOT EXISTS mission_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  date TEXT NOT NULL,  -- KST 'YYYY-MM-DD'
  UNIQUE(user_hash, mission_type, date)
);

-- 출석 기록
CREATE TABLE IF NOT EXISTS attendance (
  user_hash TEXT NOT NULL,
  date TEXT NOT NULL,  -- KST 'YYYY-MM-DD'
  PRIMARY KEY (user_hash, date)
);

-- 데일리 챌린지 완료 기록
CREATE TABLE IF NOT EXISTS daily_challenge_completions (
  user_hash TEXT NOT NULL,
  date TEXT NOT NULL,  -- KST 'YYYY-MM-DD'
  coins_earned INTEGER DEFAULT 0,
  PRIMARY KEY (user_hash, date)
);
```

### Nginx 설정
```nginx
location /api/nyang2048/ {
  proxy_pass http://localhost:4006/;
}
```

---

## 클라이언트 화면 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/game/stages.js` | `medalTargets`, `rarity` 필드 추가 |
| `src/game/score.js` | star 함수 → medal 함수 대체 |
| `src/ui/home.js` | 메달 표시, 데일리 챌린지 버튼, 미션 패널, 스트릭, 랭킹 버튼, 출석 API 호출 |
| `src/ui/play.js` | 별점 제거, 챌린지 모드, 미션 이벤트 전송 |
| `src/ui/result.js` | 메달 표시, 게임 세션 제출, 챌린지 완료 처리 |
| `src/ui/collection.js` | 희귀도 테두리/뱃지 |
| `src/styles/main.css` | 희귀도 CSS, 미션 패널, 메달 아이콘, 스트릭 카운터 |
| **신규** `src/ui/exchange.js` | 포인트 교환 화면 |
| **신규** `src/ui/ranking.js` | 주간 랭킹 화면 |

---

## 구현 순서

1. **서버 기반** — DB 스키마, auth, coins, exchange, promo (gift-cat 복사 + 수정)
2. **클라이언트 인증 플로우** — Toss OAuth 로그인, userHash 저장
3. **포인트 교환 화면** — `exchange.js` 신규 화면
4. **고양이 희귀도** — `stages.js` rarity 필드 + `collection.js` UI
5. **스테이지 메달** — stars → medals 대체 (score.js, stages.js, home.js, result.js)
6. **데일리 미션** — 서버 routes/missions.js + 클라이언트 패널
7. **주간 랭킹** — 서버 routes/game.js + `ranking.js` 신규 화면
8. **출석 스트릭** — 서버 routes/attendance.js + home.js 카운터
9. **데일리 챌린지** — 서버 routes/daily-challenge.js + play.js 모드 분기
10. **VPS 배포** — PM2, Nginx, 프로모 코드 설정
