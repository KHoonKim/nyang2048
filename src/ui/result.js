import { navigate, getHashParams } from '../core/router.js';
import { getBestScore, getBestTime } from '../game/score.js';
import { getCatImage, CAT_NAMES, STAGES, parseStageId, getSubStageConfig } from '../game/stages.js';

export function renderResult() {
  const params = getHashParams();
  const isInfinite = !!params.infinite;
  const infiniteSize = isInfinite ? parseInt(params.infinite, 10) : null;
  const rawStage = params.stage || '1-1';
  const stageId = isInfinite ? 'infinite' : rawStage; // e.g. "3-2"
  const { stageNum, subNum } = isInfinite ? { stageNum: null, subNum: null } : parseStageId(stageId);
  const score = parseInt(params.score || '0', 10);
  const isClear = params.clear === '1';

  const boardKey = isInfinite ? `inf_${infiniteSize}` : stageId;
  const bestScore = getBestScore(boardKey);
  const bestTime = getBestTime(boardKey);
  const bestTimeStr = bestTime ? `${Math.floor(bestTime / 60)}:${(bestTime % 60).toString().padStart(2, '0')}` : '--:--';

  const elapsedSeconds = parseInt(params.time || '0', 10);
  const elapsedMin = Math.floor(elapsedSeconds / 60);
  const elapsedSec = elapsedSeconds % 60;
  const elapsedStr = `${elapsedMin}:${elapsedSec.toString().padStart(2, '0')}`;


  // Discovered cats from this play session
  const discoveredCats = params.cats ? params.cats.split(',').filter(Boolean) : [];

  const stageLabel = isInfinite
    ? `무한모드 ${infiniteSize}×${infiniteSize}`
    : `Stage ${stageNum}-${subNum}`;

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
        document.documentElement.appendChild(el);
        setTimeout(() => el.remove(), 3500);
      }, i * 40);
    }
  }

  const app = document.getElementById('app');

  function loadResultAd() {
    if (window.AIT) AIT.loadBannerAd('result-bottom-ad', { image: true });
  }

  const newCatHtml = discoveredCats.length > 0 ? `
    <div class="result-new-cats">
      <div class="result-new-cats__label">새 고양이 발견!</div>
      <div class="result-new-cats__list">
        ${discoveredCats.map(catId => `
          <div class="result-new-cat">
            <img src="${getCatImage(catId)}" alt="${CAT_NAMES[catId] || catId}">
            <div class="result-new-cat__name">${CAT_NAMES[catId] || catId}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  if (isClear) {
    app.innerHTML = `
      <div class="result-screen">
        <div class="result-emoji">🎉</div>
        <div class="result-title result-title--clear">${stageLabel} 클리어!</div>

        <div class="play-header">
          <div class="play-header__block">
            <div class="play-header__current">
              <span class="play-header__label">점수</span>
              <span class="play-header__value">${score.toLocaleString()}</span>
            </div>
            <div class="play-header__best-wrap">
              <span class="play-header__label">최고</span>
              <span class="play-header__best">${bestScore.toLocaleString()}</span>
            </div>
          </div>
          <div class="play-header__block">
            <div class="play-header__current">
              <span class="play-header__label">시간</span>
              <span class="play-header__value">${elapsedStr}</span>
            </div>
            <div class="play-header__best-wrap">
              <span class="play-header__label">최단</span>
              <span class="play-header__best">${bestTimeStr}</span>
            </div>
          </div>
        </div>
        ${newCatHtml}
        <div class="result-buttons">
          ${(() => {
            if (isInfinite) return '';
            const hasNextStage = subNum < 3 || stageNum < 36;
            if (!hasNextStage) return '';
            const nextSubLabel = subNum < 3
              ? `${stageNum}-${subNum + 1} 도전`
              : `${stageNum + 1}-1 도전`;
            return `<button class="tds-btn result-btn-brand tds-btn-xl tds-btn-block" id="next-stage-btn">${nextSubLabel}</button>`;
          })()}
          <div class="result-buttons-row">
            <button class="tds-btn ${!isInfinite && (subNum < 3 || stageNum < 36) ? 'tds-btn-light' : 'tds-btn-primary'} tds-btn-xl tds-btn-half" id="replay-btn">
              다시 플레이
            </button>
            <button class="tds-btn tds-btn-light tds-btn-xl tds-btn-half" id="home-btn">
              홈으로
            </button>
          </div>
        </div>
        <div class="ad-banner-container ad-banner-container--bottom" id="result-bottom-ad"></div>
      </div>
    `;

    loadResultAd();
    setTimeout(spawnConfetti, 300);

    const nextBtn = document.getElementById('next-stage-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextId = subNum < 3
          ? `${stageNum}-${subNum + 1}`
          : `${stageNum + 1}-1`;
        navigate(`play?stage=${nextId}`);
      });
    }

    document.getElementById('replay-btn').addEventListener('click', async () => {
      if (window.AIT) {
        const count = AIT.getTodayGameCount();
        if (count >= 1 && AIT.isToss) await AIT.showAd('interstitial').catch(() => {});
      }
      const p = isInfinite ? `infinite=${infiniteSize}` : `stage=${stageId}`;
      navigate(`play?${p}`);
    });

    document.getElementById('home-btn').addEventListener('click', async () => {
      if (!isInfinite) sessionStorage.setItem('nyang-just-cleared', stageId);
      navigate('home');
    });

  } else {
    // Game Over
    app.innerHTML = `
      <div class="result-screen">
        <div class="result-emoji">😿</div>
        <div class="result-title">게임 오버</div>
        <div style="font-size:14px; color:var(--tds-sub); margin-bottom:16px;">${stageLabel}</div>
        <div class="play-header">
          <div class="play-header__block">
            <div class="play-header__current">
              <span class="play-header__label">점수</span>
              <span class="play-header__value">${score.toLocaleString()}</span>
            </div>
            <div class="play-header__best-wrap">
              <span class="play-header__label">최고</span>
              <span class="play-header__best">${bestScore.toLocaleString()}</span>
            </div>
          </div>
          <div class="play-header__block">
            <div class="play-header__current">
              <span class="play-header__label">시간</span>
              <span class="play-header__value">${elapsedStr}</span>
            </div>
            <div class="play-header__best-wrap">
              <span class="play-header__label">최단</span>
              <span class="play-header__best">${bestTimeStr}</span>
            </div>
          </div>
        </div>
        <div class="result-buttons">
          <div class="result-buttons-row">
            <button class="tds-btn result-btn-brand tds-btn-xl tds-btn-half" id="restart-btn">
              다시 플레이
            </button>
            <button class="tds-btn tds-btn-light tds-btn-xl tds-btn-half" id="home-btn">
              홈으로
            </button>
          </div>
        </div>
        <div class="ad-banner-container ad-banner-container--bottom" id="result-bottom-ad"></div>
      </div>
    `;

    loadResultAd();
    document.getElementById('restart-btn').addEventListener('click', async () => {
      if (window.AIT) {
        const count = AIT.getTodayGameCount();
        if (count >= 1 && AIT.isToss) await AIT.showAd('interstitial').catch(() => {});
      }
      const p = isInfinite ? `infinite=${infiniteSize}` : `stage=${stageId}`;
      navigate(`play?${p}`);
    });

    document.getElementById('home-btn').addEventListener('click', async () => {
      navigate('home');
    });

  }
}
