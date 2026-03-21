import { navigate } from '../core/router.js';
import { getUnlockedStage, isInfiniteUnlocked, getBestScore, getBestTime, getCollectionCount, getCollection, COLLECTION_MAX, DEBUG_MODE, enableDebugMode } from '../game/score.js';
import { STAGES, getCatImage, getCatForValue, CAT_NAMES, getStageCatLineup, ALL_CATS_ORDERED, getSubStageConfig, parseStageId, formatStageId } from '../game/stages.js';
import { ICON } from '../core/icons.js';
import { showCatDetail } from './collection.js';
import { checkAttendance } from '../core/api.js';

export function renderHome() {
  const app = document.getElementById('app');
  const unlockedRaw = getUnlockedStage(); // e.g. "3-2"
  const { stageNum: unlockedStageNum, subNum: unlockedSubNum } = parseStageId(unlockedRaw);
  const infiniteUnlocked = isInfiniteUnlocked();
  const totalCats = ALL_CATS_ORDERED.length;
  const collectionCount = getCollectionCount(totalCats);
  const collectionPct = Math.round(collectionCount / totalCats * 100);

  // ── S-curve map: 36 rows, one node each at varying x ──
  // sweepSize=4: stages 1-4 sweep right→left, 5-8 left→right, repeat
  function getNodeX(n) {
    const sweepSize = 4;
    const sweepIdx = Math.floor((n - 1) / sweepSize);
    const t = ((n - 1) % sweepSize) / (sweepSize - 1);
    return sweepIdx % 2 === 0 ? 0.82 - 0.64 * t : 0.18 + 0.64 * t;
  }

  function renderSlot(n, xPct) {
    if (n < 1 || n > 36) return '';

    const locked = n > unlockedStageNum;
    const isCurrent = n === unlockedStageNum;
    const isCleared = n < unlockedStageNum;
    const catId = STAGES[n] ? Object.values(STAGES[n].cats)[0] : null;

    // Sub-stage progress dots
    function subDots() {
      if (locked) return '';
      const completedSubs = isCleared ? 3 : unlockedSubNum - 1;
      const dots = [1, 2, 3].map(i =>
        `<span class="smap-subdot${i <= completedSubs ? ' smap-subdot--done' : ''}"></span>`
      ).join('');
      return `<div class="smap-subdots">${dots}</div>`;
    }

    const silhouette = catId ? `<img class="smap-node__silhouette" src="${getCatImage(catId)}" alt="">` : '';
    const catUrl = catId ? getCatImage(catId) : '';

    let nodeHtml;
    if (locked) {
      nodeHtml = `<div class="smap-node smap-node--locked">
        ${silhouette}
        <span class="smap-node__lock">${ICON.lock}</span>
      </div>`;
    } else if (isCurrent) {
      nodeHtml = `<button class="smap-node smap-node--current" id="smap-current" data-stage="${n}">
        ${catId ? `<div class="smap-node__glow-wrap"><div class="smap-node__orange-silhouette" style="-webkit-mask-image:url(${catUrl});mask-image:url(${catUrl})"></div></div>` : ''}
        <span class="smap-node__play">▶</span>
      </button>`;
    } else {
      nodeHtml = `<button class="smap-node smap-node--cleared" data-stage="${n}">
        <img class="smap-node__cat" src="${getCatImage(catId)}" alt="">
      </button>`;
    }

    const stage = STAGES[n];
    const catCount = stage ? Math.log2(stage.goal) : 0;
    const boardLabel = stage ? stage.boardLabel : '';

    return `<div class="smap-slot" style="left:${xPct}%">
      <div class="smap-node-wrap">
        ${nodeHtml}
        <span class="smap-node__badge${isCurrent ? ' smap-node__badge--current' : ''}">${n}</span>
      </div>
      ${subDots()}
      <div class="smap-node__meta">
        <span class="smap-node__meta-cats">🐾 ${catCount}</span>
        <span class="smap-node__meta-board">${boardLabel}</span>
      </div>
    </div>`;
  }

  const mapParts = [];
  for (let n = 36; n >= 1; n--) {
    const xPct = (getNodeX(n) * 100).toFixed(1);
    mapParts.push(`<div class="smap-row">${renderSlot(n, xPct)}</div>`);
  }


  const infiniteRow = infiniteUnlocked ? `
    <button class="stage-card stage-card--infinite" id="infinite-card">
      <div class="stage-card__top">
        <div class="stage-card__badge stage-card__badge--inf">∞</div>
        <div class="stage-card__title-group">
          <div class="stage-card__board" style="color:#fff">무한모드</div>
          <div class="stage-card__inf-sub">목표 없이 최고점수 도전</div>
        </div>
        <div class="stage-card__right" style="color:rgba(255,255,255,0.5);font-size:13px;font-weight:600;">보드 선택 →</div>
      </div>
    </button>
  ` : '';

  app.innerHTML = `
    <div class="home-screen">
      <div class="home-header">
        <img src="2048.png" class="home-logo" alt="냥2048">
        <div id="streak-counter" class="streak-counter" style="display:none;"></div>
      </div>
      <div class="home-nav">
        <button class="home-nav-btn home-nav-btn--exchange" id="exchange-btn">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" fill="var(--tds-blue, #3182F6)"/>
            <text x="10" y="10" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="900" fill="#fff" font-family="inherit">P</text>
          </svg>
          <span>포인트 교환</span>
        </button>
        <button class="home-nav-btn home-nav-btn--collection" id="collection-btn">
          <img src="paw.png" class="home-nav-paw" alt="paw">
          <span>고양이 도감</span>
          <span class="home-nav-pct">${collectionPct}%</span>
        </button>
      </div>
      ${infiniteRow ? `<div class="smap-infinite-outer">${infiniteRow}</div>` : ''}
      <div class="stage-map-wrap">
        <div class="stage-map">
          ${mapParts.join('')}
        </div>
      </div>
    </div>
    <div class="ad-banner-container ad-banner-container--home" id="home-banner-ad"></div>
  `;

  if (window.AIT) AIT.loadBannerAd('home-banner-ad');

  // Scroll current stage to bottom of visible area
  requestAnimationFrame(() => {
    const wrap = document.querySelector('.stage-map-wrap');
    const node = document.getElementById('smap-current');
    if (wrap && node) {
      const wrapRect = wrap.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      wrap.scrollTop += nodeRect.bottom - wrapRect.bottom + 110;
    }
  });


  // Attendance streak
  (async () => {
    try {
      const result = await checkAttendance();
      if (!result) return;
      const { streak, bonusCoins } = result;
      const counter = document.getElementById('streak-counter');
      if (counter) {
        counter.textContent = `🔥 ${streak || 1}일 연속 출석!`;
        counter.style.display = 'inline-flex';
      }
      if (bonusCoins && bonusCoins > 0) {
        const toast = document.createElement('div');
        toast.className = 'streak-toast';
        toast.textContent = `7일 연속 출석 보너스! 코인 +${bonusCoins}`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      }
    } catch { }
  })();

  // Hidden debug: tap logo 10 times
  const logo = app.querySelector('.home-logo');
  if (logo) {
    let tapCount = 0, tapTimer = null;
    logo.addEventListener('click', () => {
      tapCount++;
      if (tapCount === 1) tapTimer = setTimeout(() => { tapCount = 0; }, 5000);
      if (tapCount >= 10) {
        clearTimeout(tapTimer); tapCount = 0;
        enableDebugMode(); renderHome();
      }
    });
  }

  // Stage clicks (current + cleared) → show detail popup
  app.querySelectorAll('.smap-node--current[data-stage], .smap-node--cleared[data-stage]').forEach(btn => {
    btn.addEventListener('click', () => showStageDetail(parseInt(btn.dataset.stage)));
  });

  // Infinite card
  const infCard = document.getElementById('infinite-card');
  if (infCard) infCard.addEventListener('click', () => showInfiniteSizeSelector());

  document.getElementById('exchange-btn').addEventListener('click', () => navigate('exchange'));
  document.getElementById('collection-btn').addEventListener('click', () => navigate('collection'));
}

function showStageDetail(n) {
  const stage = STAGES[n];
  if (!stage) return;

  const { stageNum: unlockedStageNum, subNum: unlockedSubNum } = parseStageId(getUnlockedStage());
  const isFullyCleared = n < unlockedStageNum;
  const isCurrent = n === unlockedStageNum;

  const goalCatId = Object.values(stage.cats)[0];
  const goalCatName = CAT_NAMES[goalCatId] || goalCatId;
  const collection = getCollection();

  // Helper: cats in lineup up to a specific goal value
  function catLineupUpTo(stageNum, goal) {
    return getStageCatLineup(stageNum).filter(({ value }) => value <= goal);
  }

  // Build sub-stage rows
  const subRows = [1, 2, 3].map(sub => {
    const cfg = getSubStageConfig(n, sub);
    const subUnlocked = isFullyCleared || (isCurrent && sub <= unlockedSubNum);
    const subCleared = isFullyCleared || (isCurrent && sub < unlockedSubNum);
    const isCurSub = isCurrent && sub === unlockedSubNum;

    const statusIcon = subCleared ? '✅' : isCurSub ? '▶' : '🔒';
    const catCountLabel = `${catLineupUpTo(n, cfg.goal).length}마리`;

    return `<div class="stage-popup__sub${!subUnlocked ? ' stage-popup__sub--locked' : ''}">
      <span class="stage-popup__sub-icon">${statusIcon}</span>
      <div class="stage-popup__sub-info">
        <span class="stage-popup__sub-name">${n}-${sub}</span>
        <span class="stage-popup__sub-meta">${cfg.boardLabel} · ${catCountLabel} · 목표 ${cfg.goal.toLocaleString()}</span>
      </div>
      ${subUnlocked ? `<button class="stage-popup__sub-btn tds-btn tds-btn-primary" data-sub="${sub}">시작</button>` : ''}
    </div>`;
  }).join('');

  // Goal cat display
  const goalDiscovered = (collection.get(goalCatId) || 0) >= 1;
  const goalImgCls = goalDiscovered ? '' : ' stage-popup__goal-img--silhouette';

  const overlay = document.createElement('div');
  overlay.className = 'overlay-dimmer';
  overlay.innerHTML = `
    <div class="stage-popup">
      <div class="stage-popup__header">
        <span class="stage-popup__title">스테이지 ${n}</span>
        <button class="stage-popup__close" id="popup-close">✕</button>
      </div>
      <div class="stage-popup__body">
        <div class="stage-popup__goal">
          <img class="stage-popup__goal-img${goalImgCls}" src="${getCatImage(goalCatId)}" alt="${goalCatName}">
          <div class="stage-popup__goal-info">
            <span class="stage-popup__goal-name">${goalCatName}</span>
            <span class="stage-popup__goal-meta">목표 고양이</span>
          </div>
        </div>
        <div class="stage-popup__subs">${subRows}</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.getElementById('popup-close').addEventListener('click', () => document.body.removeChild(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay); });
  overlay.querySelectorAll('[data-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      navigate(`play?stage=${n}-${btn.dataset.sub}`);
    });
  });
}

function showInfiniteSizeSelector() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-dimmer';
  overlay.innerHTML = `
    <div style="background:var(--tds-card);border-radius:24px;padding:28px 24px;max-width:320px;width:calc(100% - 40px);box-shadow:var(--tds-shadow-md);">
      <div style="font-size:20px;font-weight:800;margin-bottom:20px;color:var(--tds-text);">보드 크기 선택</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${[3,4,5,6,8].map(s => `
          <button data-size="${s}" style="background:var(--tds-grey-100);border:none;border-radius:12px;padding:14px 20px;font-size:15px;font-weight:700;color:var(--tds-text);font-family:inherit;cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;">
            <span>${s}×${s} 보드</span>
            <span style="color:var(--tds-sub);font-size:13px;font-weight:600;">무한모드</span>
          </button>`).join('')}
      </div>
      <button id="size-cancel" style="margin-top:14px;width:100%;background:none;border:none;padding:12px;font-size:14px;font-weight:600;color:var(--tds-sub);font-family:inherit;cursor:pointer;">취소</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      navigate(`play?infinite=${btn.dataset.size}`);
    });
  });
  document.getElementById('size-cancel').addEventListener('click', () => document.body.removeChild(overlay));
}
