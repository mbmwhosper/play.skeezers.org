(() => {
  const runtimeConfig = window?.json?.config || {};
  const defaultProxyPath = runtimeConfig.proxyPath || '/service/proxy/';

  function getAppOrigin() {
    if (typeof window === 'undefined' || !window.location) return '';
    return window.location.origin;
  }

  function normalizeBase(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        if (parsed.origin !== getAppOrigin()) return '/service/proxy/';
      } catch {
        return '/service/proxy/';
      }
      return raw.endsWith('/') ? raw : `${raw}/`;
    }
    const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
    return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
  }

  function encodeTarget(url) {
    return encodeURIComponent(String(url || '').trim());
  }

  function resolveProxyUrl(targetUrl, overrideBase) {
    const target = String(targetUrl || '').trim();
    if (!target) return '';
    const base = normalizeBase(overrideBase || defaultProxyPath);
    if (!base) return '';
    return `${base}${encodeTarget(target)}`;
  }

  function getStatus() {
    const enabled = Boolean(runtimeConfig.proxy);
    const base = normalizeBase(defaultProxyPath);
    return {
      enabled,
      base,
      mode: enabled && base ? 'configured' : 'disabled',
      needsSelfHostedBackend: true,
    };
  }

  window.SkeezersProxyEngine = {
    getStatus,
    resolveProxyUrl,
    encodeTarget,
    normalizeBase,
  };
})();
