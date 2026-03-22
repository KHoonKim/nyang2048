import { navigate } from '../core/router.js';
import { getCollection, getCollectionCount, getCatCount, COLLECTION_MAX, DEBUG_MODE } from '../game/score.js';
import { getDialogue } from '../game/catDialogues.js';
import { ALL_CATS_ORDERED, CAT_NAMES, CAT_TRAITS, CAT_DESCRIPTIONS, getCatImage, CAT_RARITY } from '../game/stages.js';

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
    const trait = CAT_TRAITS[cat.id] || '';
    const lvClass = !found ? 'locked' : isComplete ? 'complete' : `lv${catCount}`;
    const rarity = CAT_RARITY[cat.id] || 'common';
    const rarityLabels = { common: '', rare: '레어', epic: '슈퍼레어', legendary: '레전드' };
    return `
      <button class="cat-card cat-card--${lvClass} cat-card--${rarity}"
        data-cat-id="${cat.id}" data-collected="${found}" ${!found ? 'disabled' : ''}
        data-rarity-label="${rarityLabels[rarity] || ''}">
        ${found ? `<span class="cat-card__badge">${['', '첫만남', '친해지기', '집사되기'][catCount] || `${catCount}/${COLLECTION_MAX}`}</span>` : ''}
        <img src="${getCatImage(cat.id)}"
          alt="${name}"
          class="cat-card__img" />
        <div class="cat-card__name">${found ? name : '???'}</div>
        <div class="cat-card__trait">${found ? trait : '???'}</div>
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
        <button class="collection-back-btn" id="back-btn" aria-label="뒤로 가기"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
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
  const description = CAT_DESCRIPTIONS[catId] || '';
  const rarity = CAT_RARITY[catId] || 'common';
  const rarityLabels = { common: '', rare: '레어', epic: '슈퍼레어', legendary: '레전드' };
  const rarityColors = { common: '', rare: '#2196F3', epic: '#9C27B0', legendary: '#FFD700' };
  const rarityLabel = rarityLabels[rarity];

  const DISCOVERY = ['', '첫만남', '친해지기', '집사되기'];
  const badge = DISCOVERY[count] || (isComplete ? DISCOVERY[3] : `${count}번 발견`);
  const dialogue = getDialogue(catId, count);
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
      ${rarityLabel ? `<div class="cat-detail-card__rarity" style="color:${rarityColors[rarity]}">${rarityLabel}</div>` : ''}
      ${trait ? `<div class="cat-detail-card__trait">${trait}</div>` : ''}
      <div class="cat-detail-card__dots">${dots}</div>
      ${description ? `<div class="cat-detail-card__desc">${description}</div>` : ''}
      ${dialogue ? `
        <div class="cat-speech-bubble visible">
          <div class="cat-speech-bubble__label">${dialogue.label}</div>
          <div class="cat-speech-bubble__text">"${dialogue.text}"</div>
        </div>
      ` : ''}
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
