import { navigate } from '../core/router.js';
import { getCoins, requestExchange, confirmExchange } from '../core/api.js';

const COIN_SVG = `<svg width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="var(--app-brand, #FF6B35)"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
  <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" font-family="inherit">C</text>
</svg>`;

const P_ICON_SVG = `<svg width="26" height="26" viewBox="0 0 26 26">
  <circle cx="13" cy="13" r="13" fill="var(--tds-blue, #3182F6)"/>
  <text x="13" y="18" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" font-family="inherit">P</text>
</svg>`;

const SPINNER_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="9" stroke="var(--tds-blue, #3182F6)" stroke-width="2.5"
    stroke-dasharray="40 20" stroke-linecap="round">
    <animateTransform attributeName="transform" type="rotate"
      from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
  </circle>
</svg>`;

function toast(msg) {
  let el = document.getElementById('exchange-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'exchange-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2500);
}

export async function renderExchange() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="exchange-screen">
      <div class="exchange-header">
        <button class="exchange-back-btn" id="exchange-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="var(--tds-text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="exchange-header__title">포인트 교환</span>
      </div>

      <div class="exchange-balance-card" id="exchange-balance-card">
        <div class="exchange-balance-loading">불러오는 중...</div>
      </div>

      <div style="padding:0 16px;margin-top:16px">
        <button id="exchange-do-btn" class="exchange-btn" disabled>
          <div class="exchange-btn__icon" id="exchange-btn-icon">${P_ICON_SVG}</div>
          <div class="exchange-btn__text">
            <div class="exchange-btn__title">토스포인트로 교환하기</div>
            <div class="exchange-btn__desc" id="exchange-btn-desc">코인 잔액 조회 중...</div>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M1 1l6 6-6 6" stroke="var(--tds-grey-300, #ccc)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div style="flex:1"></div>
    </div>
  `;

  document.getElementById('exchange-back').addEventListener('click', () => {
    navigate('home');
  });

  const coinsData = await getCoins();
  const coins = coinsData?.coins ?? 0;
  const canExchange = coins >= 10;

  // Update balance card
  const balanceCard = document.getElementById('exchange-balance-card');
  balanceCard.innerHTML = `
    <div class="exchange-balance-row">
      <div class="exchange-balance-item">
        <div class="exchange-balance-label">보유 코인</div>
        <div class="exchange-balance-value">
          ${COIN_SVG}
          <span id="ex-coin-count">${coins}개</span>
        </div>
      </div>
      <div class="exchange-balance-divider"></div>
      <div class="exchange-balance-item">
        <div class="exchange-balance-label">교환 비율</div>
        <div class="exchange-balance-value exchange-balance-rate">
          <span>10코인 = 1포인트</span>
        </div>
      </div>
    </div>
  `;

  // Update exchange button
  const btn = document.getElementById('exchange-do-btn');
  const descEl = document.getElementById('exchange-btn-desc');
  if (canExchange) {
    btn.disabled = false;
    btn.classList.add('exchange-btn--active');
    descEl.textContent = `코인 ${Math.floor(coins / 10) * 10}개 → ${Math.floor(coins / 10)}포인트`;
  } else {
    btn.disabled = true;
    descEl.textContent = `코인 10개 필요 (${10 - coins}개 더 모으면 가능해요)`;
  }

  // Exchange button click
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    doExchange(coins);
  });
}

async function doExchange(coins) {
  const btn = document.getElementById('exchange-do-btn');
  const iconEl = document.getElementById('exchange-btn-icon');
  btn.disabled = true;
  btn.style.pointerEvents = 'none';
  if (iconEl) iconEl.innerHTML = SPINNER_SVG;

  try {
    const res = await requestExchange(Math.floor(coins / 10) * 10);

    if (!res || res.error) {
      const errMsg = res?.error === 'insufficient_coins'
        ? '코인이 부족해요'
        : '교환 신청에 실패했어요. 다시 시도해주세요.';
      toast(errMsg);
      btn.disabled = false;
      btn.style.pointerEvents = '';
      if (iconEl) iconEl.innerHTML = P_ICON_SVG;
      return;
    }

    const { exchangeId, promoId, coinCount, points } = res;
    const totalPoints = points || 1;

    let promoResult = false;
    if (window.AIT && AIT.checkPromoExchange) {
      promoResult = await AIT.checkPromoExchange(promoId, totalPoints);
    } else {
      // No AIT promo flow — confirm directly
      promoResult = true;
    }

    if (promoResult) {
      await confirmExchange(exchangeId);
      if (window.AIT && AIT.log) AIT.log('app_exchange_success', { exchangeId, coins: coinCount || 10, points: totalPoints });
      if (window.AIT && AIT.haptic) AIT.haptic('success');

      showExchangeSuccessModal(coinCount || 10, totalPoints, () => {
        navigate('home');
      });
    } else {
      toast('교환에 실패했어요. 코인이 복원됐어요.');
      btn.disabled = false;
      btn.style.pointerEvents = '';
      if (iconEl) iconEl.innerHTML = P_ICON_SVG;
    }
  } catch {
    toast('오류가 발생했어요. 다시 시도해주세요.');
    btn.disabled = false;
    btn.style.pointerEvents = '';
    if (iconEl) iconEl.innerHTML = P_ICON_SVG;
  }
}

function showExchangeSuccessModal(coinCount, points, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'gacha-modal';
  overlay.innerHTML = `
    <div class="gacha-card">
      <div style="margin-bottom:16px">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="24" fill="var(--tds-blue, #3182F6)"/>
          <text x="24" y="32" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" font-family="inherit">P</text>
        </svg>
      </div>
      <div class="gacha-coins tds-st2 tds-fw-extrabold" style="color:var(--tds-text)">${points}포인트 획득!</div>
      <div class="tds-t6 tds-fw-bold" style="color:var(--tds-sub);margin-top:8px">코인 ${coinCount}개를 교환했어요</div>
      <button class="tds-btn tds-btn-primary tds-btn-md tds-btn-block" style="margin-top:24px" id="ex-success-close">확인</button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));

  document.getElementById('ex-success-close').addEventListener('click', () => {
    overlay.classList.remove('visible');
    setTimeout(() => { overlay.remove(); onClose && onClose(); }, 300);
  });
}
