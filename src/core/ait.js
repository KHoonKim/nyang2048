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
