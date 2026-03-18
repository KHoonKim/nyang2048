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

    // 7일 연속 달성 시 LUCKY_TIERS 코인 지급 (잭팟 최대 100코인으로 제한 — 서버 비용 보호)
    let bonusCoins = 0;
    if (streak % 7 === 0 && !existing) {
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
      bonusCoins = Math.min(bonusCoins, 100);
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
