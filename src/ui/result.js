import { navigate, getHashParams } from '../core/router.js';
import { getBestScore, getCollection } from '../game/score.js';
import { getCatImage, CAT_NAMES, STAGES, getCatForValue } from '../game/stages.js';

export function renderResult() {
  const params = getHashParams();
  const isInfinite = !!params.infinite;
  const stageId = isInfinite ? 'infinite' : parseInt(params.stage || '1', 10);
  const infiniteSize = isInfinite ? parseInt(params.infinite, 10) : null;
  const score = parseInt(params.score || '0', 10);
  const isClear = params.clear === '1';

  const boardKey = isInfinite ? `inf_${infiniteSize}` : stageId;
  const bestScore = getBestScore(boardKey);

  // Find highest cat in collection to show
  const collection = getCollection();
  let showcatId = null;
  if (isClear && stageId !== 'infinite') {
    // Find the goal cat for this stage
    const stage = STAGES[stageId];
    if (stage) {
      const goalCatId = getCatForValue(stageId, stage.goal);
      if (goalCatId && collection.has(goalCatId)) {
        showcatId = goalCatId;
      }
    }
  }

  const stageLabel = isInfinite
    ? `무한모드 ${infiniteSize}×${infiniteSize}`
    : `Stage ${stageId}`;

  function spawnConfetti() {
    const colors = ['#FF6B35', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c'];
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        el.style.animationDelay = '0s';
        el.style.width = el.style.height = (6 + Math.random() * 8) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
      }, i * 40);
    }
  }

  const app = document.getElementById('app');

  const newCatHtml = showcatId ? `
    <div class="result-new-cat">
      <img src="${getCatImage(showcatId)}" alt="${CAT_NAMES[showcatId] || showcatId}">
      <div class="result-new-cat__text">
        <div class="result-new-cat__label">새 고양이 획득!</div>
        <div class="result-new-cat__name">${CAT_NAMES[showcatId] || showcatId}</div>
      </div>
    </div>
  ` : '';

  if (isClear) {
    app.innerHTML = `
      <div class="result-screen">
        <div class="result-emoji">🎉</div>
        <div class="result-title result-title--clear">${stageLabel} 클리어!</div>
        <div class="result-scores">
          <div class="result-score-box">
            <div class="result-score-box__label">점수</div>
            <div class="result-score-box__value">${score.toLocaleString()}</div>
          </div>
          <div class="result-score-box">
            <div class="result-score-box__label">최고기록</div>
            <div class="result-score-box__value">${bestScore.toLocaleString()}</div>
          </div>
        </div>
        ${newCatHtml}
        <div class="result-buttons">
          <button class="tds-btn tds-btn-primary tds-btn-xl tds-btn-block" id="continue-btn">
            계속 플레이
          </button>
          <button class="tds-btn tds-btn-light tds-btn-xl tds-btn-block" id="home-btn">
            홈으로
          </button>
          <button class="tds-btn tds-btn-weak-primary tds-btn-md tds-btn-block" id="collection-btn">
            🐱 도감 보기
          </button>
        </div>
      </div>
    `;

    setTimeout(spawnConfetti, 300);

    document.getElementById('continue-btn').addEventListener('click', () => {
      const p = isInfinite ? `infinite=${infiniteSize}` : `stage=${stageId}`;
      navigate(`play?${p}`);
    });

    document.getElementById('home-btn').addEventListener('click', async () => {
      if (window.AIT) await AIT.showAd('interstitial');
      navigate('home');
    });

    document.getElementById('collection-btn').addEventListener('click', () => {
      navigate('collection');
    });

  } else {
    // Game Over
    app.innerHTML = `
      <div class="result-screen">
        <div class="result-emoji">😿</div>
        <div class="result-title">게임 오버</div>
        <div style="font-size:14px; color:var(--tds-sub); margin-bottom:16px;">${stageLabel}</div>
        <div class="result-scores">
          <div class="result-score-box">
            <div class="result-score-box__label">점수</div>
            <div class="result-score-box__value">${score.toLocaleString()}</div>
          </div>
          <div class="result-score-box">
            <div class="result-score-box__label">최고기록</div>
            <div class="result-score-box__value">${bestScore.toLocaleString()}</div>
          </div>
        </div>
        <div class="result-buttons">
          <button class="tds-btn tds-btn-primary tds-btn-xl tds-btn-block" id="restart-btn">
            🔄 재시작 (광고)
          </button>
          <button class="tds-btn tds-btn-light tds-btn-xl tds-btn-block" id="home-btn">
            🏠 홈으로 (광고)
          </button>
          <button class="tds-btn tds-btn-weak-primary tds-btn-md tds-btn-block" id="collection-btn">
            🐱 도감 보기
          </button>
        </div>
      </div>
    `;

    document.getElementById('restart-btn').addEventListener('click', async () => {
      if (window.AIT) await AIT.showAd('interstitial');
      const p = isInfinite ? `infinite=${infiniteSize}` : `stage=${stageId}`;
      navigate(`play?${p}`);
    });

    document.getElementById('home-btn').addEventListener('click', async () => {
      if (window.AIT) await AIT.showAd('interstitial');
      navigate('home');
    });

    document.getElementById('collection-btn').addEventListener('click', () => {
      navigate('collection');
    });
  }
}
