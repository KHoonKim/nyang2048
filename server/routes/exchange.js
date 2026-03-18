import { Router } from 'express';

export default function exchangeRoutes(db) {
  const router = Router();

  const EXCHANGE_RATE = 10; // 10 coins = 1 point

  // 교환 생성 (코인 차감)
  router.post('/exchange', (req, res) => {
    const { userHash } = req.body;
    if (!userHash) return res.status(400).json({ error: 'missing_user' });

    const coinRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as coins FROM coin_transactions WHERE user_hash = ?
    `).get(userHash);
    const coins = coinRow?.coins || 0;

    if (coins < EXCHANGE_RATE) return res.json({ error: 'insufficient_coins' });

    const exchangeCoins = Math.floor(coins / EXCHANGE_RATE) * EXCHANGE_RATE;
    const points = exchangeCoins / EXCHANGE_RATE;

    // 코인 차감
    db.prepare(`INSERT INTO coin_transactions (user_hash, amount, reason) VALUES (?, ?, 'exchange')`).run(userHash, -exchangeCoins);

    // 교환 레코드 생성
    const result = db.prepare(`
      INSERT INTO exchanges (user_hash, coin_count, points, status) VALUES (?, ?, ?, 'pending')
    `).run(userHash, exchangeCoins, points);

    // 프로모 설정에서 교환 프로모 ID 조회
    const promoSetting = db.prepare(`SELECT value FROM settings WHERE key = 'promo_exchange'`).get();
    const promoId = promoSetting?.value || null;

    res.json({
      exchangeId: result.lastInsertRowid,
      promoId,
      coinCount: exchangeCoins,
      points,
    });
  });

  // 교환 확정
  router.post('/exchange/:id/confirm', (req, res) => {
    const { id } = req.params;
    db.prepare(`UPDATE exchanges SET status = 'confirmed' WHERE id = ?`).run(id);
    res.json({ success: true });
  });

  // 교환 실패 → 코인 복구
  router.post('/exchange/:id/restore', (req, res) => {
    const { id } = req.params;
    const ex = db.prepare(`SELECT * FROM exchanges WHERE id = ? AND status = 'pending'`).get(id);
    if (!ex) return res.status(404).json({ error: 'not_found' });

    db.prepare(`INSERT INTO coin_transactions (user_hash, amount, reason) VALUES (?, ?, 'exchange_restore')`).run(ex.user_hash, ex.coin_count);
    db.prepare(`UPDATE exchanges SET status = 'restored' WHERE id = ?`).run(id);
    res.json({ success: true, restoredCoins: ex.coin_count });
  });

  // 교환 내역 조회
  router.get('/exchanges/:userHash', (req, res) => {
    const rows = db.prepare(`
      SELECT * FROM exchanges WHERE user_hash = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.params.userHash);
    res.json({ exchanges: rows });
  });

  return router;
}
