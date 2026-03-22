// 서버 API 클라이언트
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:4006/api/nyang2048';

async function getUserHash() {
  if (window.AIT) return AIT.getUserKeyForGame();
  let uid = localStorage.getItem('nyang-uid');
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem('nyang-uid', uid);
  }
  return uid;
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

// 출석 현황 조회 (체크 없이)
export async function getAttendanceStatus() {
  const userHash = await getUserHash();
  return apiGet(`/attendance/${userHash}`);
}

// 코인 잔액 조회
export async function getCoins() {
  const userHash = await getUserHash();
  return apiGet(`/coins/${userHash}`);
}

// 교환 신청
export async function requestExchange(coinCount) {
  const userHash = await getUserHash();
  return apiPost('/exchange', { userHash, coinCount });
}

// 교환 확정 (프로모 grant 후)
export async function confirmExchange(exchangeId) {
  const userHash = await getUserHash();
  return apiPost(`/exchange/${exchangeId}/confirm`, { userHash });
}

// 코인 소모 (아이템 구매)
export async function spendCoins(amount, reason) {
  const userHash = await getUserHash();
  return apiPost('/spend', { userHash, amount, reason });
}

// 교환 내역 조회
export async function getExchangeHistory() {
  const userHash = await getUserHash();
  return apiGet(`/exchanges/${userHash}`);
}
