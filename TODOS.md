# TODOS

## Design Debt

### [ ] 스트릭 1일차 메시징 개선
**What:** 출석 스트릭 카운터의 첫날 문구를 '🔥 1일 연속 출석!' → '오늘 첫 출석 완료! 🐱'처럼 연속 개념보다 진입 의미를 강조하는 표현으로 변경.

**Why:** '1일 연속' 표현은 연속 개념이 아직 없는 신규 유저에게 어색하게 느껴질 수 있음. 2일차부터 '🔥 N일 연속 출석!'을 보여주는 것이 더 자연스럽고 동기 부여가 됨.

**Pros:** 신규 유저 첫 경험 개선, streak 개념을 점진적으로 도입.

**Cons:** 조건 분기 추가 필요 (streak === 1 vs streak > 1).

**Context:** `src/ui/home.js` checkAttendance 콜백에서 streak 값으로 분기. 현재는 streak 값을 그대로 사용함.

**Depends on / blocked by:** 없음 (독립 변경).

## Security / Correctness

### [ ] 서버 측 코인 잔액 검증 추가
**What:** `POST /exchange` 엔드포인트에서 `coinCount`를 DB의 실제 잔액(`SUM(coin_transactions)`)과 비교하는 서버 측 검증 추가.

**Why:** 현재는 클라이언트가 보낸 `coinCount`를 그대로 신뢰함. 실제 코인이 부족한 유저도 교환 레코드가 생성될 수 있어 포인트 남용 가능성 존재.

**Pros:** 서버 수준 무결성 보장, 조작 방지.

**Cons:** DB 조회 1회 추가 (성능 영향 없음).

**Context:** `server/routes/exchange.js` `POST /exchange` 핸들러 내 `coinCount` 사용 전 잔액 체크 삽입. `SELECT COALESCE(SUM(amount),0) FROM coin_transactions WHERE user_hash=?` 패턴 사용 (attendance.js에 동일 패턴 존재).

**Depends on / blocked by:** 없음 (독립 변경).

## Test Coverage

### [ ] Playwright E2E 테스트 — 교환 플로우
**What:** 교환 전체 Critical Path(홈 → 교환화면 → API 로드 → 교환 버튼 클릭 → 성공 모달 → 홈 복귀)를 Playwright로 자동화.

**Why:** 교환 플로우는 코인/포인트 전환을 담당하는 핵심 비즈니스 로직이지만 자동화 커버리지가 전혀 없음. 회귀 위험 높음.

**Pros:** Critical Path 회귀 자동 감지, /qa 스킬과 연동 가능.

**Cons:** 서버 mock 또는 테스트 DB 환경 세팅 필요.

**Context:** Playwright 이미 설치됨(`.playwright-mcp/` 존재). `tests/exchange.spec.js` 생성, 서버는 `TEST_MODE=true` 환경변수로 mock 코드 분기 또는 실제 서버 띄워서 통합 테스트.

**Depends on / blocked by:** 없음 (독립 변경).
