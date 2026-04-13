(() => {
  const STORAGE_VERSION = 'v2';
  const LEGACY_KEYS = {
    favorites: ['favorites'],
    recentPlayed: ['recentPlayed'],
    plays: ['plays'],
    brokenGames: ['brokenGames'],
    lastPlayed: ['lastPlayed'],
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function firstExisting(keys, fallback) {
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw !== null) return raw;
    }
    return fallback;
  }

  function migrateSiteData() {
    const marker = localStorage.getItem('skeezersArcade.storageVersion');
    const migrated = {
      favorites: readJson('skeezersArcade.favorites', readJson('favorites', [])),
      recentPlayed: readJson('skeezersArcade.recentPlayed', readJson('recentPlayed', [])),
      plays: readJson('skeezersArcade.plays', readJson('plays', {})),
      brokenGames: readJson('skeezersArcade.brokenGames', readJson('brokenGames', {})),
      lastPlayed: localStorage.getItem('skeezersArcade.lastPlayed') ?? firstExisting(['lastPlayed'], ''),
    };

    localStorage.setItem('skeezersArcade.favorites', JSON.stringify(migrated.favorites));
    localStorage.setItem('skeezersArcade.recentPlayed', JSON.stringify(migrated.recentPlayed));
    localStorage.setItem('skeezersArcade.plays', JSON.stringify(migrated.plays));
    localStorage.setItem('skeezersArcade.brokenGames', JSON.stringify(migrated.brokenGames));
    localStorage.setItem('skeezersArcade.lastPlayed', migrated.lastPlayed || '');

    if (marker !== STORAGE_VERSION) {
      localStorage.setItem('skeezersArcade.storageVersion', STORAGE_VERSION);
      localStorage.setItem('skeezersArcade.migratedAt', new Date().toISOString());
    }

    return migrated;
  }

  window.SkeezersStorageCompat = {
    migrateSiteData,
    readJson,
  };
})();
