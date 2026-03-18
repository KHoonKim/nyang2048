import { Router } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// mTLS 인증서 로드 (프로덕션: /root/, 로컬: 프로젝트 루트)
const projectRoot = path.join(__dirname, '..', '..');
const certPath = fs.existsSync('/root/nyang2048_public.crt')
  ? '/root/nyang2048_public.crt'
  : path.join(projectRoot, 'nyang2048_public.crt');
const keyPath = fs.existsSync('/root/nyang2048_private.key')
  ? '/root/nyang2048_private.key'
  : path.join(projectRoot, 'nyang2048_private.key');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

let tossAgent = null;
if (hasCerts) {
  tossAgent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  });
  console.log('[promo] mTLS 인증서 로드 완료');
} else {
  console.warn('[promo] mTLS 인증서 없음 — mock 모드');
}

// mTLS fetch helper
function tossFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = options.body || null;
    const reqOpts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: { ...(options.headers || {}) },
      agent: tossAgent,
    };
    if (body) reqOpts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        json: () => JSON.parse(data),
        text: () => data,
      }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const TOSS_PROMO_BASE = 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/promotion';

export default function promoRoutes(db) {
  const router = Router();

  // 프로모 사용 여부 확인
  router.get('/promo/check/:userHash/:type', (req, res) => {
    const { userHash, type } = req.params;
    const row = db.prepare(`SELECT * FROM promo_records WHERE user_hash = ? AND promo_type = ?`).get(userHash, type);
    res.json({ granted: !!row, used: !!row, record: row || null });
  });

  // 프로모 기록
  router.post('/promo/record', (req, res) => {
    const { userHash, promoType, promoCode, amount } = req.body;
    if (!userHash || !promoType) return res.status(400).json({ error: 'missing_params' });

    try {
      db.prepare(`
        INSERT INTO promo_records (user_hash, promo_type, promo_code, amount) VALUES (?, ?, ?, ?)
      `).run(userHash, promoType, promoCode || '', amount || 0);
      res.json({ success: true });
    } catch (err) {
      // UNIQUE constraint = already used
      if (err.message?.includes('UNIQUE')) return res.json({ success: false, error: 'already_used' });
      throw err;
    }
  });

  // 프로모 포인트 지급 (토스 Promotion REST API, mTLS)
  router.post('/promo/grant', async (req, res) => {
    const { promotionCode, promoCode, amount, userKey, userHash } = req.body;
    const code = promotionCode || promoCode;
    const user = userKey || userHash;
    if (!user || !code || amount == null) {
      return res.status(400).json({ error: 'missing params' });
    }

    // mTLS 인증서 없으면 mock
    if (!tossAgent) {
      console.log(`[promo] mock grant: code=${code}, amount=${amount}, user=${user}`);
      return res.json({ success: true, key: `mock_${Date.now()}`, granted: amount });
    }

    const headers = { 'Content-Type': 'application/json', 'x-toss-user-key': user };
    try {
      // Step 1: get-key
      const keyRes = await (await tossFetch(`${TOSS_PROMO_BASE}/execute-promotion/get-key`, {
        method: 'POST', headers
      })).json();
      console.log('[promo] get-key response:', JSON.stringify(keyRes));
      if (keyRes.resultType !== 'SUCCESS') {
        return res.json({ error: keyRes });
      }
      const key = keyRes.success.key;

      // Step 2: execute-promotion
      const execRes = await (await tossFetch(`${TOSS_PROMO_BASE}/execute-promotion`, {
        method: 'POST', headers,
        body: JSON.stringify({ promotionCode: code, key, amount })
      })).json();
      console.log('[promo] execute response:', JSON.stringify(execRes));
      if (execRes.resultType !== 'SUCCESS') {
        return res.json({ error: execRes });
      }

      res.json({ key: execRes.success.key });
    } catch (e) {
      console.error('[promo] grant error:', e);
      res.status(500).json({ error: 'promo_grant_failed', detail: String(e) });
    }
  });

  return router;
}
