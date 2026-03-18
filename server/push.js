// 집중냥 — 토스 푸시 알림 발송
// 템플릿 ID만 교체하면 바로 발송 가능

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOSS_API = 'https://apps-in-toss-api.toss.im';

// DB settings 테이블에서 템플릿 ID 조회 (재시작 없이 변경 가능)
function getTemplateId(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'push_template_id'").get();
  return row?.value || null;
}

function loadCerts() {
  const certPath = fs.existsSync('/root/nyang2048_public.crt')
    ? '/root/nyang2048_public.crt'
    : path.join(__dirname, '..', 'nyang2048_public.crt');
  const keyPath = fs.existsSync('/root/nyang2048_private.key')
    ? '/root/nyang2048_private.key'
    : path.join(__dirname, '..', 'nyang2048_private.key');

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    return null;
  }

  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
}

function tossFetch(url, options = {}, certs) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = options.body || null;
    const agent = new https.Agent({ cert: certs.cert, key: certs.key });
    const reqOpts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: { ...(options.headers || {}) },
      agent,
    };
    if (body) reqOpts.headers['Content-Length'] = Buffer.byteLength(body);
    const r = https.request(reqOpts, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => resolve({
        status: resp.statusCode,
        json: () => JSON.parse(data),
        text: () => data,
      }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

/**
 * 집중 완료 푸시 발송
 * @param {object} db - better-sqlite3 DB 인스턴스
 * @param {string} userKey - 토스 userKey (= userHash)
 */
export async function sendFocusCompletePush(db, userKey) {
  const templateId = getTemplateId(db);
  if (!templateId) {
    console.log(`[push] 템플릿 ID 미설정 — 푸시 발송 스킵 (user: ${userKey.slice(0, 8)}...)`);
    return { skipped: true, reason: 'template_not_set' };
  }

  const certs = loadCerts();
  if (!certs) {
    console.warn('[push] mTLS 인증서 없음 — 푸시 발송 스킵');
    return { skipped: true, reason: 'no_certs' };
  }

  try {
    const resp = await tossFetch(
      `${TOSS_API}/api-partner/v1/apps-in-toss/notification/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          userKeys: [userKey],
        }),
      },
      certs
    );

    const result = resp.json();
    if (resp.status >= 400 || result.resultType !== 'SUCCESS') {
      console.error(`[push] 발송 실패:`, JSON.stringify(result));
      return { success: false, error: result };
    }

    console.log(`[push] 발송 성공 (user: ${userKey.slice(0, 8)}...)`);
    return { success: true, result };
  } catch (err) {
    console.error('[push] 발송 에러:', err.message);
    return { success: false, error: err.message };
  }
}
