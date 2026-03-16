const routes = {};
let currentCleanup = null;

export function registerRoute(hash, renderFn) {
  routes[hash] = renderFn;
}

export function navigate(hash) {
  window.location.hash = '#' + hash;
}

export async function handleRoute() {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  window.scrollTo(0, 0);

  const raw = window.location.hash.slice(1) || 'home';
  const [routeName] = raw.split('?');
  const route = routes[routeName];
  if (route) {
    currentCleanup = await route() || null;
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

export function getHashParams() {
  const raw = window.location.hash.slice(1) || '';
  const idx = raw.indexOf('?');
  if (idx === -1) return {};
  const qs = raw.slice(idx + 1);
  const params = {};
  qs.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return params;
}
