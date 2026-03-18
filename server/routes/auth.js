import { Router } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 토스 복호화 키 로드
const tossKeysPath = path.join(__dirname, '..', 'keys', 'toss-login.json');
const tossKeys = fs.existsSync(tossKeysPath)
  ? JSON.parse(fs.readFileSync(tossKeysPath, 'utf8'))
  : null;

function decryptToss(encryptedText) {
  if (!tossKeys) return encryptedText;
  try {
    const decoded = Buffer.from(encryptedText, 'base64');
    const IV_LENGTH = 12;
    const iv = decoded.subarray(0, IV_LENGTH);
    const authTagLength = 16;
    const ciphertext = decoded.subarray(IV_LENGTH, decoded.length - authTagLength);
    const authTag = decoded.subarray(decoded.length - authTagLength);
    const key = Buffer.from(tossKeys.key, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(tossKeys.aad));
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch (e) {
    console.warn('[auth] decrypt failed:', e.message);
    return encryptedText;
  }
}

export default function authRoutes(db) {
  const router = Router();

  router.post('/toss/login', async (req, res) => {
    try {
      const { authorizationCode, referrer } = req.body;
      if (!authorizationCode) return res.status(400).json({ error: 'missing_auth_code' });

      // mTLS 인증서 확인 (프로덕션: /root/, 로컬: 프로젝트 루트)
      const projectRoot = path.join(__dirname, '..', '..');
      const certPath = fs.existsSync('/root/nyang2048_public.crt')
        ? '/root/nyang2048_public.crt'
        : path.join(projectRoot, 'nyang2048_public.crt');
      const keyPath = fs.existsSync('/root/nyang2048_private.key')
        ? '/root/nyang2048_private.key'
        : path.join(projectRoot, 'nyang2048_private.key');
      const hasCerts = fs.existsSync(certPath);

      let userKey, userHash, userName, userGender, userBirthday, userEmail;

      if (hasCerts) {
        // 실제 토스 API 호출 (mTLS) — generate-token → login-me 2단계
        const cert = fs.readFileSync(certPath);
        const tossKey = fs.readFileSync(keyPath);
        const TOSS_API = 'https://apps-in-toss-api.toss.im';

        function tossFetch(url, options = {}) {
          return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const body = options.body || null;
            const agent = new https.Agent({ cert, key: tossKey });
            const reqOpts = {
              hostname: parsed.hostname, path: parsed.pathname + parsed.search,
              method: options.method || 'GET',
              headers: { ...(options.headers || {}) },
              agent,
            };
            if (body) reqOpts.headers['Content-Length'] = Buffer.byteLength(body);
            const r = https.request(reqOpts, (resp) => {
              let data = '';
              resp.on('data', chunk => data += chunk);
              resp.on('end', () => resolve({ status: resp.statusCode, json: () => JSON.parse(data), text: () => data }));
            });
            r.on('error', reject);
            if (body) r.write(body);
            r.end();
          });
        }

        // Step 1: generate-token
        const tokenResp = await tossFetch(`${TOSS_API}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorizationCode, referrer })
        });
        const tokenData = tokenResp.json();
        console.log('[auth] generate-token response:', JSON.stringify(tokenData));

        if (tokenData.resultType !== 'SUCCESS') {
          console.error('[auth] token failed:', JSON.stringify(tokenData));
          return res.status(401).json({ error: 'token_failed', detail: tokenData });
        }
        const { accessToken } = tokenData.success;

        // Step 2: login-me (유저 정보 조회)
        const meResp = await tossFetch(`${TOSS_API}/api-partner/v1/apps-in-toss/user/oauth2/login-me`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const meData = meResp.json();
        console.log('[auth] login-me response:', JSON.stringify(meData));

        if (meData.resultType !== 'SUCCESS') {
          console.error('[auth] login-me failed:', JSON.stringify(meData));
          return res.status(401).json({ error: 'user_info_failed', detail: meData });
        }
        const user = meData.success;

        userKey = String(user.userKey);
        userHash = userKey;
        userName = user.name ? decryptToss(user.name) : '사용자';
        userGender = user.gender ? decryptToss(user.gender) : '';
        userBirthday = user.birthday ? decryptToss(user.birthday) : '';
        userEmail = user.email ? decryptToss(user.email) : '';
      } else {
        // 인증서 없음 → 개발 모드 (mock)
        userKey = crypto.createHash('sha256').update(authorizationCode).digest('hex').slice(0, 16);
        userHash = userKey;
        userName = '개발자';
        userGender = '';
        userBirthday = '';
        userEmail = '';
      }

      // DB에 사용자 저장/업데이트
      const stmt = db.prepare(`
        INSERT INTO users (user_hash, user_name, user_gender, user_birthday, user_email, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_hash) DO UPDATE SET
          user_name = excluded.user_name,
          user_email = excluded.user_email,
          updated_at = datetime('now')
      `);
      stmt.run(userHash, userName, userGender, userBirthday, userEmail);

      res.json({
        status: 'ok',
        userHash,
        userKey,
        name: userName,
        referrer: referrer || null,
      });
    } catch (err) {
      console.error('[auth] login error:', err);
      res.status(500).json({ error: 'login_failed' });
    }
  });

  return router;
}
