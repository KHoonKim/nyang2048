import { navigate } from '../core/router.js';
import { getCollection, getCollectionCount, getCatCount, COLLECTION_MAX, DEBUG_MODE } from '../game/score.js';
import { ALL_CATS_ORDERED, CAT_NAMES, CAT_TRAITS, getCatImage, STAGES } from '../game/stages.js';

export function renderCollection() {
  const app = document.getElementById('app');
  const collection = getCollection();
  const total = ALL_CATS_ORDERED.length;
  const count = getCollectionCount(total);

  // Group by stage
  const sectionMap = new Map();
  ALL_CATS_ORDERED.forEach(cat => {
    const key = cat.stage;
    if (!sectionMap.has(key)) sectionMap.set(key, []);
    sectionMap.get(key).push(cat);
  });

  const cardsItems = ALL_CATS_ORDERED.map(cat => {
    const catCount = DEBUG_MODE ? COLLECTION_MAX : (collection.get(cat.id) || 0);
    const found = catCount > 0;
    const isComplete = catCount >= COLLECTION_MAX;
    const name = CAT_NAMES[cat.id] || cat.id;
    const stageLabel = cat.stage === 'common'
      ? `Stage 1 · ${STAGES[1]?.boardLabel || ''}`
      : `Stage ${cat.stage} · ${STAGES[cat.stage]?.boardLabel || ''}`;
    const trait = CAT_TRAITS[cat.id] || '';
    const lvClass = !found ? 'locked' : isComplete ? 'complete' : `lv${catCount}`;
    return `
      <button class="cat-card cat-card--${lvClass}"
        data-cat-id="${cat.id}" data-collected="${found}" ${!found ? 'disabled' : ''}>
        ${found ? `<span class="cat-card__badge">${isComplete ? `${COLLECTION_MAX}/${COLLECTION_MAX} 수집완료` : `${catCount}/${COLLECTION_MAX}`}</span>` : ''}
        <img src="${getCatImage(cat.id)}"
          alt="${name}"
          class="cat-card__img" />
        <div class="cat-card__name">${found ? name : '???'}</div>
        <div class="cat-card__trait">${found ? trait : '???'}</div>
        <div class="cat-card__stage">${stageLabel}</div>
      </button>
    `;
  });

  // Insert inline banner after 4th card (2 rows × 2 cols)
  const inlineBannerHtml = `<div class="ad-banner-container ad-banner-container--collection-inline" id="collection-inline-ad"></div>`;
  if (cardsItems.length > 4) {
    cardsItems.splice(4, 0, inlineBannerHtml);
  }
  const cardsHtml = cardsItems.join('');

  app.innerHTML = `
    <div class="collection-screen">
      <div class="collection-header">
        <button class="collection-back-btn" id="back-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="collection-title"><img src="paw.png" class="collection-title-paw" alt="paw">고양이 도감</div>
        <div class="collection-count">${Math.round(count / total * 100)}% <span class="collection-count-sub">(${count}/${total}마리)</span></div>
      </div>
      <div class="collection-body">
        <div class="collection-grid">
          ${cardsHtml}
        </div>
      </div>
      <div class="ad-banner-container ad-banner-container--bottom" id="collection-bottom-ad"></div>
    </div>
  `;

  // Load ads
  if (window.AIT) {
    AIT.loadBannerAd('collection-inline-ad');
    AIT.loadBannerAd('collection-bottom-ad', { image: true });
  }

  document.getElementById('back-btn').addEventListener('click', () => navigate('home'));

  // Cat detail popup on tap
  app.querySelectorAll('.cat-card[data-collected="true"]').forEach(item => {
    item.addEventListener('click', () => {
      showCatDetail(item.dataset.catId);
    });
  });
}

export function showCatDetail(catId) {
  const name = CAT_NAMES[catId] || catId;
  const count = getCatCount(catId);
  const isComplete = count >= COLLECTION_MAX;
  const trait = CAT_TRAITS[catId] || '';

  const badge = isComplete ? '수집 완료! 🎉' : count === 0 ? '미발견' : `${count}번 발견`;
  const sub = isComplete
    ? `${name}을(를) 완전히 수집했어요`
    : count === 0
      ? '게임에서 합성하면 발견할 수 있어요'
      : `앞으로 ${COLLECTION_MAX - count}번 더 발견하면 수집돼요`;
  const dots = Array.from({ length: COLLECTION_MAX }, (_, i) =>
    `<span class="cat-detail-card__dot ${i < count ? 'cat-detail-card__dot--filled' : ''}"></span>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.className = 'cat-detail-overlay';
  overlay.innerHTML = `
    <div class="cat-detail-card ${isComplete ? 'cat-detail-card--complete' : ''}">
      <div class="cat-detail-card__badge">${badge}</div>
      <img src="${getCatImage(catId)}" alt="${name}" class="cat-detail-card__img">
      <div class="cat-detail-card__name">${name}</div>
      ${trait ? `<div class="cat-detail-card__trait">${trait}</div>` : ''}
      <div class="cat-detail-card__dots">${dots}</div>
      <div class="cat-detail-card__sub">${sub}</div>
      <button id="cat-detail-close" class="tds-btn tds-btn-light tds-btn-md tds-btn-block">닫기</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('cat-detail-close').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
}
