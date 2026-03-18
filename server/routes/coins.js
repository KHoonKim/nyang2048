import { Router } from 'express';

// 일반복권 & 고양이선물 확률 테이블 (기대값 ~6.50코인)
const NORMAL_TIERS = [
  { min: 1,  max: 4,  probability: 0.512 },   // 일반: 51.2%
  { min: 5,  max: 10, probability: 0.368 },   // 우수: 36.8%
  { min: 11, max: 25, probability: 0.105 },   // 희귀: 10.5%
  { min: 26, max: 50, probability: 0.015 },   // 대박: 1.5%
];

// 행운 복권 확률 테이블
const LUCKY_TIERS = [
  { min: 10, max: 15, probability: 0.60 },     // 우수: 60%
  { min: 16, max: 25, probability: 0.20 },     // 희귀: 20%
  { min: 26, max: 50, probability: 0.189899 }, // 대박: 18.99%
  { min: 50, max: 100, probability: 0.01 },    // 초대박: 1%
  { min: 10000, max: 10000, probability: 0.000001 }, // 잭팟: 0.0001%
];

function drawFromTiers(tiers) {
  const rand = Math.random();
  let cumulative = 0;
  for (const tier of tiers) {
    cumulative += tier.probability;
    if (rand < cumulative) {
      return Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
    }
  }
  return tiers[0].min;
}

export default function coinRoutes(db) {
  const router = Router();

  // 코인 잔액 조회
  router.get('/coins/:userHash', (req, res) => {
    const { userHash } = req.params;
    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as coins
      FROM coin_transactions WHERE user_hash = ?
    `).get(userHash);
    const pointsRow = db.prepare(`
      SELECT COALESCE(SUM(points), 0) as totalPoints
      FROM exchanges WHERE user_hash = ? AND status = 'confirmed'
    `).get(userHash);
    res.json({ coins: row?.coins || 0, totalPoints: pointsRow?.totalPoints || 0 });
  });

  // 코인 추가 (치트 방지: 최대 50코인까지만 허용)
  router.post('/coins/add', (req, res) => {
    const { userHash, amount, reason } = req.body;
    if (!userHash || !amount) return res.status(400).json({ error: 'missing_params' });
    if (amount < 0 || amount > 50) return res.status(400).json({ error: 'invalid_amount' });

    db.prepare(`
      INSERT INTO coin_transactions (user_hash, amount, reason) VALUES (?, ?, ?)
    `).run(userHash, amount, reason || 'game_reward');

    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as coins
      FROM coin_transactions WHERE user_hash = ?
    `).get(userHash);

    res.json({ success: true, coins: row.coins });
  });

  // 보상 뽑기 (서버에서 확률 계산)
  // type: 'gift' (고양이선물), 'lottery' (일반복권), 'lucky' (행운복권)
  router.post('/reward', (req, res) => {
    const { userHash, type } = req.body;
    if (!userHash || !type) return res.status(400).json({ error: 'missing_params' });
    if (!['gift', 'lottery', 'lucky'].includes(type)) return res.status(400).json({ error: 'invalid_type' });

    const tiers = type === 'lucky' ? LUCKY_TIERS : NORMAL_TIERS;
    const earned = drawFromTiers(tiers);
    const maxAllowed = type === 'lucky' ? 10000 : 50;
    if (earned < 1 || earned > maxAllowed) return res.status(500).json({ error: 'draw_error' });
    const reason = type === 'gift' ? 'gift_reward' : type === 'lucky' ? 'lucky_lottery' : 'normal_lottery';

    db.prepare(`
      INSERT INTO coin_transactions (user_hash, amount, reason) VALUES (?, ?, ?)
    `).run(userHash, earned, reason);

    const row = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as coins
      FROM coin_transactions WHERE user_hash = ?
    `).get(userHash);

    res.json({ coins: earned, totalCoins: row.coins });
  });

  return router;
}
