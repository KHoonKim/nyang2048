# 냥2048 게임 완성도 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버 기반(auth/coins/exchange/attendance), 포인트 교환 화면, 고양이 희귀도, 스테이지 메달, 출석 스트릭을 구현해 게임의 리텐션과 완성도를 높인다.

**Architecture:** gift-cat 서버 패턴(Express + better-sqlite3 + Toss OAuth mTLS)을 nyang2048용으로 이식한다. 클라이언트는 `src/core/api.js` 유틸리티로 서버와 통신하며, 기존 `ait.js`의 `getUserKeyForGame()`을 userHash 소스로 사용한다. 메달/희귀도는 localStorage 기반이며 서버 없이도 동작한다.

**Tech Stack:** Express.js, better-sqlite3, Toss OAuth (mTLS), Vite, Vanilla JS

**Spec:** `docs/superpowers/specs/2026-03-19-game-completeness-design.md`

---

## 파일 목록

### 서버 (신규/교체)
- Create: `server/index.js` — ESM 기반 Express 앱 (포트 4006, 기존 CommonJS 교체)
- Create: `server/db/schema.sql` — DB 스키마 (gift-cat + attendance)
- Create: `server/db/init.js` — better-sqlite3 초기화
- Create: `server/routes/auth.js` — Toss OAuth (gift-cat 복사, cert 경로 nyang2048으로)
- Create: `server/routes/coins.js` — 코인 잔액/뽑기 (gift-cat 복사)
- Create: `server/routes/exchange.js` — 코인→포인트 교환 (gift-cat 복사)
- Create: `server/routes/promo.js` — 프로모 코드 (gift-cat 복사)
- Create: `server/routes/attendance.js` — 출석 스트릭 (신규)
- Create: `server/push.js` — Toss 푸시 (gift-cat 복사, cert 경로 nyang2048으로)
- Create: `server/package.json` — ESM, better-sqlite3 의존성
- Modify: `server/.gitignore` — keys/, *.db 제외

### 클라이언트 (신규)
- Create: `src/core/api.js` — 서버 API 클라이언트 유틸리티

### 클라이언트 (교체/수정)
- Modify: `src/game/stages.js` — `CAT_RARITY` 맵, `STAGE_MEDAL_TARGETS` 추가
- Modify: `src/game/score.js` — `saveStars`/`getStars` → `saveMedal`/`getMedal` 교체
- Modify: `src/ui/play.js` — 별점 계산 → 메달 계산 교체
- Modify: `src/ui/home.js` — 메달 뱃지 + 스트릭 카운터 추가
- Modify: `src/ui/result.js` — 메달 표시 추가
- Modify: `src/ui/collection.js` — 희귀도 CSS 클래스 추가
- Modify: `src/styles/main.css` — 희귀도/메달 CSS 추가

### 클라이언트 (신규 화면)
- Create: `src/ui/exchange.js` — 포인트 교환 화면
- Modify: `src/main.js` or entry — exchange 라우트 등록

---

## Task 1: 서버 패키지 설정

**Files:**
- Create: `server/package.json`
- Modify: `server/index.js`

- [ ] **Step 1: server/package.json 작성**

```json
{
  "name": "nyang2048-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "TZ=Asia/Seoul node index.js",
    "dev": "TZ=Asia/Seoul node --watch index.js"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
```

- [ ] **Step 2: 서버 의존성 설치**

```bash
cd /Users/daniel/Documents/nyang2048/server && npm install
```

Expected: `node_modules/` 생성, `package-lock.json` 생성

- [ ] **Step 3: server/index.js를 ESM으로 교체**

```js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db/init.js';
import authRoutes from './routes/auth.js';
import coinRoutes from './routes/coins.js';
import exchangeRoutes from './routes/exchange.js';
import promoRoutes from './routes/promo.js';
import attendanceRoutes from './routes/attendance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4006;

app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/appintos/nyang2048', express.static(path.join(__dirname, 'public')));

const db = initDB();
const prefix = '/api/nyang2048';
app.use(prefix, authRoutes(db));
app.use(prefix, coinRoutes(db));
app.use(prefix, exchangeRoutes(db));
app.use(prefix, promoRoutes(db));
app.use(prefix, attendanceRoutes(db));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'nyang2048' }));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[nyang2048] 서버 시작: http://localhost:${PORT}`);
});
```

- [ ] **Step 4: 서버 시작 확인**

```bash
cd /Users/daniel/Documents/nyang2048/server && node index.js
```

Expected: `[nyang2048] 서버 시작: http://localhost:4006`
(DB/routes 파일이 없어 에러가 나도 정상 — 다음 Task에서 추가)

- [ ] **Step 5: server/.gitignore 생성**

```bash
cat > /Users/daniel/Documents/nyang2048/server/.gitignore << 'EOF'
*.db
*.db-shm
*.db-wal
keys/
node_modules/
*.crt
*.key
EOF
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add server/package.json server/package-lock.json server/index.js server/.gitignore
git commit -m "feat(server): ESM 기반 서버로 교체, 포트 4006"
```

---

## Task 2: DB 스키마 및 초기화

**Files:**
- Create: `server/db/schema.sql`
- Create: `server/db/init.js`

- [ ] **Step 1: server/db/schema.sql 작성**

```sql
CREATE TABLE IF NOT EXISTS users (
  user_hash TEXT PRIMARY KEY,
  user_name TEXT,
  user_gender TEXT,
  user_birthday TEXT,
  user_email TEXT,
  points INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  promo_type TEXT NOT NULL,
  promo_code TEXT,
  amount INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_hash, promo_type)
);

CREATE TABLE IF NOT EXISTS exchanges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  coin_count INTEGER NOT NULL,
  points INTEGER NOT NULL,
  promo_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_exchange', 'PLACEHOLDER_EXCHANGE');
INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_login', 'PLACEHOLDER_LOGIN');
INSERT OR IGNORE INTO settings (key, value) VALUES ('push_template_id', '');

CREATE TABLE IF NOT EXISTS attendance (
  user_hash TEXT NOT NULL,
  date TEXT NOT NULL,
  PRIMARY KEY (user_hash, date)
);
```

- [ ] **Step 2: server/db/init.js 작성**

```js
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function initDB() {
  const dbPath = path.join(__dirname, '..', 'nyang2048.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('[db] 초기화 완료:', dbPath);
  return db;
}
```

- [ ] **Step 3: 서버 재시작하여 DB 생성 확인**

```bash
cd /Users/daniel/Documents/nyang2048/server && node index.js
```

Expected: `[db] 초기화 완료: .../server/nyang2048.db` 출력, 에러 없이 실행

- [ ] **Step 4: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add server/db/
git commit -m "feat(server): DB 스키마 및 초기화 추가"
```

---

## Task 3: 서버 라우트 — auth, coins, exchange, promo

**Files:**
- Create: `server/routes/auth.js`
- Create: `server/routes/coins.js`
- Create: `server/routes/exchange.js`
- Create: `server/routes/promo.js`
- Create: `server/push.js`

- [ ] **Step 1: gift-cat에서 라우트 파일 복사 후 경로 수정**

```bash
cp /Users/daniel/Documents/gift-cat/server/routes/auth.js /Users/daniel/Documents/nyang2048/server/routes/auth.js
cp /Users/daniel/Documents/gift-cat/server/routes/coins.js /Users/daniel/Documents/nyang2048/server/routes/coins.js
cp /Users/daniel/Documents/gift-cat/server/routes/exchange.js /Users/daniel/Documents/nyang2048/server/routes/exchange.js
cp /Users/daniel/Documents/gift-cat/server/routes/promo.js /Users/daniel/Documents/nyang2048/server/routes/promo.js
cp /Users/daniel/Documents/gift-cat/server/push.js /Users/daniel/Documents/nyang2048/server/push.js
mkdir -p /Users/daniel/Documents/nyang2048/server/routes
```

- [ ] **Step 2: auth.js — cert 경로를 nyang2048으로 수정**

`server/routes/auth.js`에서 다음 두 줄 변경:

```js
// 변경 전:
const certPath = fs.existsSync('/root/gift-cat_public.crt')
  ? '/root/gift-cat_public.crt'
  : path.join(projectRoot, 'gift-cat_public.crt');
const keyPath = fs.existsSync('/root/gift-cat_private.key')
  ? '/root/gift-cat_private.key'
  : path.join(projectRoot, 'gift-cat_private.key');

// 변경 후:
const certPath = fs.existsSync('/root/nyang2048_public.crt')
  ? '/root/nyang2048_public.crt'
  : path.join(projectRoot, 'nyang2048_public.crt');
const keyPath = fs.existsSync('/root/nyang2048_private.key')
  ? '/root/nyang2048_private.key'
  : path.join(projectRoot, 'nyang2048_private.key');
```

- [ ] **Step 3: auth.js — keys 파일 경로 확인**

auth.js의 Toss API 호출에는 별도 appId 필드가 없다 (앱 식별은 mTLS 인증서 자체에 내장됨). 변경 필요 없음. keys 파일 경로만 확인:

```js
// 이 줄은 그대로 유지 — keys/ 디렉토리 경로는 동일하게 사용
const tossKeysPath = path.join(__dirname, '..', 'keys', 'toss-login.json');
```

Step 2에서 cert 경로를 `nyang2048_public.crt` / `nyang2048_private.key`로 변경한 것으로 충분하다.

- [ ] **Step 4: push.js — cert 경로 수정**

```js
// 변경 전:
'/root/gift-cat_public.crt' → '/root/nyang2048_public.crt'
'/root/gift-cat_private.key' → '/root/nyang2048_private.key'
```

- [ ] **Step 5: 서버 시작 및 health 확인**

```bash
cd /Users/daniel/Documents/nyang2048/server && node index.js &
curl http://localhost:4006/health
```

Expected: `{"ok":true,"service":"nyang2048"}`

```bash
curl http://localhost:4006/api/nyang2048/coins/test-user
```

Expected: `{"coins":0,"totalPoints":0}`

- [ ] **Step 6: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add server/routes/auth.js server/routes/coins.js server/routes/exchange.js server/routes/promo.js server/push.js
git commit -m "feat(server): auth/coins/exchange/promo 라우트 추가 (gift-cat 이식)"
```

---

## Task 4: 서버 라우트 — attendance (출석 스트릭)

**Files:**
- Create: `server/routes/attendance.js`

- [ ] **Step 1: server/routes/attendance.js 작성**

```js
import { Router } from 'express';

function getKSTDate() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function getKSTYesterday() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function calcStreak(db, userHash) {
  // 최근 출석일 목록을 역순으로 조회해 연속일 계산
  const rows = db.prepare(`
    SELECT date FROM attendance
    WHERE user_hash = ?
    ORDER BY date DESC
  `).all(userHash);

  if (rows.length === 0) return 0;

  const today = getKSTDate();
  // 오늘 또는 어제부터 시작하지 않으면 streak 0
  if (rows[0].date !== today && rows[0].date !== getKSTYesterday()) return 0;

  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].date);
    const curr = new Date(rows[i].date);
    const diff = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default function attendanceRoutes(db) {
  const router = Router();

  // 출석 체크 (하루 1회, 중복 무시)
  router.post('/attendance', (req, res) => {
    const { userHash } = req.body;
    if (!userHash) return res.status(400).json({ error: 'missing_params' });

    const today = getKSTDate();

    // 이미 오늘 출석했는지 확인
    const existing = db.prepare(
      'SELECT date FROM attendance WHERE user_hash = ? AND date = ?'
    ).get(userHash, today);

    if (!existing) {
      db.prepare(
        'INSERT OR IGNORE INTO attendance (user_hash, date) VALUES (?, ?)'
      ).run(userHash, today);
    }

    const streak = calcStreak(db, userHash);

    // 7일 연속 달성 시 LUCKY_TIERS 코인 지급
    let bonusCoins = 0;
    if (streak % 7 === 0 && !existing) {
      // LUCKY_TIERS: 최소 10코인 보장
      const LUCKY_TIERS = [
        { min: 10, max: 15, probability: 0.60 },
        { min: 16, max: 25, probability: 0.20 },
        { min: 26, max: 50, probability: 0.189899 },
        { min: 50, max: 100, probability: 0.01 },
        { min: 10000, max: 10000, probability: 0.000001 },
      ];
      let rand = Math.random();
      let cumulative = 0;
      for (const tier of LUCKY_TIERS) {
        cumulative += tier.probability;
        if (rand < cumulative) {
          bonusCoins = Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
          break;
        }
      }
      bonusCoins = Math.min(bonusCoins, 100); // 잭팟 티어(10000코인) 의도적 비활성화 — 서버 비용 보호
      if (bonusCoins > 0) {
        db.prepare(
          'INSERT INTO coin_transactions (user_hash, amount, reason) VALUES (?, ?, ?)'
        ).run(userHash, bonusCoins, 'streak_bonus_7day');
      }
    }

    const coinsRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as coins FROM coin_transactions WHERE user_hash = ?'
    ).get(userHash);

    res.json({
      success: true,
      streak,
      alreadyChecked: !!existing,
      bonusCoins,
      totalCoins: coinsRow.coins,
    });
  });

  // 스트릭 조회
  router.get('/attendance/:userHash', (req, res) => {
    const { userHash } = req.params;
    const streak = calcStreak(db, userHash);
    const today = getKSTDate();
    const checkedToday = !!db.prepare(
      'SELECT date FROM attendance WHERE user_hash = ? AND date = ?'
    ).get(userHash, today);
    res.json({ streak, checkedToday });
  });

  return router;
}
```

- [ ] **Step 2: 출석 API 테스트**

```bash
# 서버 재시작
cd /Users/daniel/Documents/nyang2048/server && node index.js &

# 출석 체크
curl -X POST http://localhost:4006/api/nyang2048/attendance \
  -H 'Content-Type: application/json' \
  -d '{"userHash":"test-user-001"}'
```

Expected: `{"success":true,"streak":1,"alreadyChecked":false,"bonusCoins":0,"totalCoins":0}`

```bash
# 중복 체크 (같은 날 재호출)
curl -X POST http://localhost:4006/api/nyang2048/attendance \
  -H 'Content-Type: application/json' \
  -d '{"userHash":"test-user-001"}'
```

Expected: `{"success":true,"streak":1,"alreadyChecked":true,"bonusCoins":0,...}`

```bash
# 스트릭 조회
curl http://localhost:4006/api/nyang2048/attendance/test-user-001
```

Expected: `{"streak":1,"checkedToday":true}`

- [ ] **Step 3: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add server/routes/attendance.js
git commit -m "feat(server): 출석 스트릭 라우트 추가"
```

---

## Task 5: 클라이언트 API 유틸리티

**Files:**
- Create: `src/core/api.js`

- [ ] **Step 1: src/core/api.js 작성**

```js
// 서버 API 클라이언트
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:4006/api/nyang2048';

async function getUserHash() {
  if (window.AIT) return AIT.getUserKeyForGame();
  return localStorage.getItem('nyang-uid') || 'web_anonymous';
}

export async function apiGet(path) {
  try {
    const res = await fetch(`${SERVER_URL}${path}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function apiPost(path, body) {
  try {
    const res = await fetch(`${SERVER_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// 출석 체크
export async function checkAttendance() {
  const userHash = await getUserHash();
  return apiPost('/attendance', { userHash });
}

// 출석 스트릭 조회
export async function getStreak() {
  const userHash = await getUserHash();
  return apiGet(`/attendance/${userHash}`);
}

// 코인 잔액 조회
export async function getCoins() {
  const userHash = await getUserHash();
  return apiGet(`/coins/${userHash}`);
}

// 보상 뽑기
export async function drawReward(type = 'gift') {
  const userHash = await getUserHash();
  return apiPost('/reward', { userHash, type });
}

// 교환 내역 조회
export async function getExchanges() {
  const userHash = await getUserHash();
  return apiGet(`/exchanges/${userHash}`);
}

// 교환 신청
export async function requestExchange(coinCount) {
  const userHash = await getUserHash();
  return apiPost('/exchange', { userHash, coinCount });
}

// 교환 확정 (프로모 grant 후)
export async function confirmExchange(exchangeId) {
  const userHash = await getUserHash();
  return apiPost('/exchange/confirm', { userHash, exchangeId });
}
```

- [ ] **Step 2: 프로덕션 API URL을 .env에 추가**

`.env.production` 파일을 확인하거나 생성:
```bash
echo "VITE_API_URL=https://srv1412821.hstgr.cloud/api/nyang2048" >> /Users/daniel/Documents/nyang2048/.env.production
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/core/api.js .env.production
git commit -m "feat(client): 서버 API 유틸리티 추가"
```

---

## Task 6: 고양이 희귀도

**Files:**
- Modify: `src/game/stages.js`
- Modify: `src/ui/collection.js`
- Modify: `src/styles/main.css`

- [ ] **Step 0: CAT_RARITY ID 검증**

stages.js의 모든 catId와 아래 CAT_RARITY 키가 일치하는지 확인:

```bash
node -e "
import('/Users/daniel/Documents/nyang2048/src/game/stages.js').then(m => {
  const allIds = new Set([
    ...Object.values(m.COMMON_CATS),
    ...Object.values(m.CAT_NAMES)
  ]);
  console.log('stages catIds:', [...allIds].sort().join(', '));
});
"
```

아래 CAT_RARITY 키와 대조하여 누락된 catId가 없는지 확인. 빌드 에러는 없지만 누락 시 'common'으로 폴백되므로 수동 확인이 필요하다.

- [ ] **Step 1: stages.js에 CAT_RARITY 맵 추가**

`src/game/stages.js`의 `CAT_NAMES` 객체 바로 아래에 추가:

```js
// 타일 값 기준 희귀도: Common(2-32), Rare(64-256), Epic(512-2048), Legendary(4096+)
export const CAT_RARITY = {
  // Common (타일 2-32)
  korean: 'common', russian: 'common', bombay: 'common', bengal: 'common', ragdoll: 'common',
  // Rare (타일 64-256)
  scottish: 'rare', persian: 'rare', munchkin: 'rare', british: 'rare',
  'american-sh': 'rare', siamese: 'rare', norwegian: 'rare', burmese: 'rare',
  'turkish-angora': 'rare', mainecoon: 'rare', 'oriental-sh': 'rare',
  'devon-rex': 'rare', birman: 'rare', korat: 'rare', sphynx: 'rare',
  'selkirk-rex': 'rare',
  // Epic (타일 512-2048)
  'exotic-sh': 'epic', abyssinian: 'epic', himalayan: 'epic', 'havana-brown': 'epic',
  somali: 'epic', balinese: 'epic', 'egyptian-mau': 'epic', 'japanese-bt': 'epic',
  chartreux: 'epic', 'cornish-rex': 'epic', savannah: 'epic', manx: 'epic',
  'american-curl': 'epic', toyger: 'epic', 'turkish-van': 'epic', ocicat: 'epic',
  pixiebob: 'epic',
  // Legendary (타일 4096+)
  singapura: 'legendary', tonkinese: 'legendary', nebelung: 'legendary',
};
```

- [ ] **Step 2: collection.js — 고양이 카드에 희귀도 클래스 추가**

`src/ui/collection.js`에서 `CAT_RARITY` import 추가:

```js
// 변경 전:
import { ALL_CATS_ORDERED, CAT_NAMES, CAT_TRAITS, getCatImage, STAGES } from '../game/stages.js';

// 변경 후:
import { ALL_CATS_ORDERED, CAT_NAMES, CAT_TRAITS, getCatImage, STAGES, CAT_RARITY } from '../game/stages.js';
```

카드 렌더링 부분에서 희귀도 클래스 추가:

```js
// 변경 전:
const lvClass = !found ? 'locked' : isComplete ? 'complete' : `lv${catCount}`;
return `
  <button class="cat-card cat-card--${lvClass}"

// 변경 후:
const lvClass = !found ? 'locked' : isComplete ? 'complete' : `lv${catCount}`;
const rarity = CAT_RARITY[cat.id] || 'common';
return `
  <button class="cat-card cat-card--${lvClass} cat-card--${rarity}"
```

- [ ] **Step 3: main.css에 희귀도 CSS 추가**

`src/styles/main.css`의 `.cat-card` 관련 스타일 아래에 추가:

```css
/* 희귀도 테두리 */
.cat-card--common { --rarity-color: #9E9E9E; }
.cat-card--rare   { --rarity-color: #2196F3; }
.cat-card--epic   { --rarity-color: #9C27B0; }
.cat-card--legendary { --rarity-color: #FFD700; }

.cat-card--rare,
.cat-card--epic,
.cat-card--legendary {
  border: 2px solid var(--rarity-color);
  box-shadow: 0 0 6px 0 color-mix(in srgb, var(--rarity-color) 40%, transparent);
}

.cat-card--legendary {
  box-shadow: 0 0 10px 2px color-mix(in srgb, var(--rarity-color) 60%, transparent);
}

/* 희귀도 뱃지 (카드 우상단) */
.cat-card--rare::after,
.cat-card--epic::after,
.cat-card--legendary::after {
  content: attr(data-rarity-label);
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 9px;
  font-weight: 700;
  color: var(--rarity-color);
  letter-spacing: 0.03em;
}
```

- [ ] **Step 4: collection.js — data-rarity-label 속성 추가**

카드 버튼에 data 속성 추가:

```js
// 변경 전:
return `
  <button class="cat-card cat-card--${lvClass} cat-card--${rarity}"

// 변경 후:
const rarityLabels = { common: '', rare: 'RARE', epic: 'EPIC', legendary: 'LEGEND' };
return `
  <button class="cat-card cat-card--${lvClass} cat-card--${rarity}"
    data-rarity-label="${found ? rarityLabels[rarity] : ''}"
```

- [ ] **Step 5: 빌드 확인**

```bash
cd /Users/daniel/Documents/nyang2048 && npm run build 2>&1 | tail -5
```

Expected: 에러 없이 빌드 완료

- [ ] **Step 6: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/game/stages.js src/ui/collection.js src/styles/main.css
git commit -m "feat: 고양이 희귀도 등급 표시 (Common/Rare/Epic/Legendary)"
```

---

## Task 7: 스테이지 메달 — 데이터 및 저장

**Files:**
- Modify: `src/game/stages.js` — `STAGE_MEDAL_TARGETS` 추가
- Modify: `src/game/score.js` — stars → medals 교체

- [ ] **Step 1: stages.js에 STAGE_MEDAL_TARGETS 추가**

`CAT_RARITY` 아래에 추가. 기준: silver = goal × 4, gold = goal × 8 (보드 크기별 자연스러운 점수):

```js
// 메달 기준 점수 (silver: 실버 이상, gold: 골드)
export const STAGE_MEDAL_TARGETS = {
  1:  { silver: 256,    gold: 512    },  // goal 64, 5×5
  2:  { silver: 512,    gold: 1024   },  // goal 128, 5×5
  3:  { silver: 1024,   gold: 2048   },  // goal 256, 5×5
  4:  { silver: 512,    gold: 1024   },  // goal 128, 4×4
  5:  { silver: 1024,   gold: 2048   },  // goal 256, 4×4
  6:  { silver: 2048,   gold: 4096   },  // goal 512, 5×5
  7:  { silver: 2048,   gold: 4096   },  // goal 512, 4×4
  8:  { silver: 4096,   gold: 8192   },  // goal 1024, 4×4
  9:  { silver: 4096,   gold: 8192   },  // goal 1024, 5×5
  10: { silver: 1024,   gold: 2048   },  // goal 256, 4×3
  11: { silver: 8192,   gold: 16384  },  // goal 2048, 4×4
  12: { silver: 2048,   gold: 4096   },  // goal 512, 4×3
  13: { silver: 8192,   gold: 16384  },  // goal 2048, 5×5
  14: { silver: 4096,   gold: 8192   },  // goal 1024, 4×3
  15: { silver: 8192,   gold: 16384  },  // goal 2048, 6×6
  16: { silver: 16384,  gold: 32768  },  // goal 4096, 6×6
  17: { silver: 512,    gold: 1024   },  // goal 128, 3×3
  18: { silver: 1024,   gold: 2048   },  // goal 256, 3×3
  19: { silver: 16384,  gold: 32768  },  // goal 4096, 7×7
  20: { silver: 32768,  gold: 65536  },  // goal 8192, 8×8
};
```

- [ ] **Step 2: score.js — stars 관련 코드를 medals로 교체**

`src/game/score.js`의 `// ── Stage Stars ──` 섹션 (131-148줄)을 다음으로 교체:

```js
// ── Stage Medals ──
const MEDALS_KEY = 'nyang2048_medals';

export function getMedal(stageId) {
  try {
    const data = JSON.parse(localStorage.getItem(MEDALS_KEY) || '{}');
    return data[stageId] || null; // null | 'bronze' | 'silver' | 'gold'
  } catch { return null; }
}

export function saveMedal(stageId, medal) {
  const RANK = { bronze: 1, silver: 2, gold: 3 };
  try {
    const data = JSON.parse(localStorage.getItem(MEDALS_KEY) || '{}');
    if ((RANK[medal] || 0) > (RANK[data[stageId]] || 0)) {
      data[stageId] = medal;
      localStorage.setItem(MEDALS_KEY, JSON.stringify(data));
    }
  } catch {}
}
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/game/stages.js src/game/score.js
git commit -m "feat: 스테이지 메달 데이터 구조 추가, stars → medals 교체"
```

---

## Task 8: 스테이지 메달 — play.js 계산 교체

**Files:**
- Modify: `src/ui/play.js`

- [ ] **Step 1: play.js import 수정**

```js
// 변경 전:
import {
  addToCollection, COLLECTION_MAX,
  getBestScore, getBestTime,
  saveBestScore, saveBestTime,
  saveBoard, loadBoard, clearBoard,
  unlockNextStage, unlockInfinite, isInfiniteUnlocked,
  saveStars
} from '../game/score.js';

// 변경 후:
import {
  addToCollection, COLLECTION_MAX,
  getBestScore, getBestTime,
  saveBestScore, saveBestTime,
  saveBoard, loadBoard, clearBoard,
  unlockNextStage, unlockInfinite, isInfiniteUnlocked,
  saveMedal
} from '../game/score.js';
```

- [ ] **Step 2: stages.js import에 STAGE_MEDAL_TARGETS 추가**

```js
// 변경 전:
import { getCatForValue, STAGES, CAT_NAMES, getCatImage, getStageCatLineup } from '../game/stages.js';

// 변경 후:
import { getCatForValue, STAGES, CAT_NAMES, getCatImage, getStageCatLineup, STAGE_MEDAL_TARGETS } from '../game/stages.js';
```

- [ ] **Step 3: handleWin()의 별점 계산을 메달 계산으로 교체**

`play.js`의 `handleWin()` 함수에서 (454-459줄 근처):

```js
// 변경 전:
      // Calculate stars: 1=clear, 2=good score, 3=no undo
      let stars = 1;
      if (currentScore >= stage.goal * 8) stars = 2;
      if (!usedUndo) stars = Math.max(stars, 2);
      if (!usedUndo && currentScore >= stage.goal * 8) stars = 3;
      saveStars(stageId, stars);

// 변경 후:
      // 메달 계산: bronze=클리어, silver=목표점수 이상, gold=고점수
      const targets = STAGE_MEDAL_TARGETS[stageId];
      let medal = 'bronze';
      if (targets) {
        if (currentScore >= targets.gold) medal = 'gold';
        else if (currentScore >= targets.silver) medal = 'silver';
      }
      saveMedal(stageId, medal);
```

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/daniel/Documents/nyang2048 && npm run build 2>&1 | tail -5
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/play.js
git commit -m "feat: 스테이지 메달 계산 로직 구현 (bronze/silver/gold)"
```

---

## Task 9: 스테이지 메달 — home.js 및 result.js UI

**Files:**
- Modify: `src/ui/home.js`
- Modify: `src/ui/result.js`
- Modify: `src/styles/main.css`

- [ ] **Step 1: home.js import에 getMedal 추가**

```js
// 변경 전:
import { getUnlockedStage, isInfiniteUnlocked, getBestScore, getBestTime, getCollectionCount, getCollection, COLLECTION_MAX, DEBUG_MODE, enableDebugMode } from '../game/score.js';

// 변경 후:
import { getUnlockedStage, isInfiniteUnlocked, getBestScore, getBestTime, getCollectionCount, getCollection, COLLECTION_MAX, DEBUG_MODE, enableDebugMode, getMedal } from '../game/score.js';
```

- [ ] **Step 2: home.js — 잠금 해제된 스테이지 카드에 메달 뱃지 추가**

`home.js`에서 스테이지 카드 렌더링 부분(`const best = getBestScore(n);` 근처)에 추가:

```js
const medal = getMedal(n); // null | 'bronze' | 'silver' | 'gold'
const medalHtml = medal ? `<span class="stage-medal stage-medal--${medal}">${{ bronze: '🥉', silver: '🥈', gold: '🥇' }[medal]}</span>` : '';
```

카드 HTML에서 `stage-card__top` 내부에 메달 추가:

```js
// stage-card__badge 옆에 medalHtml 삽입
`<div class="stage-card__badge">${n}</div>${medalHtml}`
```

- [ ] **Step 3: result.js — 클리어 시 메달 표시**

`src/ui/result.js`에서 `getMedal`, `STAGE_MEDAL_TARGETS` import 추가:

```js
import { getBestScore, getBestTime, getMedal } from '../game/score.js';
import { getCatImage, CAT_NAMES, STAGES, STAGE_MEDAL_TARGETS } from '../game/stages.js';
```

클리어 화면 HTML에서 메달 표시 추가 (result-emoji 아래):

```js
// 클리어된 경우에만
const medal = !isInfinite ? getMedal(stageId) : null;
const medalLabel = { bronze: '🥉 브론즈', silver: '🥈 실버', gold: '🥇 골드' };
const medalHtml = medal ? `<div class="result-medal">${medalLabel[medal]} 메달 획득!</div>` : '';
```

결과 화면 HTML에서 `result-title` 아래에 `${medalHtml}` 삽입.

- [ ] **Step 4: main.css에 메달 CSS 추가**

```css
/* 스테이지 카드 메달 뱃지 */
.stage-medal {
  font-size: 18px;
  line-height: 1;
}

/* 결과 화면 메달 */
.result-medal {
  font-size: 18px;
  font-weight: 700;
  margin: 8px 0 16px;
  color: var(--tds-primary);
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd /Users/daniel/Documents/nyang2048 && npm run build 2>&1 | tail -5
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/home.js src/ui/result.js src/styles/main.css
git commit -m "feat: 홈 스테이지 카드 메달 표시 + 결과 화면 메달 연출"
```

---

## Task 10: 포인트 교환 화면

**Files:**
- Create: `src/ui/exchange.js`
- Modify: `src/main.js` (또는 앱 진입점) — exchange 라우트 등록
- Modify: `src/ui/home.js` — 교환 진입 버튼 추가
- Modify: `src/styles/main.css` — 교환 화면 CSS

> Note: 앱 진입점 파일명을 먼저 확인: `ls src/` 또는 `cat vite.config.js`에서 entry 확인

- [ ] **Step 1: 앱 진입점 파일 확인**

```bash
cat /Users/daniel/Documents/nyang2048/vite.config.js
ls /Users/daniel/Documents/nyang2048/src/
```

Expected: `main.js` 또는 `index.js` 확인

- [ ] **Step 2: src/ui/exchange.js 작성**

```js
import { navigate } from '../core/router.js';
import { getCoins, getExchanges, requestExchange, confirmExchange } from '../core/api.js';

export async function renderExchange() {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="exchange-screen">
    <div class="exchange-header">
      <button class="exchange-back-btn" id="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="exchange-title">포인트 교환</div>
    </div>
    <div class="exchange-body" id="exchange-body">
      <div class="exchange-loading">불러오는 중...</div>
    </div>
  </div>`;

  document.getElementById('back-btn').addEventListener('click', () => navigate('home'));

  // 코인 잔액 로드
  const coinsData = await getCoins();
  const coins = coinsData?.coins ?? 0;
  const exchangeHistory = await getExchanges() ?? { exchanges: [] };
  const exchanges = exchangeHistory.exchanges || [];

  const COINS_PER_POINT = 10;
  const canExchange = coins >= COINS_PER_POINT;
  const maxPoints = Math.floor(coins / COINS_PER_POINT);

  document.getElementById('exchange-body').innerHTML = `
    <div class="exchange-balance">
      <div class="exchange-balance__label">보유 코인</div>
      <div class="exchange-balance__amount">${coins.toLocaleString()} 코인</div>
    </div>
    <div class="exchange-rate">
      <span>10 코인 = 1 토스포인트</span>
    </div>
    ${canExchange ? `
      <div class="exchange-form">
        <div class="exchange-form__label">교환할 포인트</div>
        <div class="exchange-form__controls">
          <input type="number" id="exchange-amount" class="exchange-form__input"
            value="1" min="1" max="${maxPoints}" />
          <span class="exchange-form__unit">포인트</span>
        </div>
        <div class="exchange-form__info">= <span id="coin-calc">${COINS_PER_POINT}</span> 코인 사용</div>
        <button class="tds-btn tds-btn-md tds-btn-block exchange-form__btn" id="exchange-btn">
          포인트로 교환하기
        </button>
      </div>
    ` : `
      <div class="exchange-empty">
        코인이 부족해요.<br>게임을 플레이해서 코인을 모아보세요!
      </div>
    `}
    ${exchanges.length > 0 ? `
      <div class="exchange-history">
        <div class="exchange-history__title">교환 내역</div>
        ${exchanges.slice(0, 5).map(e => `
          <div class="exchange-history__item">
            <span>${e.points}포인트</span>
            <span class="exchange-history__status exchange-history__status--${e.status}">
              ${{ pending: '처리중', confirmed: '완료', restored: '취소' }[e.status] || e.status}
            </span>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  if (!canExchange) return;

  const amountInput = document.getElementById('exchange-amount');
  const coinCalc = document.getElementById('coin-calc');
  amountInput.addEventListener('input', () => {
    const v = Math.max(1, Math.min(parseInt(amountInput.value) || 1, maxPoints));
    amountInput.value = v;
    coinCalc.textContent = (v * COINS_PER_POINT).toLocaleString();
  });

  document.getElementById('exchange-btn').addEventListener('click', async () => {
    const points = parseInt(amountInput.value) || 1;
    const coinCount = points * COINS_PER_POINT;
    if (coinCount > coins) return;

    const btn = document.getElementById('exchange-btn');
    btn.disabled = true;
    btn.textContent = '처리 중...';

    const result = await requestExchange(coinCount);
    if (result?.success) {
      // 프로모 grant (Toss 포인트 지급)
      if (window.AIT && result.promoCode) {
        try {
          await AIT.grantPromotion(result.promoCode);
          await confirmExchange(result.exchangeId);
        } catch {}
      }
      navigate('home');
      setTimeout(() => alert(`${points}포인트 교환 완료!`), 100);
    } else {
      btn.disabled = false;
      btn.textContent = '포인트로 교환하기';
      alert('교환에 실패했어요. 다시 시도해주세요.');
    }
  });
}
```

- [ ] **Step 3: 앱 진입점에 exchange 라우트 등록**

앱 진입점 파일(main.js 또는 index.js)에서:

```js
import { renderExchange } from './ui/exchange.js';
// ...기존 registerRoute 호출들 옆에 추가:
registerRoute('exchange', renderExchange);
```

- [ ] **Step 4: home.js에 교환 버튼 추가**

홈 화면 상단(collection 버튼 근처)에 교환 버튼 추가:

```js
// 기존 collection 버튼 HTML 근처에:
<button class="home-exchange-btn" id="exchange-btn">🪙 포인트 교환</button>
```

이벤트:
```js
document.getElementById('exchange-btn')?.addEventListener('click', () => navigate('exchange'));
```

- [ ] **Step 5: main.css에 교환 화면 CSS 추가**

```css
/* 교환 화면 */
.exchange-screen { display: flex; flex-direction: column; min-height: 100vh; background: var(--tds-bg); }
.exchange-header { display: flex; align-items: center; gap: 8px; padding: 16px; border-bottom: 1px solid var(--tds-line); }
.exchange-back-btn { background: none; border: none; cursor: pointer; color: var(--tds-text); padding: 0; }
.exchange-title { font-size: 18px; font-weight: 700; color: var(--tds-text); }
.exchange-body { padding: 20px 16px; display: flex; flex-direction: column; gap: 20px; }
.exchange-balance { background: var(--tds-bg-secondary); border-radius: 12px; padding: 20px; text-align: center; }
.exchange-balance__label { font-size: 13px; color: var(--tds-sub); margin-bottom: 8px; }
.exchange-balance__amount { font-size: 28px; font-weight: 800; color: var(--tds-text); }
.exchange-rate { text-align: center; font-size: 13px; color: var(--tds-sub); }
.exchange-form { display: flex; flex-direction: column; gap: 12px; }
.exchange-form__label { font-size: 14px; font-weight: 600; color: var(--tds-text); }
.exchange-form__controls { display: flex; align-items: center; gap: 8px; }
.exchange-form__input { flex: 1; padding: 10px 12px; border: 1px solid var(--tds-line); border-radius: 8px; font-size: 16px; }
.exchange-form__unit { font-size: 14px; color: var(--tds-sub); }
.exchange-form__info { font-size: 13px; color: var(--tds-sub); }
.exchange-empty { text-align: center; color: var(--tds-sub); line-height: 1.6; padding: 20px; }
.exchange-history__title { font-size: 14px; font-weight: 700; color: var(--tds-text); margin-bottom: 12px; }
.exchange-history__item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--tds-line); }
.exchange-history__status--confirmed { color: #2ecc71; }
.exchange-history__status--pending { color: var(--tds-sub); }

/* 홈 교환 버튼 */
.home-exchange-btn { background: none; border: 1px solid var(--tds-line); border-radius: 8px; padding: 6px 14px; font-size: 13px; color: var(--tds-sub); cursor: pointer; }
```

- [ ] **Step 6: 빌드 확인**

```bash
cd /Users/daniel/Documents/nyang2048 && npm run build 2>&1 | tail -5
```

Expected: 에러 없음

- [ ] **Step 7: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/exchange.js src/core/api.js src/ui/home.js src/styles/main.css
# 진입점 파일도 포함
git commit -m "feat: 포인트 교환 화면 추가 (gift-cat 패턴 이식)"
```

---

## Task 11: 출석 스트릭 — home.js 연동

**Files:**
- Modify: `src/ui/home.js`
- Modify: `src/styles/main.css`

- [ ] **Step 1: home.js에 checkAttendance, getStreak import**

```js
import { checkAttendance, getStreak } from '../core/api.js';
```

- [ ] **Step 2: renderHome() 시작 부분에 출석 체크 추가**

```js
export async function renderHome() {
  // ... 기존 코드 ...

  // 출석 체크 (비동기, UI 렌더링과 병렬 실행)
  let streakData = null;
  checkAttendance().then(data => {
    streakData = data;
    // 스트릭 카운터 업데이트
    const streakEl = document.getElementById('streak-counter');
    if (streakEl && data) {
      streakEl.textContent = data.streak > 0 ? `🔥 ${data.streak}일 연속` : '';
      streakEl.style.display = data.streak > 0 ? '' : 'none';
      if (data.bonusCoins > 0) {
        setTimeout(() => alert(`🎉 7일 연속 출석! 보너스 코인 ${data.bonusCoins}개 획득!`), 500);
      }
    }
  }).catch(() => {});
```

- [ ] **Step 3: 홈 HTML에 스트릭 카운터 추가**

홈 화면 상단 영역(collection 버튼 근처)에:

```html
<div id="streak-counter" class="home-streak" style="display:none"></div>
```

- [ ] **Step 4: main.css에 스트릭 CSS 추가**

```css
.home-streak {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  color: #FF6B35;
  padding: 4px 10px;
  background: color-mix(in srgb, #FF6B35 12%, transparent);
  border-radius: 20px;
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd /Users/daniel/Documents/nyang2048 && npm run build 2>&1 | tail -5
```

- [ ] **Step 6: 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/home.js src/styles/main.css
git commit -m "feat: 홈 화면 출석 스트릭 카운터 추가"
```

---

## Task 12: VPS 배포

- [ ] **Step 1: 서버 파일을 VPS에 업로드**

```bash
# VPS에 디렉토리 생성
ssh root@76.13.210.78 "mkdir -p /var/www/nyang2048/server/db /var/www/nyang2048/server/routes /var/www/nyang2048/server/keys"

# 서버 파일 업로드
scp -r /Users/daniel/Documents/nyang2048/server/index.js root@76.13.210.78:/var/www/nyang2048/server/
scp -r /Users/daniel/Documents/nyang2048/server/db/ root@76.13.210.78:/var/www/nyang2048/server/
scp -r /Users/daniel/Documents/nyang2048/server/routes/ root@76.13.210.78:/var/www/nyang2048/server/
scp /Users/daniel/Documents/nyang2048/server/push.js root@76.13.210.78:/var/www/nyang2048/server/
scp /Users/daniel/Documents/nyang2048/server/package.json root@76.13.210.78:/var/www/nyang2048/server/
```

- [ ] **Step 2: VPS에서 의존성 설치 및 PM2 시작**

```bash
ssh root@76.13.210.78 "cd /var/www/nyang2048/server && npm install && pm2 start index.js --name nyang2048 --interpreter node && pm2 save"
```

- [ ] **Step 3: PM2 로그 확인**

```bash
ssh root@76.13.210.78 "pm2 logs nyang2048 --lines 10 --nostream"
```

Expected: `[nyang2048] 서버 시작: http://localhost:4006` 출력

- [ ] **Step 4: Nginx 리버스 프록시 설정 확인 및 추가**

```bash
ssh root@76.13.210.78 "cat /etc/nginx/sites-enabled/toolbox | grep -A3 nyang2048"
```

없으면 추가. **중요:** `proxy_pass`에 `/api/nyang2048/`를 포함해야 함. Express가 `/api/nyang2048` prefix로 라우트를 등록하기 때문에, Nginx가 prefix를 strip하면 404가 발생한다.

```bash
ssh root@76.13.210.78 "cat >> /etc/nginx/sites-enabled/toolbox << 'EOF'

  location /api/nyang2048/ {
    proxy_pass http://localhost:4006/api/nyang2048/;
    proxy_set_header Host \$host;
  }
EOF
nginx -t && systemctl reload nginx"
```

- [ ] **Step 5: 프로덕션 서버 health 확인**

```bash
curl https://srv1412821.hstgr.cloud/api/nyang2048/health
```

Expected: `{"ok":true,"service":"nyang2048"}`

- [ ] **Step 6: 프론트엔드 프로덕션 빌드 및 배포**

```bash
cd /Users/daniel/Documents/nyang2048 && npm run build
scp -r dist/* root@76.13.210.78:/var/www/nyang2048/server/public/
```

- [ ] **Step 7: 프로모 코드 등록**

```bash
ssh root@76.13.210.78 "sqlite3 /var/www/nyang2048/server/nyang2048.db \"UPDATE settings SET value='프로모코드' WHERE key='promo_exchange';\""
```

- [ ] **Step 8: 최종 커밋**

```bash
cd /Users/daniel/Documents/nyang2048
git add .
git commit -m "feat: 1차 게임 완성도 개선 구현 완료"
```
