import { navigate } from '../core/router.js';
import { getUnlockedStage, isInfiniteUnlocked, getBestScore, getCollectionCount } from '../game/score.js';
import { STAGES, getCatImage, getCatForValue } from '../game/stages.js';

export function renderHome() {
  const app = document.getElementById('app');
  const unlockedStage = getUnlockedStage();
  const infiniteUnlocked = isInfiniteUnlocked();
  const collectionCount = getCollectionCount();

  const stageCards = [1, 2, 3, 4, 5].map(n => {
    const stage = STAGES[n];
    const locked = n > unlockedStage;
    const best = getBestScore(n);

    // Cat previews for this stage (first 3 cats)
    const catValues = Object.keys(stage.cats).slice(0, 3).map(Number);
    const catPreviews = catValues.map(v => {
      const catId = getCatForValue(n, v);
      return catId ? `<img src="${getCatImage(catId)}" alt="${catId}">` : '';
    }).join('');

    return `
      <button class="stage-card ${locked ? 'stage-card--locked' : ''}" data-stage="${n}">
        <div class="stage-card__num">${n}</div>
        <div class="stage-card__info">
          <div class="stage-card__title">Stage ${n}</div>
          <div class="stage-card__sub">${stage.boardLabel} · 목표 ${stage.goal.toLocaleString()}</div>
        </div>
        <div class="stage-card__right">
          ${best > 0 ? `<div class="stage-card__best">최고점수</div><div class="stage-card__score">${best.toLocaleString()}</div>` : '<div class="stage-cat-preview">' + catPreviews + '</div>'}
        </div>
        ${locked ? '<div class="stage-card__lock">🔒</div>' : ''}
      </button>
    `;
  }).join('');

  const infiniteCard = infiniteUnlocked ? `
    <button class="stage-card stage-card--infinite" id="infinite-card">
      <div class="stage-card__num">∞</div>
      <div class="stage-card__info">
        <div class="stage-card__title">무한모드</div>
        <div class="stage-card__sub">목표 없이 최고점수 도전</div>
      </div>
      <div class="stage-card__right">
        <div class="stage-card__best" style="color:rgba(255,255,255,0.5)">선택</div>
        <div class="stage-card__score" style="color:#fff; font-size:13px;">보드 크기 ▸</div>
      </div>
    </button>
  ` : '';

  app.innerHTML = `
    <div class="home-screen">
      <div class="home-header">
        <div class="home-title">냥2048</div>
        <button class="home-collection-btn" id="collection-btn">
          🐱 ${collectionCount}/42
        </button>
      </div>
      <div class="home-stages">
        ${stageCards}
        ${infiniteCard}
      </div>
    </div>
  `;

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
