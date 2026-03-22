# Ads & Anonymous UserKey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AIT banner/interstitial/rewarded ads and anonymous user key (getUserKeyForGame) to nyang2048 — no server required.

**Architecture:** Upgrade `ait.js` to full focus-cat-level ad support (TossAds SDK for banners, AdMob bridge for interstitial/rewarded) with placeholder IDs. Interstitial fires on 2nd+ game per day (localStorage counter). Undo uses a 3-charge system recharged by interstitial ad. Ad containers placed in home, collection, result screens.

**Tech Stack:** `@apps-in-toss/web-framework` (TossAds), vanilla JS, localStorage, existing AIT bridge protocol

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/core/ait.js` | Modify | Add TossAds banner, interstitial/rewarded ad, getUserKeyForGame, daily game counter helpers |
| `src/ui/home.js` | Modify | Add banner ad container at bottom |
| `src/ui/collection.js` | Modify | Insert inline banner after 4th card + image banner at bottom |
| `src/ui/result.js` | Modify | Add image banner at bottom |
| `src/ui/play.js` | Modify | Undo 3-charge system + interstitial before replay/restart |
| `src/styles/main.css` | Modify | Ad container styles (banner placeholder, image banner) |

---

## Task 1: Upgrade `ait.js` — TossAds + interstitial/rewarded + userKey

**Files:**
- Modify: `src/core/ait.js`

- [ ] **Step 1: Replace entire `ait.js` with upgraded version**

Full replacement — add `TossAds` import, placeholder ad IDs, `getUserKeyForGame`, `loadBannerAd`, `destroyBannerAd`, `preloadAd`, `showAd`. Remove nothing that was there (haptic, log, init stay). No server calls anywhere.

```js
// ===== AIT BRIDGE (nyang2048) =====

import { TossAds } from '@apps-in-toss/web-framework';

const CONFIG = {
  APP_NAME: 'nyang2048',
  AD_BANNER_ID: 'PLACEHOLDER_BANNER',
  AD_IMAGE_BANNER_ID: 'PLACEHOLDER_IMAGE_BANNER',
  AD_INTERSTITIAL_ID: 'PLACEHOLDER_INTERSTITIAL',
  AD_REWARDED_ID: 'PLACEHOLDER_REWARDED',
};

if (typeof window !== 'undefined' && !window.__GRANITE_NATIVE_EMITTER) {
  const _evts = {};
  window.__GRANITE_NATIVE_EMITTER = {
    emit(e, d) { (_evts[e] || []).forEach(cb => cb(d)); },
    on(e, cb) {
      if (!_evts[e]) _evts[e] = [];
      _evts[e].push(cb);
      return () => { _evts[e] = (_evts[e] || []).filter(i => i !== cb); };
    }
  };
}

window.AIT = (() => {
  const _bridge = (typeof window !== 'undefined') ? (window.__granite__ || window.__ait__) : null;
  const isToss = (typeof window !== 'undefined') && !!(window.ReactNativeWebView || _bridge) || (typeof navigator !== 'undefined' && navigator.userAgent.includes('TossApp'));
  let _userHash = null;
  let _adLoaded = { interstitial: false, rewarded: false };

  // ── Native Bridge Helpers ──
  function _bridgeCall(method, args = []) {
    return new Promise((resolve, reject) => {
      const rnwv = typeof window !== 'undefined' && window.ReactNativeWebView;
      if (!rnwv) { reject(new Error('ReactNativeWebView not available')); return; }
      const emitter = window.__GRANITE_NATIVE_EMITTER;
      if (!emitter) { reject(new Error('__GRANITE_NATIVE_EMITTER not available')); return; }
      const eventId = Math.random().toString(36).slice(2);
      const r1 = emitter.on(`${method}/resolve/${eventId}`, d => { r1(); r2(); resolve(d); });
      const r2 = emitter.on(`${method}/reject/${eventId}`, e => { r1(); r2(); reject(e); });
      rnwv.postMessage(JSON.stringify({ type: 'method', functionName: method, eventId, args }));
    });
  }

  function _bridgeEvent(method, options) {
    const rnwv = typeof window !== 'undefined' && window.ReactNativeWebView;
    if (!rnwv) return () => {};
    const emitter = window.__GRANITE_NATIVE_EMITTER;
    if (!emitter) return () => {};
    const eventId = Math.random().toString(36).slice(2);
    const removes = [
      emitter.on(`${method}/onEvent/${eventId}`, d => options.onEvent && options.onEvent(d)),
      emitter.on(`${method}/onError/${eventId}`, e => options.onError && options.onError(e)),
    ];
    rnwv.postMessage(JSON.stringify({ type: 'addEventListener', functionName: method, eventId, args: options.options }));
    return () => {
      rnwv.postMessage(JSON.stringify({ type: 'removeEventListener', functionName: method, eventId }));
      removes.forEach(r => r && r());
    };
  }

  // ── User Key (anonymous, no server) ──
  async function getUserHash() {
    if (_userHash) return _userHash;
    if (!isToss) {
      _userHash = 'web_' + (localStorage.getItem('nyang-uid') || (() => {
        const id = crypto.randomUUID();
        localStorage.setItem('nyang-uid', id);
        return id;
      })());
      return _userHash;
    }
    try {
      const result = await Promise.race([
        _bridgeCall('getUserKeyForGame'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
      if (result && result.type === 'HASH') { _userHash = result.hash; return _userHash; }
    } catch (e) {
      console.warn('AIT getUserKeyForGame failed:', e);
    }
    const stored = localStorage.getItem('nyang-uid');
    if (stored) { _userHash = stored; return _userHash; }
    _userHash = 'toss_anonymous_' + Math.random().toString(36).slice(2);
    localStorage.setItem('nyang-uid', _userHash);
    return _userHash;
  }

  // ── Daily Game Counter ──
  function getTodayGameCount() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      const stored = JSON.parse(localStorage.getItem('nyang-game-count') || '{}');
      return stored.date === today ? (stored.count || 0) : 0;
    } catch { return 0; }
  }

  function incrementTodayGameCount() {
    const today = new Date().toISOString().slice(0, 10);
    const count = getTodayGameCount() + 1;
    localStorage.setItem('nyang-game-count', JSON.stringify({ date: today, count }));
    return count;
  }

  // ── Interstitial / Rewarded Ads ──
  const _preloadRetryTimers = {};

  function preloadAd(type, _retryCount = 0) {
    if (!isToss) return;
    const id = type === 'rewarded' ? CONFIG.AD_REWARDED_ID : CONFIG.AD_INTERSTITIAL_ID;
    const handleEvent = (e) => {
      const t = typeof e === 'string' ? e : e?.type;
      if (t === 'loaded' || t === 'adLoaded') {
        _adLoaded[type] = true;
        if (_preloadRetryTimers[type]) { clearTimeout(_preloadRetryTimers[type]); _preloadRetryTimers[type] = null; }
      }
    };
    const handleError = () => {
      _adLoaded[type] = false;
      if (_retryCount < 3) {
        const delay = (_retryCount + 1) * 5000;
        _preloadRetryTimers[type] = setTimeout(() => preloadAd(type, _retryCount + 1), delay);
      }
    };
    try {
      if (_bridge && _bridge.loadAppsInTossAdMob) {
        _bridge.loadAppsInTossAdMob({ options: { adGroupId: id }, onEvent: handleEvent, onError: handleError });
      } else {
        _bridgeEvent('loadAppsInTossAdMob', { options: { adGroupId: id }, onEvent: handleEvent, onError: handleError });
      }
    } catch (e) { console.warn('AIT ad preload failed:', e); }
  }

  async function showAd(type) {
    if (!isToss) { console.log(`[Mock] ${type} ad shown`); return { success: true, mock: true }; }
    if (!_adLoaded[type]) {
      preloadAd(type);
      await new Promise(r => setTimeout(r, 2000));
    }
    const id = type === 'rewarded' ? CONFIG.AD_REWARDED_ID : CONFIG.AD_INTERSTITIAL_ID;
    const timeout = type === 'rewarded' ? 120000 : 30000;
    return new Promise((resolve) => {
      let resolved = false;
      const done = (result) => { if (resolved) return; resolved = true; resolve(result); };
      const handleEvent = (event) => {
        const evtType = typeof event === 'string' ? event : event?.type;
        if (evtType === 'userEarnedReward' || evtType === 'dismissed' || evtType === 'adDismissed') {
          _adLoaded[type] = false;
          preloadAd(type);
          done({ success: true, event: evtType });
        }
      };
      const handleError = (err) => { done({ success: false, error: err }); };
      try {
        if (_bridge && _bridge.showAppsInTossAdMob) {
          _bridge.showAppsInTossAdMob({ options: { adGroupId: id }, onEvent: handleEvent, onError: handleError });
        } else {
          _bridgeEvent('showAppsInTossAdMob', { options: { adGroupId: id }, onEvent: handleEvent, onError: handleError });
        }
      } catch (e) { done({ success: false, error: e }); }
      setTimeout(() => done({ success: false, error: 'timeout' }), timeout);
    });
  }

  // ── Banner Ad (TossAds SDK) ──
  let _tossAdsInitialized = false;
  let _tossAdsInitPromise = null;
  const _bannerHandles = new Map();
  const _bannerRetryTimers = {};

  function _initTossAds() {
    if (_tossAdsInitialized) return Promise.resolve();
    if (_tossAdsInitPromise) return _tossAdsInitPromise;
    if (!TossAds.initialize.isSupported()) {
      return Promise.reject(new Error('TossAds not supported'));
    }
    _tossAdsInitPromise = new Promise((resolve, reject) => {
      TossAds.initialize({
        callbacks: {
          onInitialized: () => { _tossAdsInitialized = true; resolve(); },
          onInitializationFailed: (error) => { _tossAdsInitPromise = null; reject(error); },
        },
      });
    });
    return _tossAdsInitPromise;
  }

  function destroyBannerAd(containerId) {
    if (_bannerRetryTimers[containerId]) { clearTimeout(_bannerRetryTimers[containerId]); _bannerRetryTimers[containerId] = null; }
    const handle = _bannerHandles.get(containerId);
    if (handle) { try { handle.destroy(); } catch(e) {} _bannerHandles.delete(containerId); }
  }

  function loadBannerAd(containerId, opts = {}) {
    if (!isToss) {
      const el = document.getElementById(containerId);
      if (el) {
        el.style.cssText += ';background:var(--tds-grey-200,#f2f4f6);display:flex;align-items:center;justify-content:center;color:var(--tds-grey-500,#8b95a1);font-size:12px;min-height:60px';
        el.textContent = '광고 영역';
      }
      return;
    }
    const el = document.getElementById(containerId);
    if (!el) return;
    if (_bannerHandles.has(containerId)) {
      if (el.children.length === 0) _bannerHandles.delete(containerId);
      else return;
    }
    const adGroupId = opts.spaceId || (opts.image ? CONFIG.AD_IMAGE_BANNER_ID : CONFIG.AD_BANNER_ID);
    const theme = opts.theme || 'light';
    const tone = opts.tone || 'blackAndWhite';
    const variant = opts.variant || 'expanded';
    const retryCount = opts._retryCount || 0;

    const retryBanner = () => {
      if (retryCount < 3 && document.getElementById(containerId)) {
        const delay = (retryCount + 1) * 10000;
        _bannerRetryTimers[containerId] = setTimeout(() => {
          _bannerHandles.delete(containerId);
          loadBannerAd(containerId, { ...opts, _retryCount: retryCount + 1 });
        }, delay);
      }
    };

    _initTossAds().then(() => {
      if (!document.getElementById(containerId)) return;
      const handle = TossAds.attachBanner(adGroupId, el, {
        theme, tone, variant,
        callbacks: {
          onAdRendered: () => { if (_bannerRetryTimers[containerId]) { clearTimeout(_bannerRetryTimers[containerId]); _bannerRetryTimers[containerId] = null; } },
          onAdFailedToRender: () => retryBanner(),
          onNoFill: () => retryBanner(),
        },
      });
      _bannerHandles.set(containerId, handle);
    }).catch(() => retryBanner());
  }

  // ── Haptic ──
  function haptic(type = 'light') {
    if (!isToss) return;
    try { _bridgeCall('generateHapticFeedback', [{ type }]); } catch (e) {}
  }

  // ── Event Log ──
  async function log(name, params = {}) {
    if (!isToss) { console.log(`[AIT Log] ${name}`, params); return; }
    try { await _bridgeCall('eventLog', [{ log_name: name, params }]); } catch (e) {}
  }

  // ── Init ──
  async function init() {
    getUserHash();
    if (isToss) {
      try { await _initTossAds(); } catch (e) { console.warn('[AIT] TossAds init failed:', e); }
      preloadAd('interstitial');
      log('app_open', { version: 'nyang2048-v1' });
    }
  }

  return {
    isToss, CONFIG,
    getUserHash,
    getTodayGameCount, incrementTodayGameCount,
    showAd, preloadAd,
    loadBannerAd, destroyBannerAd,
    haptic, log, init,
  };
})();

AIT.init();
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/daniel/Documents/nyang2048 && npx vite build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/core/ait.js
git commit -m "feat: upgrade ait.js with TossAds banner, interstitial/rewarded, anonymous userKey"
```

---

## Task 2: CSS — Ad container styles

**Files:**
- Modify: `src/styles/main.css`

- [ ] **Step 1: Append ad container styles to main.css**

Add at the end of the file:

```css
/* ===== Ad Containers ===== */
.ad-banner-container {
  width: 100%;
  min-height: 60px;
  overflow: hidden;
}

.ad-banner-container--home {
  padding: 8px 16px 16px;
}

.ad-banner-container--collection-inline {
  /* spans both columns in the 2-col grid */
  grid-column: 1 / -1;
  padding: 4px 0;
}

.ad-banner-container--bottom {
  padding: 8px 16px 24px;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/styles/main.css
git commit -m "feat: add ad container CSS styles"
```

---

## Task 3: Home screen — banner at bottom

**Files:**
- Modify: `src/ui/home.js`

- [ ] **Step 1: Add banner container to home HTML**

In `renderHome()`, add a banner container div just before the closing `</div>` of `.home-screen`:

```js
// Replace:
  app.innerHTML = `
    <div class="home-screen">
      <div class="home-header">
        ...
      </div>
      <div class="home-stages">
        ${stageCards}
        ${infiniteCard}
      </div>
    </div>
  `;

// With:
  app.innerHTML = `
    <div class="home-screen">
      <div class="home-header">
        ...
      </div>
      <div class="home-stages">
        ${stageCards}
        ${infiniteCard}
      </div>
      <div class="ad-banner-container ad-banner-container--home" id="home-banner-ad"></div>
    </div>
  `;
```

- [ ] **Step 2: Load banner ad after render**

After the `app.innerHTML = ...` block and before the event listener setup, add:

```js
  // Load banner ad
  if (window.AIT) AIT.loadBannerAd('home-banner-ad');
```

- [ ] **Step 3: Verify in browser (dev mode)**

```bash
cd /Users/daniel/Documents/nyang2048 && npx vite --host 2>&1 &
```
Open browser → home screen should show "광고 영역" placeholder at bottom.

- [ ] **Step 4: Commit**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/home.js
git commit -m "feat: add banner ad to home screen bottom"
```

---

## Task 4: Collection screen — inline banner (row 2) + image banner (bottom)

**Files:**
- Modify: `src/ui/collection.js`

- [ ] **Step 1: Insert inline banner ad after 4th card in cardsHtml**

The collection grid is 2 columns, so after 4 items = after 2 rows.

Replace the `cardsHtml` generation:

```js
// Replace:
  const cardsHtml = ALL_CATS_ORDERED.map(cat => {
    ...
  }).join('');

// With:
  const cardsItems = ALL_CATS_ORDERED.map((cat, idx) => {
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

  // Insert inline banner ad after 4th item (row 2, 2-col grid)
  const AD_INSERT_INDEX = 4;
  const inlineBannerHtml = `<div class="ad-banner-container ad-banner-container--collection-inline" id="collection-inline-ad"></div>`;
  if (cardsItems.length > AD_INSERT_INDEX) {
    cardsItems.splice(AD_INSERT_INDEX, 0, inlineBannerHtml);
  }
  const cardsHtml = cardsItems.join('');
```

- [ ] **Step 2: Add image banner at bottom of collection screen**

In `app.innerHTML = ...`, after `.collection-body`, add:

```js
  app.innerHTML = `
    <div class="collection-screen">
      <div class="collection-header">
        ...
      </div>
      <div class="collection-body">
        <div class="collection-grid">
          ${cardsHtml}
        </div>
      </div>
      <div class="ad-banner-container ad-banner-container--bottom" id="collection-bottom-ad"></div>
    </div>
  `;
```

- [ ] **Step 3: Load both ads after render**

After `app.innerHTML = ...` and before event listener setup:

```js
  // Load ads
  if (window.AIT) {
    AIT.loadBannerAd('collection-inline-ad');
    AIT.loadBannerAd('collection-bottom-ad', { image: true });
  }
```

- [ ] **Step 4: Commit**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/collection.js
git commit -m "feat: add inline banner and image banner ads to collection screen"
```

---

## Task 5: Result screen — image banner at bottom

**Files:**
- Modify: `src/ui/result.js`

- [ ] **Step 1: Add image banner container to both clear and game-over HTML**

In the clear state `app.innerHTML = ...`, add before closing `</div>` of `.result-screen`:

```js
      <div class="ad-banner-container ad-banner-container--bottom" id="result-bottom-ad"></div>
```

Do the same for the game-over state HTML.

- [ ] **Step 2: Load image banner after render**

Add after each `app.innerHTML = ...` block (both clear and game-over):

```js
  if (window.AIT) AIT.loadBannerAd('result-bottom-ad', { image: true });
```

Since both branches set `id="result-bottom-ad"`, a single helper function works:

```js
  function loadResultAd() {
    if (window.AIT) AIT.loadBannerAd('result-bottom-ad', { image: true });
  }
```

Call `loadResultAd()` after each branch's `app.innerHTML` assignment.

- [ ] **Step 3: Commit**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/result.js
git commit -m "feat: add image banner ad to result screen bottom"
```

---

## Task 6: Play screen — undo 3-charge system + interstitial gate

**Files:**
- Modify: `src/ui/play.js`

### 6a: Undo charge system

- [ ] **Step 1: Add undo charge helpers at top of `renderPlay()`**

Add right after the function signature, before existing variable declarations:

```js
  // Undo charge system (3 charges, refill via interstitial)
  function getUndoCharges() {
    return parseInt(localStorage.getItem('nyang-undo-charges') || '3', 10);
  }
  function setUndoCharges(n) {
    localStorage.setItem('nyang-undo-charges', String(Math.max(0, n)));
  }
  // Initialize charges on first ever use
  if (localStorage.getItem('nyang-undo-charges') === null) setUndoCharges(3);
```

- [ ] **Step 2: Update undo button label to show charge count**

In `renderUI()`, replace the undo button HTML:

```js
// Replace:
          <button class="play-action-card" id="undo-btn" aria-label="되돌리기">
            <span class="play-action-card__icon">${ICON.undo}</span>
            <span class="play-action-card__label">한번 무르기</span>
          </button>

// With:
          <button class="play-action-card" id="undo-btn" aria-label="되돌리기">
            <span class="play-action-card__icon">${ICON.undo}</span>
            <span class="play-action-card__label">무르기 ${['○','①','②','③'][Math.min(getUndoCharges(), 3)]}</span>
          </button>
```

Add a helper to keep the label in sync after charge changes:

```js
  function updateUndoLabel() {
    const btn = document.getElementById('undo-btn');
    if (!btn) return;
    const charges = getUndoCharges();
    const chargeSymbols = ['○', '①', '②', '③'];
    btn.querySelector('.play-action-card__label').textContent = `무르기 ${chargeSymbols[Math.min(charges, 3)]}`;
  }
```

- [ ] **Step 3: Replace undo button click handler**

Replace the existing undo click handler:

```js
// Replace existing undo handler:
  document.getElementById('undo-btn').addEventListener('click', async () => {
    if (!snapshot || splashShowing) return;
    usedUndo = true;
    board.restoreSnapshot(snapshot);
    currentScore = board.score;
    snapshot = null;
    doRender();
    saveCurrentBoard();
  });

// With:
  document.getElementById('undo-btn').addEventListener('click', async () => {
    if (!snapshot || splashShowing) return;

    const charges = getUndoCharges();

    if (charges > 0) {
      // Use a charge
      setUndoCharges(charges - 1);
      usedUndo = true;
      board.restoreSnapshot(snapshot);
      currentScore = board.score;
      snapshot = null;
      doRender();
      saveCurrentBoard();
      updateUndoLabel();
    } else {
      // No charges — show interstitial to refill
      if (window.AIT) {
        const result = await AIT.showAd('interstitial').catch(() => ({ success: false }));
        if (result.success) {
          setUndoCharges(3);
          updateUndoLabel();
          showToast('무르기 3회 충전됐어요!');
          // Execute the undo immediately after recharge
          usedUndo = true;
          board.restoreSnapshot(snapshot);
          currentScore = board.score;
          snapshot = null;
          doRender();
          saveCurrentBoard();
          updateUndoLabel();
        } else {
          showToast('광고를 불러올 수 없어요.');
        }
      }
    }
  });
```

### 6b: Daily interstitial gate for replay/restart

- [ ] **Step 4: Add interstitial gate helper inside `renderPlay()`**

Add after the undo charge helpers:

```js
  // Show interstitial if user has already played 1+ game today
  async function maybeShowInterstitial() {
    const count = window.AIT ? AIT.getTodayGameCount() : 0;
    if (count >= 1 && window.AIT && AIT.isToss) {
      await AIT.showAd('interstitial').catch(() => {});
    }
  }
```

- [ ] **Step 5: Increment game count on play screen mount**

Add right after `renderUI(0);` call:

```js
  // Track game count for interstitial logic
  if (window.AIT) AIT.incrementTodayGameCount();
```

- [ ] **Step 6: Gate replay in result screen's restart button (play.js)**

The restart button inside `showRestartConfirm()` — wrap navigation with interstitial:

```js
// Replace in showRestartConfirm():
    overlay.querySelector('.exit-confirm-yes').addEventListener('click', async () => {
      overlay.remove();
      clearBoard(stage.boardKey);
      board = new Board(stage.rows, stage.cols);
      ...
      startTimer();
    });

// With:
    overlay.querySelector('.exit-confirm-yes').addEventListener('click', async () => {
      overlay.remove();
      await maybeShowInterstitial();
      clearBoard(stage.boardKey);
      // Note: incrementTodayGameCount() is NOT called here — play.js mount (Step 5) handles it
      board = new Board(stage.rows, stage.cols);
      for (let i = 0; i < stage.initialTiles; i++) board.addRandomTile();
      currentScore = 0;
      snapshot = null;
      goalReached = false;
      stopTimer();
      elapsedSeconds = 0;
      renderer.destroy();
      renderer = new Renderer(boardContainer, stage.rows, stage.cols, stageId);
      requestAnimationFrame(() => doRender());
      startTimer();
    });
```

- [ ] **Step 7: Gate replay in result screen (result.js)**

In `result.js`, the "다시 플레이" button handler (both clear and game-over states) should show interstitial before navigating. Since result.js doesn't have access to `maybeShowInterstitial`, implement inline:

```js
// In clear state, replace replay-btn handler:
    document.getElementById('replay-btn').addEventListener('click', async () => {
      if (window.AIT) {
        const count = AIT.getTodayGameCount();
        if (count >= 1 && AIT.isToss) await AIT.showAd('interstitial').catch(() => {});
      }
      const p = isInfinite ? `infinite=${infiniteSize}` : `stage=${stageId}`;
      navigate(`play?${p}`);
    });

// In game-over state, replace restart-btn handler:
    document.getElementById('restart-btn').addEventListener('click', async () => {
      if (window.AIT) {
        const count = AIT.getTodayGameCount();
        if (count >= 1 && AIT.isToss) await AIT.showAd('interstitial').catch(() => {});
      }
      const p = isInfinite ? `infinite=${infiniteSize}` : `stage=${stageId}`;
      navigate(`play?${p}`);
    });
```

- [ ] **Step 8: Verify build**

```bash
cd /Users/daniel/Documents/nyang2048 && npx vite build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 9: Commit**

```bash
cd /Users/daniel/Documents/nyang2048
git add src/ui/play.js src/ui/result.js
git commit -m "feat: undo 3-charge system with interstitial recharge, daily interstitial gate for replay/restart"
```

---

## Task 7: Final verification

- [ ] **Step 1: Full build check**

```bash
cd /Users/daniel/Documents/nyang2048 && npx vite build 2>&1
```
Expected: build succeeds, no TypeScript/import errors

- [ ] **Step 2: Manual test checklist (browser dev mode)**

```
1. 홈 화면 → 하단 "광고 영역" 표시 확인
2. 고양이 도감 → 4번째 카드 다음 인라인 배너, 하단 이미지 배너 표시 확인
3. 결과 화면 (클리어/게임오버) → 하단 이미지 배너 표시 확인
4. 무르기 버튼 → "무르기 ③" 표시 → 3번 탭하면 "무르기 ○" 표시 확인
5. 무르기 0회에서 탭 → 콘솔에 "[Mock] interstitial ad shown" 출력 후 3회 재충전 확인
6. 첫 게임 시작 → 결과 화면 → 다시 플레이 → 콘솔에 "[Mock] interstitial ad shown" 출력 확인
7. 재시작 버튼 → 콘솔에 "[Mock] interstitial ad shown" 출력 확인
```

- [ ] **Step 3: Final commit**

```bash
cd /Users/daniel/Documents/nyang2048
git add -A
git status  # verify nothing unexpected
git commit -m "feat: complete ads and anonymous userKey integration for nyang2048"
```

---

## Ad ID Placeholder 교체 (광고 ID 발급 후)

광고 ID가 나오면 `src/core/ait.js` 상단 CONFIG만 수정:

```js
const CONFIG = {
  APP_NAME: 'nyang2048',
  AD_BANNER_ID: 'ait.v2.live.XXXXXXXXXXXXXXXX',       // 배너
  AD_IMAGE_BANNER_ID: 'ait.v2.live.YYYYYYYYYYYYYYYY', // 이미지 배너
  AD_INTERSTITIAL_ID: 'ait.v2.live.ZZZZZZZZZZZZZZZZ', // 전면
  AD_REWARDED_ID: 'ait.v2.live.WWWWWWWWWWWWWWWW',    // 보상형 (undo)
};
```
