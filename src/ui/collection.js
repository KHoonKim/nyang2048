import { navigate } from '../core/router.js';
import { getCollection, getCollectionCount } from '../game/score.js';
import { ALL_CATS_ORDERED, CAT_NAMES, getCatImage } from '../game/stages.js';

export function renderCollection() {
  const app = document.getElementById('app');
  const collection = getCollection();
  const count = getCollectionCount();

  // Group by stage
  const sections = [
    { key: 'common', label: '공통 (2, 4)' },
    { key: 1, label: 'Stage 1 (3×3)' },
    { key: 2, label: 'Stage 2 (4×4)' },
    { key: 3, label: 'Stage 3 (5×5)' },
    { key: 4, label: 'Stage 4 (6×6)' },
    { key: 5, label: 'Stage 5 (8×8)' },
    { key: 'infinite', label: '무한모드' },
  ];

  const sectionsHtml = sections.map(sec => {
    const cats = ALL_CATS_ORDERED.filter(cat => cat.stage === sec.key);
    const itemsHtml = cats.map(cat => {
      const collected = collection.has(cat.id);
      const name = CAT_NAMES[cat.id] || cat.id;
      return `
        <button class="collection-item ${collected ? '' : 'collection-item--locked'}"
          data-cat-id="${cat.id}" data-collected="${collected}">
          ${collected
            ? `<img class="collection-item__img" src="${getCatImage(cat.id)}" alt="${name}">`
            : `<div class="collection-item__placeholder">❓</div>`
          }
          <span class="collection-item__name">${collected ? name : '???'}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="collection-section">
        <div class="collection-section__title">${sec.label}</div>
        <div class="collection-grid">${itemsHtml}</div>
      </div>
    `;
  }).join('');

  app.innerHTML = `
    <div class="collection-screen">
      <div class="collection-header">
        <button class="collection-back-btn" id="back-btn">←</button>
        <div class="collection-title">고양이 도감</div>
        <div class="collection-count">${count} / 42</div>
      </div>
      <div class="collection-body">
        ${sectionsHtml}
      </div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('home'));

  // Cat detail popup on tap
  app.querySelectorAll('.collection-item[data-collected="true"]').forEach(item => {
    item.addEventListener('click', () => {
      const catId = item.dataset.catId;
      showCatDetail(catId);
    });
  });
}

function showCatDetail(catId) {
  const name = CAT_NAMES[catId] || catId;
  const overlay = document.createElement('div');
  overlay.className = 'cat-detail-overlay';
  overlay.innerHTML = `
    <div class="cat-detail-card">
      <img src="${getCatImage(catId)}" alt="${name}">
      <div class="cat-detail-card__name">${name}</div>
      <div class="cat-detail-card__stage">냥2048 컬렉션</div>
      <button id="cat-detail-close" class="tds-btn tds-btn-light tds-btn-md tds-btn-block" style="margin-top:8px;">닫기</button>
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
