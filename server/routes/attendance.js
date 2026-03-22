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
  const rows = db.prepare(`
    SELECT date FROM attendance
    WHERE user_hash = ?
    ORDER BY date DESC
  `).all(userHash);

  if (rows.length === 0) return 0;

  const today = getKSTDate();
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

// 현재 7일 주기에서 체크된 날들 반환 (1~7일차)
function getWeekDays(db, userHash, streak) {
  if (streak === 0) return [];
  const cycleDay = ((streak - 1) % 7) + 1;
  const checked = [];
  for (let i = 0; i < cycleDay; i++) {
    checked.push(i + 1);
  }
  return checked;
}

// 사이클 시작일 계산 (YYYY-MM-DD)
function getCycleStartDate(todayKST, cycleDay, checkedToday) {
  const offset = checkedToday ? cycleDay - 1 : cycleDay;
  const d = new Date(todayKST + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

export default function attendanceRoutes(db) {
  const router = Router();

  // 출석 체크 (하루 1회, 중복 무시)
  router.post('/attendance', (req, res) => {
    const { userHash } = req.body;
    if (!userHash) return res.status(400).json({ error: 'missing_params' });

    const today = getKSTDate();

    const existing = db.prepare(
      'SELECT date FROM attendance WHERE user_hash = ? AND date = ?'
    ).get(userHash, today);

    if (!existing) {
      db.prepare(
        'INSERT OR IGNORE INTO attendance (user_hash, date) VALUES (?, ?)'
      ).run(userHash, today);
    }

    const streak = calcStreak(db, userHash);
    const cycleDay = ((streak - 1) % 7) + 1; // 1~7

    // 코인 지급: 1~6일차 1코인, 7일차부터 3코인
    let dailyCoins = 0;
    let bonusCoins = 0;
    if (!existing) {
      dailyCoins = streak >= 7 ? 3 : 1;
      db.prepare(
        'INSERT INTO coin_transactions (user_hash, amount, reason) VALUES (?, ?, ?)'
      ).run(userHash, dailyCoins, streak >= 7 ? 'attendance_streak7' : 'attendance_daily');
      if (streak === 7) bonusCoins = 3; // 최초 7일 달성 표시용
    }

    const coinsRow = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as coins FROM coin_transactions WHERE user_hash = ?'
    ).get(userHash);

    const weekDays = getWeekDays(db, userHash, streak);
    const cycleStartDate = getCycleStartDate(today, cycleDay, true);

    res.json({
      success: true,
      streak,
      cycleDay,
      weekDays,
      cycleStartDate,
      alreadyChecked: !!existing,
      bonusCoins,
      dailyCoins,
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
    const cycleDay = streak > 0 ? ((streak - 1) % 7) + 1 : 0;
    const weekDays = getWeekDays(db, userHash, streak);
    const cycleStartDate = streak > 0 ? getCycleStartDate(today, cycleDay, checkedToday) : today;
    res.json({ streak, checkedToday, cycleDay, weekDays, cycleStartDate });
  });

  return router;
}
