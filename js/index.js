(() => {
  const catalog = (window.catalogV2?.games?.length
    ? window.catalogV2.games.map((item) => ({
        ...item,
        type: item.type || 'game',
        description: item.description || '',
        tags: item.tags || [],
      }))
    : buildFallbackCatalog((window.json && window.json.games) || {}))
    .filter((item) => !/github\.com\//i.test(String(item.url || '')))
    .sort((a, b) => a.name.localeCompare(b.name));

  const dom = {
    summary: byId('summary'),
    search: byId('search'),
    gameCount: byId('gameCount'),
    gameList: byId('gameList'),
    emptyState: byId('emptyState'),
    randomGame: byId('randomGame'),
    continueGame: byId('continueGame'),
    player: byId('player'),
    frame: byId('gameFrame'),
    frameWrap: byId('frameWrap'),
    backBtn: byId('backBtn'),
    nowPlaying: byId('nowPlaying'),
    aspectRatio: byId('aspectRatio'),
    reportBroken: byId('reportBroken'),
    openExternal: byId('openExternal'),
    detailsModal: byId('detailsModal'),
    detailsContent: byId('detailsContent'),
  };

  const migrated = window.SkeezersStorageCompat?.migrateSiteData?.() || {};
  let favorites = migrated.favorites || readJSON('skeezersArcade.favorites', []);
  let recentPlayed = migrated.recentPlayed || readJSON('skeezersArcade.recentPlayed', []);
  let plays = migrated.plays || readJSON('skeezersArcade.plays', {});
  let broken = migrated.brokenGames || readJSON('skeezersArcade.brokenGames', {});
  let lastPlayed = migrated.lastPlayed ?? localStorage.getItem('skeezersArcade.lastPlayed') ?? '';
  let currentGame = null;

  function byId(id) { return document.getElementById(id); }
  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }
  function slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function buildFallbackCatalog(source) {
    return Object.entries(source).map(([name, data]) => {
      const path = data?.path || '';
      const external = /^https?:\/\//i.test(path);
      const categories = Array.isArray(data?.categories) ? data.categories : [];
      return {
        id: slugify(name), slug: slugify(name), name, path,
        url: external ? path : `games/${path}`,
        sourceType: external ? 'external' : (path.startsWith('flash/') ? 'flash' : 'local'),
        iframeSafe: !external,
        aliases: Array.isArray(data?.aliases) ? data.aliases : [],
        categories,
        genres: categories.map((category) => String(category).toLowerCase()),
        players: { min: 1, max: 1 },
        type: 'game', description: '', tags: [],
      };
    });
  }

  function save() {
    localStorage.setItem('skeezersArcade.favorites', JSON.stringify(favorites));
    localStorage.setItem('skeezersArcade.recentPlayed', JSON.stringify(recentPlayed));
    localStorage.setItem('skeezersArcade.plays', JSON.stringify(plays));
    localStorage.setItem('skeezersArcade.brokenGames', JSON.stringify(broken));
    localStorage.setItem('skeezersArcade.lastPlayed', lastPlayed);
  }

  function getGame(name) { return catalog.find((game) => game.name === name); }
  function getGameBySlug(slug) { return catalog.find((game) => game.slug === slug); }
  function isProxyItem(game) {
    return game?.type === 'proxy' || game?.sourceType === 'proxy' || (game?.genres || []).includes('proxy');
  }
  function getProxyLaunchUrl(game) {
    const targetUrl = String(game?.proxyTargetUrl || game?.launchUrl || game?.targetUrl || '').trim();
    if (!targetUrl) return '';
    try {
      const hostname = new URL(targetUrl).hostname.toLowerCase();
      if (/^(?:www\.)?example\.(?:com|net|org)$/.test(hostname)) return '';
    } catch { return ''; }
    return window.SkeezersProxyEngine?.resolveProxyUrl?.(targetUrl, game?.proxyPath) || '';
  }
  function isLaunchable(game) {
    if (!game) return false;
    if (isProxyItem(game)) return Boolean(getProxyLaunchUrl(game));
    return game.type === 'game'
      && game.sourceType !== 'external'
      && game.sourceType !== 'proxy'
      && game.sourceType !== 'app'
      && game.sourceType !== 'emulator'
      && !game.externalHostingStatus;
  }
  function getResumeCandidate() {
    const last = getGame(lastPlayed);
    if (last && isLaunchable(last)) return last;
    return recentPlayed.map(getGame).find((game) => isLaunchable(game)) || null;
  }
  function searchableText(game) {
    return [game.name, ...(game.aliases || []), ...(game.categories || []), ...(game.genres || []), ...(game.tags || [])].join(' ').toLowerCase();
  }
  function visibleGames() {
    const query = dom.search.value.trim().toLowerCase();
    return query ? catalog.filter((game) => searchableText(game).includes(query)) : catalog;
  }
  function metadata(game) {
    const traits = [game.type || 'game', game.sourceType || 'local'];
    const launches = plays[game.name] || 0;
    if (launches) traits.push(`${launches} ${launches === 1 ? 'launch' : 'launches'}`);
    if (broken[game.name]) traits.push('reported');
    return traits.join(' · ');
  }

  function renderList() {
    const games = visibleGames();
    dom.gameList.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const game of games) {
      const launchable = isLaunchable(game);
      const row = document.createElement('div');
      row.className = 'game-row';
      row.innerHTML = `
        <button class="game-main" type="button" data-open="${escapeHtml(game.name)}">
          <span class="game-title">${escapeHtml(game.name)}</span>
          <span class="game-meta">${escapeHtml(metadata(game))}</span>
        </button>
        <span class="game-actions">
          <button class="launch-label ${launchable ? '' : 'details-only'}" type="button" data-open="${escapeHtml(game.name)}">${launchable ? 'Play' : 'Details'}</button>
          <button class="favorite ${favorites.includes(game.name) ? 'active' : ''}" type="button" data-favorite="${escapeHtml(game.name)}" aria-label="${favorites.includes(game.name) ? 'Remove' : 'Add'} ${escapeHtml(game.name)} ${favorites.includes(game.name) ? 'from' : 'to'} favorites">★</button>
        </span>`;
      fragment.append(row);
    }
    dom.gameList.append(fragment);
    dom.gameList.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => openGame(getGame(button.dataset.open))));
    dom.gameList.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', () => toggleFavorite(button.dataset.favorite)));
    dom.gameCount.textContent = `${games.length} ${games.length === 1 ? 'item' : 'items'}`;
    dom.emptyState.hidden = games.length !== 0;
    updateResume();
  }

  function toggleFavorite(name) {
    favorites = favorites.includes(name) ? favorites.filter((item) => item !== name) : [name, ...favorites];
    save();
    renderList();
  }
  function trackPlay(game) {
    lastPlayed = game.name;
    plays[game.name] = (plays[game.name] || 0) + 1;
    recentPlayed = [game.name, ...recentPlayed.filter((item) => item !== game.name)].slice(0, 12);
    save();
  }
  function updateResume() {
    const game = getResumeCandidate();
    dom.continueGame.disabled = !game;
    dom.continueGame.textContent = game ? `Resume ${game.name}` : 'Resume last game';
  }

  function openGame(game, updateHash = true) {
    if (!game) return;
    if (!isLaunchable(game)) { openDetails(game, updateHash); return; }
    currentGame = game;
    trackPlay(game);
    dom.player.classList.remove('hidden');
    dom.frame.src = isProxyItem(game) ? getProxyLaunchUrl(game) : game.url;
    dom.nowPlaying.textContent = `${game.name} · ${plays[game.name]} ${plays[game.name] === 1 ? 'launch' : 'launches'}`;
    if (updateHash) history.replaceState(null, '', `#item/${game.slug}`);
    renderList();
  }
  function closePlayer(updateHash = true) {
    dom.player.classList.add('hidden');
    dom.frame.src = 'about:blank';
    currentGame = null;
    if (updateHash && location.hash.startsWith('#item/')) history.replaceState(null, '', '#');
  }

  function openDetails(game, updateHash = true) {
    if (!game) return;
    const external = game.url && game.url !== '#' && /^https?:\/\//i.test(game.url);
    const status = game.externalHostingStatus
      ? (game.externalHostingReason || 'This item needs external hosting before it can launch here.')
      : isProxyItem(game)
        ? 'The proxy engine does not have a real target configured.'
        : 'This item opens outside the embedded player.';
    dom.detailsContent.innerHTML = `
      <span class="detail-kicker">${escapeHtml(game.type || 'game')}</span>
      <h2>${escapeHtml(game.name)}</h2>
      <p>${escapeHtml(game.description || status)}</p>
      <div class="detail-facts">
        <span>${escapeHtml(game.sourceType || 'local')}</span>
        ${(game.genres || []).slice(0, 3).map((genre) => `<span>${escapeHtml(genre)}</span>`).join('')}
      </div>
      <div class="detail-actions">
        ${external && !game.externalHostingStatus ? '<button id="openDetailExternal" type="button">Open directly</button>' : ''}
        <button id="reportDetailBroken" class="quiet" type="button">Report broken</button>
      </div>`;
    byId('openDetailExternal')?.addEventListener('click', () => window.open(game.url, '_blank', 'noopener'));
    byId('reportDetailBroken')?.addEventListener('click', () => {
      broken[game.name] = Date.now();
      save();
      renderList();
      dom.detailsModal.close();
    });
    dom.detailsModal.showModal();
    if (updateHash) history.replaceState(null, '', `#item/${game.slug}`);
  }

  function syncRoute() {
    const compatPath = window.SkeezersRouteCompat?.normalizeLegacyPath?.(location.pathname);
    if (compatPath && location.hash !== compatPath) history.replaceState(null, '', `${location.origin}${location.pathname}${compatPath}`);
    const normalized = window.SkeezersRouteCompat?.normalizeLegacyHash?.(location.hash) || location.hash;
    if (normalized !== location.hash) history.replaceState(null, '', normalized);
    const match = normalized.match(/^#(?:item|game)\/(.+)$/);
    if (match) {
      const game = getGameBySlug(match[1]);
      if (game) openGame(game, false);
      return;
    }
    const legacy = normalized.match(/^#legacy\/(.+)$/);
    if (legacy) {
      const value = decodeURIComponent(legacy[1]);
      const game = getGameBySlug(value) || getGame(value) || catalog.find((item) => item.path === value || item.url === value || item.url === `games/${value}`);
      if (game) openGame(game, false);
    }
  }

  dom.search.addEventListener('input', renderList);
  dom.randomGame.addEventListener('click', () => {
    const games = visibleGames().filter(isLaunchable);
    if (games.length) openGame(games[Math.floor(Math.random() * games.length)]);
  });
  dom.continueGame.addEventListener('click', () => openGame(getResumeCandidate()));
  dom.backBtn.addEventListener('click', () => closePlayer());
  dom.openExternal.addEventListener('click', () => { if (currentGame) window.open(currentGame.url, '_blank', 'noopener'); });
  dom.reportBroken.addEventListener('click', () => {
    if (!currentGame) return;
    broken[currentGame.name] = Date.now();
    save();
    renderList();
  });
  dom.aspectRatio.addEventListener('change', () => {
    dom.frameWrap.classList.remove('ratio-16-9', 'ratio-4-3');
    if (dom.aspectRatio.value === '16:9') dom.frameWrap.classList.add('ratio-16-9');
    if (dom.aspectRatio.value === '4:3') dom.frameWrap.classList.add('ratio-4-3');
  });
  dom.detailsModal.addEventListener('close', () => {
    if (location.hash.startsWith('#item/') && !currentGame) history.replaceState(null, '', '#');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      dom.search.focus();
    }
    if (event.key === 'Escape' && !dom.player.classList.contains('hidden')) closePlayer();
  });
  window.addEventListener('hashchange', syncRoute);

  byId('year').textContent = new Date().getFullYear();
  dom.summary.textContent = `${catalog.length} items`;
  renderList();
  syncRoute();
})();
