import { navigate } from '../core/router.js';
import { getUnlockedStage, isInfiniteUnlocked, getBestScore, getBestTime, getCollectionCount, getCollection, COLLECTION_MAX, DEBUG_MODE, enableDebugMode, findSavedBoard, clearBoard, loadBoard, saveBoard } from '../game/score.js';
import { STAGES, getCatImage, getCatForValue, CAT_NAMES, getStageCatLineup, ALL_CATS_ORDERED, getSubStageConfig, parseStageId, formatStageId } from '../game/stages.js';
import { ICON } from '../core/icons.js';
import { showCatDetail } from './collection.js';
import { checkAttendance, getAttendanceStatus } from '../core/api.js';

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
    const sweepSize = 2;
    const sweepIdx = Math.floor((n - 1) / sweepSize);
    const t = ((n - 1) % sweepSize) / sweepSize;
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

    return `<div class="smap-slot" style="left:${xPct}%">
      <div class="smap-node-wrap">
        ${nodeHtml}
        <span class="smap-node__badge${isCurrent ? ' smap-node__badge--current' : ''}">${n}</span>
      </div>
      ${subDots()}
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
      <div class="home-nav home-nav--overlay">
        <div class="home-nav-left">
          <button class="home-nav-btn home-nav-btn--exchange" id="exchange-btn">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" fill="var(--tds-blue, #3182F6)"/>
              <text x="10" y="10" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="900" fill="#fff" font-family="inherit">P</text>
            </svg>
            <span>포인트 교환</span>
          </button>
          <button class="home-nav-btn home-nav-btn--gift" id="gift-btn">
            <img src="/present.webp" style="width:18px;height:18px;object-fit:contain;" alt="선물">
            <span>오늘의 선물</span>
          </button>
        </div>
        <div id="streak-counter" class="streak-counter" style="display:none;"></div>
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
      <button class="home-nav-btn home-stage-cta-btn" id="stage-cta-btn">스테이지${unlockedStageNum} 시작하기</button>
      <div class="attend-panel" id="attend-panel">
        <div class="attend-header">
          <div class="attend-title-group">
            <span class="attend-title">출석 체크 <span class="attend-day-badge" id="attend-day-badge"></span></span>
            <span class="attend-subtitle">매일 들어오면 1코인, 7일차부터는 3코인을 드려요.</span>
          </div>
          <span class="attend-streak-label" id="attend-streak-label"></span>
        </div>
        <div class="attend-days" id="attend-days">
          ${[1,2,3,4,5,6,7].map(d => `
            <div class="attend-day" id="attend-day-${d}">
              <div class="attend-day__circle" id="attend-day-circle-${d}">
                ${d === 7 ? `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#FF6B35"/><text x="10" y="10" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="900" fill="#fff" font-family="inherit">C</text></svg>` : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,7 6,11 12,3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
              </div>
              <span class="attend-day__num" id="attend-day-num-${d}">-</span>
            </div>
          `).join('')}
        </div>
        <button class="attend-btn" id="attend-check-btn" disabled>로딩 중...</button>
      </div>
    </div>
    <div class="ad-banner-container ad-banner-container--home" id="home-banner-ad"></div>
  `;

  if (window.AIT) AIT.loadBannerAd('home-banner-ad');

  // ── Restore saved game modal ──
  const savedGame = findSavedBoard();
  if (savedGame) {
    // Read board data then immediately clear from localStorage.
    // This prevents the modal from appearing again if renderHome() is called twice.
    const savedBoardData = loadBoard(savedGame.stageId);
    clearBoard(savedGame.stageId);

    const restoreModal = document.createElement('div');
    restoreModal.className = 'exit-confirm-overlay';
    restoreModal.innerHTML = `
      <div class="exit-confirm-card">
        <div class="exit-confirm-title">진행중인 게임이 있어요<br>불러올까요?</div>
        <div class="exit-confirm-buttons" style="margin-top:24px">
          <button class="tds-btn tds-btn-lg tds-btn-light exit-confirm-no">아니오</button>
          <button class="tds-btn tds-btn-lg tds-btn-primary exit-confirm-yes">네</button>
        </div>
      </div>
    `;
    document.body.appendChild(restoreModal);
    requestAnimationFrame(() => restoreModal.classList.add('exit-confirm--visible'));

    restoreModal.querySelector('.exit-confirm-no').addEventListener('click', () => {
      restoreModal.classList.remove('exit-confirm--visible');
      setTimeout(() => restoreModal.remove(), 200);
      // Board already cleared above, nothing more to do
    });
    restoreModal.querySelector('.exit-confirm-yes').addEventListener('click', () => {
      // Put board back in localStorage so play.js can restore it
      if (savedBoardData) saveBoard(savedGame.stageId, savedBoardData);
      restoreModal.classList.remove('exit-confirm--visible');
      setTimeout(() => {
        restoreModal.remove();
        navigate(savedGame.navHash);
      }, 200);
    });
  }

  // Scroll current stage to bottom of visible area + position CTA button
  requestAnimationFrame(() => {
    const wrap = document.querySelector('.stage-map-wrap');
    const node = document.getElementById('smap-current');
    if (wrap && node) {
      const wrapRect = wrap.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      wrap.scrollTop += nodeRect.bottom - wrapRect.bottom + 110;
    }
    const panel = document.getElementById('attend-panel');
    const ctaBtn = document.getElementById('stage-cta-btn');
    if (panel && ctaBtn) {
      ctaBtn.style.bottom = (panel.offsetHeight + 16) + 'px';
    }
  });



  // Attendance module
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  function getWeekdayLabels(cycleStartDate) {
    const labels = [];
    const start = new Date(cycleStartDate + 'T12:00:00Z');
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      labels.push(DOW[d.getUTCDay()]);
    }
    return labels;
  }

  function updateAttendUI({ streak, cycleDay, weekDays, alreadyChecked, cycleStartDate }) {
    // badge 미사용
    const badge = document.getElementById('attend-day-badge');
    if (badge) badge.textContent = '';

    // 연속 출석 스트릭
    const streakLabel = document.getElementById('attend-streak-label');
    if (streakLabel) {
      streakLabel.textContent = streak > 0 ? `🔥 ${streak}일 연속` : '';
    }

    // 요일 라벨
    const today = new Date();
    const fallbackStart = new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const labels = getWeekdayLabels(cycleStartDate || fallbackStart);
    const is3CoinCycle = streak >= 7;
    const CHECK_SVG = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,7 6,11 12,3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    for (let d = 1; d <= 7; d++) {
      const el = document.getElementById(`attend-day-${d}`);
      if (!el) continue;

      const numEl = document.getElementById(`attend-day-num-${d}`);
      if (numEl) numEl.textContent = labels[d - 1];

      const coins = (is3CoinCycle || d === 7) ? 3 : 1;
      const isDone = weekDays && weekDays.includes(d);
      const isCurrent = d === cycleDay && !alreadyChecked;

      el.classList.remove('attend-day--done', 'attend-day--current', 'attend-day--future');
      el.classList.add(isDone ? 'attend-day--done' : isCurrent ? 'attend-day--current' : 'attend-day--future');

      const circleEl = document.getElementById(`attend-day-circle-${d}`);
      if (circleEl) {
        circleEl.innerHTML = isDone
          ? CHECK_SVG
          : `<span style="font-size:15px;font-weight:800;line-height:1;">${coins}</span>`;
      }
    }

    // Button
    const btn = document.getElementById('attend-check-btn');
    if (!btn) return;
    if (alreadyChecked) {
      btn.textContent = '오늘 출석 완료 ✓';
      btn.disabled = true;
      btn.classList.add('attend-btn--done');
    } else {
      const reward = streak >= 6 ? 3 : 1; // 7일차(streak>=7)부터 3코인, 버튼은 다음날 기준
      btn.textContent = `출석 체크 +${reward}코인`;
      btn.disabled = false;
      btn.classList.remove('attend-btn--done');
    }
  }

  (async () => {
    // 오프라인 fallback: 오늘부터 1일차로 표시
    const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    updateAttendUI({ streak: 0, cycleDay: 1, weekDays: [], alreadyChecked: false, cycleStartDate: todayKST });
    const btn0 = document.getElementById('attend-check-btn');
    if (btn0) { btn0.textContent = '출석 체크 +1코인'; btn0.disabled = false; }

    try {
      // 초기 상태 조회
      const status = await getAttendanceStatus();
      if (status) {
        updateAttendUI({
          streak: status.streak,
          cycleDay: status.cycleDay || (status.streak > 0 ? ((status.streak - 1) % 7) + 1 : 1),
          weekDays: status.weekDays || [],
          alreadyChecked: status.checkedToday,
          cycleStartDate: status.cycleStartDate || todayKST,
        });
        // 상단 streak 카운터 업데이트
        const counter = document.getElementById('streak-counter');
        if (counter && status.streak > 0) {
          counter.textContent = `🔥 ${status.streak}일 연속 출석!`;
          counter.style.display = 'inline-flex';
        }
      }
    } catch { }

    // 출석 체크 버튼
    const btn = document.getElementById('attend-check-btn');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '처리 중...';
        try {
          const result = await checkAttendance();
          if (!result) { btn.disabled = false; return; }
          const { streak, cycleDay, weekDays, bonusCoins, dailyCoins, cycleStartDate } = result;
          updateAttendUI({ streak, cycleDay, weekDays, alreadyChecked: true, cycleStartDate: cycleStartDate || todayKST });
          // 상단 streak 업데이트
          const counter = document.getElementById('streak-counter');
          if (counter) {
            counter.textContent = `🔥 ${streak}일 연속 출석!`;
            counter.style.display = 'inline-flex';
          }
          // 토스트
          const coins = bonusCoins > 0 ? bonusCoins : (dailyCoins || 1);
          const msg = bonusCoins > 0
            ? `7일 연속 달성! 코인 +${coins} 🎉`
            : `출석 완료! 코인 +${coins}`;
          const toast = document.createElement('div');
          toast.className = 'streak-toast';
          toast.textContent = msg;
          document.body.appendChild(toast);
          requestAnimationFrame(() => toast.classList.add('show'));
          setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
          }, 3000);
        } catch { btn.disabled = false; }
      });
    }
  })();

  // Hidden reset: tap attend-panel 5 times within 3 seconds
  const attendPanel = document.getElementById('attend-panel');
  if (attendPanel) {
    let resetTaps = 0, resetTimer = null;
    attendPanel.addEventListener('pointerdown', () => {
      resetTaps++;
      if (resetTaps === 1) resetTimer = setTimeout(() => { resetTaps = 0; }, 3000);
      if (resetTaps >= 5) {
        clearTimeout(resetTimer); resetTaps = 0;
        if (confirm('⚠️ 모든 데이터를 초기화할까요?')) {
          Object.keys(localStorage)
            .filter(k => k.startsWith('nyang'))
            .forEach(k => localStorage.removeItem(k));
          navigate('tutorial');
        }
      }
    });
  }

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

  document.getElementById('stage-cta-btn').addEventListener('click', () => showStageDetail(unlockedStageNum));
  document.getElementById('exchange-btn').addEventListener('click', () => navigate('exchange'));
  document.getElementById('collection-btn').addEventListener('click', () => navigate('collection'));
  const todayKST = () => new Date(Date.now() + 9*3600*1000).toISOString().slice(0,10);
  const giftBtn = document.getElementById('gift-btn');
  if (localStorage.getItem('nyang-gift-date') === todayKST()) {
    giftBtn.disabled = true;
    const span = giftBtn.querySelector('span');
    if (span) span.textContent = '받기 완료';
  }
  giftBtn.addEventListener('click', () => { if (!giftBtn.disabled) showGiftBottomSheet(); });
}

function showGiftBottomSheet() {
  const GIFT_ITEMS = [
    { id: 'undo',    label: '되돌리기', key: 'nyang-undo-charges' },
    { id: 'hammer',  label: '망치',     key: 'nyang-hammer-charges' },
    { id: 'cleaner', label: '클리너',   key: 'nyang-cleaner-charges' },
    { id: 'upgrade', label: '업그레이드', key: 'nyang-upgrade-charges' },
  ];
  const getC = (key) => parseInt(localStorage.getItem(key) || '0', 10);
  const addC = (key) => localStorage.setItem(key, String(getC(key) + 1));

  let selectedId = GIFT_ITEMS[0].id;

  const overlay = document.createElement('div');
  overlay.className = 'tds-bottom-sheet-overlay';
  overlay.innerHTML = `
    <div class="tds-bottom-sheet">
      <div class="tds-bottom-sheet__handle"></div>
      <div class="tds-bottom-sheet__title">원하는 선물을 선택하세요.</div>
      <div class="item-choice-list" style="padding:0 20px 16px">
        ${GIFT_ITEMS.map(item => `
          <button class="item-choice-btn${item.id === selectedId ? ' item-choice-btn--selected' : ''}" data-id="${item.id}">
            <span class="item-choice-btn__icon">${ICON[item.id]}</span>
            <span class="item-choice-btn__label">${item.label}</span>
            <span class="item-choice-btn__count">${getC(item.key)}개 보유</span>
          </button>
        `).join('')}
      </div>
      <div class="tds-bottom-sheet__actions">
        <button class="tds-btn tds-btn-lg tds-btn-primary gift-ad-btn">5초 광고보고 모두 받기</button>
        <button class="tds-btn tds-btn-lg tds-btn-light gift-one-btn">안보고 하나만 받기</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('tds-bottom-sheet-overlay--visible'));

  const close = () => {
    overlay.classList.remove('tds-bottom-sheet-overlay--visible');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  overlay.querySelectorAll('.item-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedId = btn.dataset.id;
      overlay.querySelectorAll('.item-choice-btn').forEach(b => b.classList.remove('item-choice-btn--selected'));
      btn.classList.add('item-choice-btn--selected');
    });
  });

  function animateAndClose(ids) {
    ids.forEach((id, i) => {
      const btn = overlay.querySelector(`.item-choice-btn[data-id="${id}"]`);
      if (!btn) return;
      setTimeout(() => {
        btn.classList.add('item-choice-btn--received');
        const countEl = btn.querySelector('.item-choice-btn__count');
        if (countEl) countEl.textContent = '+1 받음!';
      }, i * 80);
    });
    setTimeout(close, ids.length * 80 + 500);
  }

  overlay.querySelector('.gift-ad-btn').addEventListener('click', async () => {
    overlay.querySelector('.gift-ad-btn').disabled = true;
    overlay.querySelector('.gift-one-btn').disabled = true;
    const todayStr = new Date(Date.now() + 9*3600*1000).toISOString().slice(0,10);
    if (!window.AIT) {
      GIFT_ITEMS.forEach(item => addC(item.key));
      localStorage.setItem('nyang-gift-date', todayStr);
      animateAndClose(GIFT_ITEMS.map(i => i.id));
      return;
    }
    const result = await AIT.showAd('rewarded').catch(() => ({ success: false }));
    if (result?.success) {
      GIFT_ITEMS.forEach(item => addC(item.key));
      localStorage.setItem('nyang-gift-date', todayStr);
      animateAndClose(GIFT_ITEMS.map(i => i.id));
    } else {
      close();
    }
  });

  overlay.querySelector('.gift-one-btn').addEventListener('click', () => {
    const item = GIFT_ITEMS.find(i => i.id === selectedId);
    if (item) {
      addC(item.key);
      localStorage.setItem('nyang-gift-date', new Date(Date.now() + 9*3600*1000).toISOString().slice(0,10));
      animateAndClose([item.id]);
    } else {
      close();
    }
  });
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

    const statusIcon = subCleared ? ICON.check : isCurSub ? '▶' : ICON.lock;
    const catCountLabel = `${catLineupUpTo(n, cfg.goal).length}마리`;
    const discoveryName = ['', '첫만남', '친해지기', '집사되기'][sub];
    const subStageId = `${n}-${sub}`;
    const bestTime = getBestTime(subStageId);
    const timeBadge = bestTime != null
      ? `<span class="stage-popup__sub-time">${String(Math.floor(bestTime / 60)).padStart(2, '0')}:${String(bestTime % 60).padStart(2, '0')}</span>`
      : '';

    return `<div class="stage-popup__sub${!subUnlocked ? ' stage-popup__sub--locked' : ''}">
      <span class="stage-popup__sub-icon">${statusIcon}</span>
      <div class="stage-popup__sub-info">
        <span class="stage-popup__sub-name">${n}-${sub}${discoveryName ? `<span class="stage-popup__sub-discovery">${discoveryName}</span>` : ''}${timeBadge}</span>
        <span class="stage-popup__sub-meta">${cfg.boardLabel} · ${catCountLabel} · 목표 ${cfg.goal.toLocaleString()}</span>
      </div>
      ${subUnlocked ? `<button class="stage-popup__sub-btn tds-btn ${subCleared ? 'tds-btn-light' : 'tds-btn-primary'}" data-sub="${sub}">${subCleared ? '다시하기' : '시작'}</button>` : ''}
    </div>`;
  }).join('');

  // Goal cat display
  const goalCatCount = collection.get(goalCatId) || 0;
  const goalDiscovered = goalCatCount >= 1;
  const goalImgCls = goalDiscovered ? '' : ' stage-popup__goal-img--silhouette';
  const DISCOVERY = ['미발견', '첫만남', '친구', '집사'];
  const goalDiscoveryLabel = DISCOVERY[Math.min(goalCatCount, 3)];

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
            <div class="stage-popup__goal-name-row">
              <span class="stage-popup__goal-name">${goalCatName}</span>
              ${goalDiscovered ? `<span class="stage-popup__goal-discovery">${goalDiscoveryLabel}</span>` : ''}
            </div>
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
