import { navigate } from '../core/router.js';
import { getCoins, requestExchange, confirmExchange, spendCoins } from '../core/api.js';
import { ICON } from '../core/icons.js';

const ITEM_COST = 3;
const ITEMS = [
  { id: 'undo',    label: '되돌리기', key: 'nyang-undo-charges' },
  { id: 'hammer',  label: '망치',     key: 'nyang-hammer-charges' },
  { id: 'cleaner', label: '클리너',   key: 'nyang-cleaner-charges' },
  { id: 'upgrade', label: '업그레이드', key: 'nyang-upgrade-charges' },
];

function getItemCount(key) {
  return parseInt(localStorage.getItem(key) || '0', 10);
}

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
        <div class="exchange-balance-loading">${SPINNER_SVG}</div>
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

      <div style="padding:0 16px;margin-top:24px">
        <div style="font-size:14px;font-weight:700;color:var(--tds-sub);margin-bottom:8px">아이템 구매</div>
        ${ITEMS.map(item => `
          <div style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--tds-grey-100,#f2f4f6)">
            <div style="width:40px;height:40px;border-radius:12px;background:var(--tds-grey-100,#f2f4f6);display:flex;align-items:center;justify-content:center;color:var(--tds-text);flex-shrink:0">${ICON[item.id]}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:15px;font-weight:600;color:var(--tds-text)">${item.label}</div>
              <div style="font-size:13px;color:var(--tds-sub);margin-top:2px">1개 · <span id="item-count-${item.id}">${getItemCount(item.key)}</span>개 보유</div>
            </div>
            <button class="exchange-item-buy-btn" id="buy-btn-${item.id}" data-id="${item.id}" data-key="${item.key}"
              style="padding:8px 14px;border-radius:10px;border:none;background:var(--tds-blue,#3182F6);color:#fff;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap">
              3코인
            </button>
          </div>
        `).join('')}
      </div>

      <div style="flex:1"></div>
      <div class="ad-banner-container ad-banner-container--bottom" id="exchange-bottom-ad"></div>
    </div>
  `;

  document.getElementById('exchange-back').addEventListener('click', () => {
    navigate('home');
  });

  if (window.AIT) AIT.loadBannerAd('exchange-bottom-ad', { image: true });

  let coinsData = null;
  try { coinsData = await getCoins(); } catch {}
  let coins = coinsData?.coins ?? 0;
  const canExchange = coins >= 10;

  // Update balance card
  const balanceCard = document.getElementById('exchange-balance-card');
  const points = Math.floor(coins / 10);
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
        <div class="exchange-balance-label">교환 포인트</div>
        <div class="exchange-balance-value exchange-balance-rate">
          ${P_ICON_SVG}
          <span>${points}포인트</span>
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

  // Set initial disabled state for buy buttons
  if (coins < ITEM_COST) {
    document.querySelectorAll('.exchange-item-buy-btn').forEach(b => { b.disabled = true; });
  }

  // Item buy button handlers
  document.querySelectorAll('.exchange-item-buy-btn').forEach(buyBtn => {
    buyBtn.addEventListener('click', async () => {
      const itemId = buyBtn.dataset.id;
      const itemKey = buyBtn.dataset.key;
      if (coins < ITEM_COST) { toast('코인이 부족해요 (3코인 필요)'); return; }

      buyBtn.disabled = true;
      buyBtn.textContent = '...';

      const res = await spendCoins(ITEM_COST, `item_${itemId}`);
      if (!res || res.error) {
        toast(res?.error === 'insufficient_coins' ? '코인이 부족해요' : '구매에 실패했어요');
        buyBtn.disabled = false;
        buyBtn.textContent = '3코인';
        return;
      }

      // Update local item charge
      const newCount = getItemCount(itemKey) + 1;
      localStorage.setItem(itemKey, String(newCount));
      document.getElementById(`item-count-${itemId}`).textContent = `${newCount}`;

      // Update coin display
      coins = res.coins;
      document.getElementById('ex-coin-count').textContent = `${coins}개`;

      buyBtn.disabled = false;
      buyBtn.textContent = '3코인';

      // Disable buy buttons if coins < ITEM_COST
      document.querySelectorAll('.exchange-item-buy-btn').forEach(b => {
        b.disabled = coins < ITEM_COST;
      });

      toast(`${ITEMS.find(i => i.id === itemId).label} 1개 구매했어요!`);
    });
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
