// ===== AIT BRIDGE (nyang2048 — client-only, no server) =====
import { TossAds } from '@apps-in-toss/web-framework';

const CONFIG = {
  APP_NAME: 'nyang2048',
  AD_BANNER_ID: 'ait.v2.live.CHANGE_ME',
  AD_INTERSTITIAL_ID: 'ait.v2.live.CHANGE_ME',
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
  let _adLoaded = { interstitial: false };

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

  const _preloadRetryTimers = {};

  function preloadAd(type = 'interstitial', _retryCount = 0) {
    if (!isToss) return;
    const id = CONFIG.AD_INTERSTITIAL_ID;
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

  async function showAd(type = 'interstitial') {
    if (!isToss) { console.log(`[Mock] ${type} ad shown`); return { success: true, mock: true }; }
    if (!_adLoaded[type]) {
      preloadAd(type);
      await new Promise(r => setTimeout(r, 2000));
    }
    const id = CONFIG.AD_INTERSTITIAL_ID;
    return new Promise((resolve) => {
      let resolved = false;
      const done = (result) => { if (resolved) return; resolved = true; resolve(result); };
      const handleEvent = (event) => {
        const evtType = typeof event === 'string' ? event : event?.type;
        if (evtType === 'dismissed' || evtType === 'adDismissed') {
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
      setTimeout(() => done({ success: false, error: 'timeout' }), 30000);
    });
  }

  let _tossAdsInitialized = false;
  let _tossAdsInitPromise = null;
  const _bannerHandles = new Map();
  const _bannerRetryTimers = {};

  function _initTossAds() {
    if (_tossAdsInitialized) return Promise.resolve();
    if (_tossAdsInitPromise) return _tossAdsInitPromise;
    if (!TossAds.initialize.isSupported()) return Promise.reject(new Error('TossAds not supported'));
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
      if (el) { el.style.cssText += ';background:var(--tds-grey-200,#f2f4f6);display:flex;align-items:center;justify-content:center;color:var(--tds-grey-500,#8b95a1);font-size:12px;min-height:60px'; el.textContent = '광고 영역'; }
      return;
    }
    const el = document.getElementById(containerId);
    if (!el) return;
    if (_bannerHandles.has(containerId)) {
      if (el.children.length === 0) { _bannerHandles.delete(containerId); } else { return; }
    }
    const adGroupId = opts.spaceId || CONFIG.AD_BANNER_ID;
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
        theme: opts.theme || 'light',
        tone: opts.tone || 'blackAndWhite',
        variant: opts.variant || 'expanded',
        callbacks: {
          onAdRendered: () => { if (_bannerRetryTimers[containerId]) { clearTimeout(_bannerRetryTimers[containerId]); _bannerRetryTimers[containerId] = null; } },
          onAdFailedToRender: () => retryBanner(),
          onNoFill: () => retryBanner(),
        },
      });
      _bannerHandles.set(containerId, handle);
    }).catch(() => retryBanner());
  }

  function haptic(type = 'light') {
    if (!isToss) return;
    try { _bridgeCall('generateHapticFeedback', [{ type }]); } catch (e) {}
  }

  async function log(name, params = {}) {
    if (!isToss) { console.log(`[AIT Log] ${name}`, params); return; }
    try { await _bridgeCall('eventLog', [{ log_name: name, params }]); } catch (e) {}
  }

  async function init() {
    if (isToss) {
      try { await _initTossAds(); } catch (e) {}
      preloadAd('interstitial');
      log('app_open', { version: 'nyang2048-v1' });
    }
  }

  return {
    isToss, CONFIG,
    showAd, preloadAd, loadBannerAd, destroyBannerAd,
    haptic, log, init,
  };
})();

AIT.init();
