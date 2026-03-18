import { navigate } from '../core/router.js';
import { getUnlockedStage, isInfiniteUnlocked, getBestScore, getBestTime, getCollectionCount, getCollection, COLLECTION_MAX, DEBUG_MODE, enableDebugMode, getMedal } from '../game/score.js';
import { STAGES, getCatImage, getCatForValue, CAT_NAMES, getStageCatLineup, ALL_CATS_ORDERED } from '../game/stages.js';
import { ICON } from '../core/icons.js';
import { showCatDetail } from './collection.js';

export function renderHome() {
  const app = document.getElementById('app');
  const unlockedStage = getUnlockedStage();
  const infiniteUnlocked = isInfiniteUnlocked();
  const totalCats = ALL_CATS_ORDERED.length;
  const collectionCount = getCollectionCount(totalCats);
  const collection = getCollection();

  const stageCards = Array.from({ length: 20 }, (_, i) => i + 1).map(n => {
    const stage = STAGES[n];
    const locked = n > unlockedStage;
    const best = getBestScore(n);
    const bestTime = getBestTime(n);

    const lineup = getStageCatLineup(n);
    const collectibleCats = Object.values(stage.cats);
    const foundCount = collectibleCats.filter(catId => (collection.get(catId) || 0) > 0).length;
    const totalCats = collectibleCats.length;
    const cleared = foundCount === totalCats;
    const medal = getMedal(n);
    const medalEmoji = medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : '';

    const catChipsHtml = lineup.map(({ catId }) => {
      const isCollectible = collectibleCats.includes(catId);
      const found = DEBUG_MODE || (collection.get(catId) || 0) > 0;
      return `
        <div class="scat ${found ? 'scat--found' : 'scat--hidden'} ${isCollectible ? 'scat--collectible' : ''}" data-cat-id="${catId}">
          <img src="${getCatImage(catId)}" alt="${CAT_NAMES[catId] || catId}">
        </div>
      `;
    }).join('');

    if (locked) {
      return `
        <div class="stage-card stage-card--locked">
          <div class="stage-card__top">
            <div class="stage-card__badge">${n}</div>
            <div class="stage-card__title-group">
              <div class="stage-card__board">${stage.boardLabel}에서 ${lineup.length}마리 찾기 <span class="stage-card__diff">${ICON.star.repeat(stage.difficulty)}</span></div>
            </div>
            <div class="stage-card__lock-icon">${ICON.lock}</div>
          </div>
        </div>
      `;
    }

    return `
      <button class="stage-card${cleared ? ' stage-card--cleared' : ''}" data-stage="${n}">
        <div class="stage-card__top">
          <div class="stage-card__badge">${n}</div>
          <div class="stage-card__title-group">
            <div class="stage-card__board">${stage.boardLabel}에서 ${lineup.length}마리 찾기 <span class="stage-card__diff">${medalEmoji || ICON.star.repeat(stage.difficulty)}</span></div>
          </div>
          ${best > 0 || bestTime != null ? `<div class="stage-card__records">
            ${best > 0 ? `<div class="stage-card__score"><span class="stage-card__score-label">최고점수</span> ${best.toLocaleString()}점</div>` : ''}
            ${bestTime != null ? `<div class="stage-card__score"><span class="stage-card__score-label">최단시간</span> ${Math.floor(bestTime / 60)}:${(bestTime % 60).toString().padStart(2, '0')}</div>` : ''}
          </div>` : ''}
        </div>
        <div class="stage-card__cats">${catChipsHtml}</div>
        ${!cleared ? `<div class="stage-card__cta tds-btn tds-btn-md tds-btn-block">도전하기</div>` : ''}
      </button>
    `;
  }).join('');

  const infiniteCard = infiniteUnlocked ? `
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
        <div class="home-header-btns">
          <button class="home-exchange-btn" id="exchange-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="var(--tds-blue, #3182F6)"/>
              <text x="8" y="12" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="inherit">P</text>
            </svg>
            <span>포인트 교환</span>
          </button>
          <button class="home-collection-btn" id="collection-btn">
            <img src="paw.png" class="home-collection-paw" alt="paw">
            <span>고양이 도감</span>
            <span class="home-collection-pct">${Math.round(collectionCount / totalCats * 100)}%</span>
          </button>
        </div>
      </div>
      <div class="home-stages">
        ${stageCards}
        ${infiniteCard}
      </div>
      <div class="ad-banner-container ad-banner-container--home" id="home-banner-ad"></div>
    </div>
  `;

  // Load banner ad
  if (window.AIT) AIT.loadBannerAd('home-banner-ad');

  // Hidden debug: tap logo 10 times within 5 seconds
  const logo = app.querySelector('.home-logo');
  if (logo) {
    let tapCount = 0;
    let tapTimer = null;
    logo.addEventListener('click', () => {
      tapCount++;
      if (tapCount === 1) {
        tapTimer = setTimeout(() => { tapCount = 0; }, 5000);
      }
      if (tapCount >= 10) {
        clearTimeout(tapTimer);
        tapCount = 0;
        enableDebugMode();
        renderHome();
      }
    });
  }

  // Stage card click
  app.querySelectorAll('.stage-card[data-stage]').forEach(btn => {
    btn.addEventListener('click', () => {
      const stageId = btn.dataset.stage;
      navigate(`play?stage=${stageId}`);
    });
  });

  // Infinite card
  const infCard = document.getElementById('infinite-card');
  if (infCard) {
    infCard.addEventListener('click', () => showInfiniteSizeSelector());
  }

  // Exchange button
  document.getElementById('exchange-btn').addEventListener('click', () => {
    navigate('exchange');
  });

  // Collection button
  document.getElementById('collection-btn').addEventListener('click', () => {
    navigate('collection');
  });
}

function showInfiniteSizeSelector() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-dimmer';
  overlay.innerHTML = `
    <div style="
      background: var(--tds-card);
      border-radius: 24px;
      padding: 28px 24px;
      max-width: 320px;
      width: calc(100% - 40px);
      box-shadow: var(--tds-shadow-md);
    ">
      <div style="font-size:20px; font-weight:800; margin-bottom:20px; color:var(--tds-text);">보드 크기 선택</div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${[3,4,5,6,8].map(s => `
          <button data-size="${s}" style="
            background: var(--tds-grey-100);
            border: none; border-radius: 12px;
            padding: 14px 20px;
            font-size: 15px; font-weight: 700;
            color: var(--tds-text);
            font-family: inherit; cursor: pointer;
            text-align: left;
            display: flex; align-items: center; justify-content: space-between;
          ">
            <span>${s}×${s} 보드</span>
            <span style="color:var(--tds-sub); font-size:13px; font-weight:600;">무한모드</span>
          </button>
        `).join('')}
      </div>
      <button id="size-cancel" style="
        margin-top:14px; width:100%;
        background:none; border:none;
        padding:12px; font-size:14px; font-weight:600;
        color:var(--tds-sub); font-family:inherit; cursor:pointer;
      ">취소</button>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      document.body.removeChild(overlay);
      navigate(`play?infinite=${size}`);
    });
  });

  document.getElementById('size-cancel').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}
