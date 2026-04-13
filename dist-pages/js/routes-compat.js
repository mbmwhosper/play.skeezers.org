(() => {
  function normalizeLegacyHash(hash) {
    if (!hash) return '#';
    if (hash.startsWith('#game/')) return hash;
    if (hash.startsWith('#play=')) return `#legacy/${decodeURIComponent(hash.slice(6))}`;
    if (hash.startsWith('#games/')) return `#legacy/${hash.slice(7)}`;
    return hash;
  }

  function normalizeLegacyPath(pathname) {
    const path = pathname.replace(/\/+$/, '');
    if (path === '' || path === '/') return null;
    if (path.startsWith('/games/')) return `#legacy/${path.slice('/games/'.length)}`;
    return null;
  }

  window.SkeezersRouteCompat = {
    normalizeLegacyHash,
    normalizeLegacyPath,
  };
})();
