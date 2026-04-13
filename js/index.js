(() => {
  const catalog = window.catalogV2?.games?.length ? window.catalogV2.games : buildFallbackCatalog((window.json && window.json.games) || {});

  function buildFallbackCatalog(gamesSource) {
    return Object.entries(gamesSource).map(([name, data]) => {
      const path = data?.path || '';
      const isExternal = /^https?:\/\//i.test(path);
      const categories = Array.isArray(data?.categories) ? data.categories : [];
      const lower = name.toLowerCase();
      const genres = [...new Set(categories.map((c) => String(c).toLowerCase()))];
      return {
        id: slugify(name),
        slug: slugify(name),
        name,
        path,
        url: isExternal ? path : `games/${path}`,
        sourceType: isExternal ? 'external' : (path.startsWith('flash/') ? 'flash' : 'local'),
        iframeSafe: !isExternal,
        aliases: Array.isArray(data?.aliases) ? data.aliases : [],
        categories,
        genres,
        features: [],
        players: genres.includes('online') || lower.includes('.io') ? { min: 2, max: 16 } : { min: 1, max: 1 },
        sessionLength: genres.includes('idle') ? 'long' : (genres.includes('arcade') ? 'short' : 'medium'),
        moods: genres.includes('puzzle') ? ['chill'] : ['arcade'],
        difficulty: 'medium',
      };
    });
  }

  function slugify(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const dom = {
    search: byId('search'), category: byId('category'), sort: byId('sort'), modeFilter: byId('modeFilter'), vibeFilter: byId('vibeFilter'),
    iframeSafeOnly: byId('iframeSafeOnly'), favoritesOnly: byId('favoritesOnly'), continueBtn: byId('continueBtn'), randomGame: byId('randomGame'),
    stats: byId('stats'), filterSummary: byId('filterSummary'), spotlights: byId('spotlights'), shelves: byId('shelves'), grid: byId('gamesGrid'), sideNav: byId('sideNav'),
    player: byId('player'), frame: byId('gameFrame'), frameWrap: byId('frameWrap'), aspectRatio: byId('aspectRatio'),
    nowPlaying: byId('nowPlaying'), backBtn: byId('backBtn'), openExternal: byId('openExternal'), reportBroken: byId('reportBroken'),
    detailsModal: byId('detailsModal'), detailsContent: byId('detailsContent'),
    palette: byId('palette'), paletteInput: byId('paletteInput'), paletteList: byId('paletteList'), openPalette: byId('openPalette'),
    heroCatalogCount: byId('heroCatalogCount'), heroVibe: byId('heroVibe'), heroVibeMeta: byId('heroVibeMeta'), heroContinueTitle: byId('heroContinueTitle'), heroContinueMeta: byId('heroContinueMeta'),
    heroRandom: byId('heroRandom'), heroContinue: byId('heroContinue'), sidebar: byId('sidebar'), sidebarToggle: byId('sidebarToggle'),
  };

  let favorites = readJSON('favorites', []);
  let recentPlayed = readJSON('recentPlayed', []);
  let plays = readJSON('plays', {});
  let broken = readJSON('brokenGames', {});
  let lastPlayed = localStorage.getItem('lastPlayed') || '';
  let showFavoritesOnly = false;
  let showIframeSafeOnly = true;
  let currentGame = null;
  let activeView = 'home';

  const categories = new Set();
  catalog.forEach((g) => (g.categories || []).forEach((c) => c && categories.add(c)));
  [...categories].sort().forEach((c) => dom.category.append(new Option(c, c)));

  function byId(id) { return document.getElementById(id); }
  function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function save() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
    localStorage.setItem('recentPlayed', JSON.stringify(recentPlayed));
    localStorage.setItem('plays', JSON.stringify(plays));
    localStorage.setItem('brokenGames', JSON.stringify(broken));
    localStorage.setItem('lastPlayed', lastPlayed);
  }
  function getGame(name) { return catalog.find((g) => g.name === name); }
  function getGameBySlug(slug) { return catalog.find((g) => g.slug === slug); }

  function pickRecommended() {
    const candidates = catalog.filter((g) => g.iframeSafe).sort((a, b) => scoreGame(b) - scoreGame(a));
    return candidates[0] || catalog[0] || null;
  }

  function scoreGame(game) {
    return (plays[game.name] || 0)
      + (game.sessionLength === 'short' ? 2 : 0)
      + ((game.players?.max || 1) > 1 ? 1 : 0)
      + ((game.moods || []).includes('chill') ? 1 : 0);
  }

  function trackPlay(game) {
    lastPlayed = game.name;
    plays[game.name] = (plays[game.name] || 0) + 1;
    recentPlayed = [game.name, ...recentPlayed.filter((x) => x !== game.name)].slice(0, 12);
    save();
  }

  function launchGame(game, updateHash = true) {
    if (!game || game.sourceType === 'external') {
      alert('This game is hosted on an external domain and is disabled in school-safe mode.');
      return;
    }
    currentGame = game;
    trackPlay(game);
    dom.player.classList.remove('hidden');
    dom.frame.src = game.url;
    dom.nowPlaying.textContent = `${game.name} • ${game.sourceType} • ${plays[game.name]} play${plays[game.name] === 1 ? '' : 's'}`;
    if (updateHash) history.replaceState(null, '', `#game/${game.slug}`);
    render();
  }

  function filteredGames() {
    const q = dom.search.value.trim().toLowerCase();
    const category = dom.category.value;
    const sort = dom.sort.value;
    const mode = dom.modeFilter.value;
    const vibe = dom.vibeFilter.value;

    let out = catalog.filter((g) => {
      const inSearch = !q || g.name.toLowerCase().includes(q) || g.aliases.some((a) => a.toLowerCase().includes(q));
      const inCategory = category === 'all' || (g.categories || []).includes(category);
      const inFav = !showFavoritesOnly || favorites.includes(g.name);
      const inSafe = !showIframeSafeOnly || g.iframeSafe;
      const isMulti = (g.players?.max || 1) > 1 || (g.genres || []).includes('multiplayer');
      const isQuick = g.sessionLength === 'short';
      const isChill = (g.moods || []).includes('chill');
      const isStrategy = (g.genres || []).includes('strategy') || (g.genres || []).includes('tower-defense');
      const inMode = mode === 'all' || (mode === 'multiplayer' ? isMulti : !isMulti);
      const inVibe = vibe === 'all' || (vibe === 'quick' ? isQuick : isChill);
      const inView =
        activeView === 'home' ||
        (activeView === 'recent' && recentPlayed.includes(g.name)) ||
        (activeView === 'favorites' && favorites.includes(g.name)) ||
        (activeView === 'multiplayer' && isMulti) ||
        (activeView === 'chill' && isChill) ||
        (activeView === 'quick' && isQuick) ||
        (activeView === 'strategy' && isStrategy) ||
        activeView === 'random';

      return inSearch && inCategory && inFav && inSafe && inMode && inVibe && inView;
    });

    if (activeView === 'random') out = out.sort(() => Math.random() - 0.5);

    out.sort((a, b) => {
      if (sort === 'za') return b.name.localeCompare(a.name);
      if (sort === 'popular') return (plays[b.name] || 0) - (plays[a.name] || 0);
      return a.name.localeCompare(b.name);
    });

    return out;
  }

  function shelf(title, subtitle, items) {
    if (!items.length) return '';
    return `<section class="shelf"><div class="shelf-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="shelf-row">${items.slice(0, 8).map((g) => `
      <button class="shelf-item" data-play="${escapeHtml(g.name)}">${escapeHtml(g.name)}<small>${describeGame(g)}</small></button>
    `).join('')}</div></section>`;
  }

  function renderShelves() {
    if (activeView !== 'home') { dom.shelves.innerHTML = ''; return; }
    const safe = catalog.filter((g) => g.iframeSafe);
    const hot = [...safe].sort((a, b) => (plays[b.name] || 0) - (plays[a.name] || 0));
    const recent = recentPlayed.map(getGame).filter(Boolean);
    const quick = safe.filter((g) => g.sessionLength === 'short');
    const multi = safe.filter((g) => (g.players?.max || 1) > 1 || (g.genres || []).includes('multiplayer'));
    const chill = safe.filter((g) => (g.moods || []).includes('chill'));
    const strategy = safe.filter((g) => (g.genres || []).includes('strategy') || (g.genres || []).includes('tower-defense'));

    dom.shelves.innerHTML = [
      shelf('Continue where you left off', 'Your recent queue', recent.length ? recent : hot),
      shelf('Trending now', 'Most played in this browser', hot),
      shelf('Quick 5-minute games', 'Fast starts, low commitment', quick),
      shelf('Best with friends', 'Multiplayer and versus picks', multi),
      shelf('Chill picks', 'Puzzle, idle, and low-stress stuff', chill),
      shelf('Strategy lane', 'Think first, click second', strategy),
    ].join('');

    dom.shelves.querySelectorAll('[data-play]').forEach((btn) => btn.addEventListener('click', () => {
      const g = getGame(btn.dataset.play); if (g) launchGame(g);
    }));
  }

  function renderSpotlights() {
    const recommended = pickRecommended();
    const multiplayer = catalog.filter((g) => g.iframeSafe && ((g.players?.max || 1) > 1 || (g.genres || []).includes('multiplayer'))).sort((a, b) => (plays[b.name] || 0) - (plays[a.name] || 0))[0];
    const chill = catalog.filter((g) => g.iframeSafe && (g.moods || []).includes('chill')).sort((a, b) => (plays[b.name] || 0) - (plays[a.name] || 0))[0];

    const cards = [
      recommended && { title: 'Recommended next', name: recommended.name, text: `${describeGame(recommended)}. Good first pick if you just want to click and go.` },
      multiplayer && { title: 'Multiplayer pick', name: multiplayer.name, text: `${describeGame(multiplayer)}. Good for immediate chaos with friends.` },
      chill && { title: 'Low-stress lane', name: chill.name, text: `${describeGame(chill)}. Better when you want to zone out instead of sweat.` },
    ].filter(Boolean);

    dom.spotlights.innerHTML = cards.map((card) => `
      <article class="spotlight-card">
        <h3>${escapeHtml(card.title)}</h3>
        <strong>${escapeHtml(card.name)}</strong>
        <p>${escapeHtml(card.text)}</p>
        <button type="button" data-play="${escapeHtml(card.name)}">Play</button>
      </article>
    `).join('');

    dom.spotlights.querySelectorAll('[data-play]').forEach((btn) => btn.addEventListener('click', () => {
      const g = getGame(btn.dataset.play); if (g) launchGame(g);
    }));
  }

  function renderStats(list) {
    const total = catalog.length;
    const iframeSafe = catalog.filter((g) => g.iframeSafe).length;
    const external = catalog.filter((g) => g.sourceType === 'external').length;
    const brokenCount = Object.keys(broken).length;
    const favoritesCount = favorites.length;
    dom.stats.textContent = `${list.length} shown · ${total} total · ${iframeSafe} local/iframe-safe · ${external} external disabled · ${favoritesCount} favorites · ${brokenCount} broken reports`;
  }

  function updateHero() {
    const recommended = pickRecommended();
    const recent = getGame(lastPlayed);
    const quickCount = catalog.filter((g) => g.iframeSafe && g.sessionLength === 'short').length;
    const chillCount = catalog.filter((g) => g.iframeSafe && (g.moods || []).includes('chill')).length;

    dom.heroCatalogCount.textContent = `${catalog.filter((g) => g.iframeSafe).length} local games`;
    dom.heroVibe.textContent = quickCount >= chillCount ? 'Quick hits' : 'Chill mode';
    dom.heroVibeMeta.textContent = quickCount >= chillCount ? `${quickCount} short-session picks ready` : `${chillCount} low-stress picks ready`;
    dom.heroContinueTitle.textContent = recent ? recent.name : (recommended ? recommended.name : 'Nothing yet');
    dom.heroContinueMeta.textContent = recent ? `${plays[recent.name] || 0} plays tracked in this browser` : (recommended ? `Recommended: ${describeGame(recommended)}` : 'Pick a game to start tracking');
    dom.heroContinue.disabled = !recent;
    dom.heroContinue.textContent = recent ? `Resume ${recent.name}` : 'Resume last game';
  }

  function updateContinueButton() {
    const game = getGame(lastPlayed);
    const canContinue = Boolean(game && game.iframeSafe);
    dom.continueBtn.disabled = !canContinue;
    dom.continueBtn.classList.toggle('active', canContinue);
    dom.continueBtn.textContent = canContinue ? `Continue: ${game.name}` : 'Continue';
    dom.continueBtn.title = canContinue ? `Resume ${game.name}` : 'Play a game first to enable continue';
  }

  function chip(label, value, key) {
    return `<span class="filter-chip"><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}<button type="button" data-clear-filter="${escapeHtml(key)}" aria-label="Clear ${escapeHtml(label)} filter">×</button></span>`;
  }

  function renderFilterSummary() {
    const chips = [];
    const q = dom.search.value.trim();
    if (q) chips.push(chip('Search', q, 'search'));
    if (dom.category.value !== 'all') chips.push(chip('Category', dom.category.value, 'category'));
    if (dom.modeFilter.value !== 'all') chips.push(chip('Mode', dom.modeFilter.value, 'mode'));
    if (dom.vibeFilter.value !== 'all') chips.push(chip('Vibe', dom.vibeFilter.value, 'vibe'));
    if (dom.sort.value !== 'az') chips.push(chip('Sort', dom.sort.options[dom.sort.selectedIndex].text, 'sort'));
    if (showFavoritesOnly) chips.push(chip('Only', 'Favorites', 'favorites'));
    if (showIframeSafeOnly) chips.push(chip('School-safe', 'On', 'safe'));
    if (activeView !== 'home') chips.push(chip('View', activeView, 'view'));

    if (!chips.length) {
      dom.filterSummary.hidden = true;
      dom.filterSummary.innerHTML = '';
      return;
    }

    dom.filterSummary.hidden = false;
    dom.filterSummary.innerHTML = `${chips.join('')}<button id="clearFilters" class="ghost" type="button">Clear filters</button>`;
    byId('clearFilters').addEventListener('click', clearFilters);
    dom.filterSummary.querySelectorAll('[data-clear-filter]').forEach((btn) => {
      btn.addEventListener('click', () => clearOneFilter(btn.dataset.clearFilter));
    });
  }

  function clearOneFilter(key) {
    if (key === 'search') dom.search.value = '';
    if (key === 'category') dom.category.value = 'all';
    if (key === 'mode') dom.modeFilter.value = 'all';
    if (key === 'vibe') dom.vibeFilter.value = 'all';
    if (key === 'sort') dom.sort.value = 'az';
    if (key === 'favorites') {
      showFavoritesOnly = false;
      dom.favoritesOnly.classList.remove('active');
    }
    if (key === 'safe') {
      showIframeSafeOnly = false;
      dom.iframeSafeOnly.classList.remove('active');
      dom.iframeSafeOnly.textContent = 'School-safe: Off';
    }
    if (key === 'view') {
      activeView = 'home';
      dom.sideNav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === 'home'));
    }
    render();
  }

  function clearFilters() {
    dom.search.value = '';
    dom.category.value = 'all';
    dom.sort.value = 'az';
    dom.modeFilter.value = 'all';
    dom.vibeFilter.value = 'all';
    showFavoritesOnly = false;
    showIframeSafeOnly = true;
    activeView = 'home';
    dom.favoritesOnly.classList.remove('active');
    dom.iframeSafeOnly.classList.toggle('active', showIframeSafeOnly);
    dom.iframeSafeOnly.textContent = showIframeSafeOnly ? 'School-safe: On' : 'School-safe: Off';
    dom.sideNav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === 'home'));
    history.replaceState(null, '', '#');
    render();
  }

  function describeGame(game) {
    const traits = [];
    if ((game.players?.max || 1) > 1) traits.push(`${game.players.min}-${game.players.max} players`);
    if (game.sessionLength) traits.push(game.sessionLength);
    if ((game.moods || []).length) traits.push(game.moods[0]);
    if (!traits.length && (game.genres || []).length) traits.push(game.genres[0]);
    return `${traits.slice(0, 2).join(' • ') || 'arcade'} · ${plays[game.name] || 0} plays`;
  }

  function relatedGames(game) {
    const genres = new Set(game.genres || []);
    return catalog
      .filter((candidate) => candidate.name !== game.name)
      .map((candidate) => ({
        candidate,
        score: (candidate.genres || []).filter((genre) => genres.has(genre)).length + ((candidate.sessionLength === game.sessionLength) ? 1 : 0),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.candidate);
  }

  function renderGrid() {
    const list = filteredGames();
    renderStats(list);
    dom.grid.innerHTML = '';

    if (!list.length) {
      dom.grid.innerHTML = `
        <article class="card empty-state">
          <div class="title">No games match this filter</div>
          <div class="meta">Try clearing the current search, relaxing filters, or turning off school-safe mode for external entries.</div>
          <div class="empty-actions">
            <button type="button" id="emptyClearFilters">Clear filters</button>
            <button type="button" id="emptyDisableSafe" class="ghost">Turn off school-safe</button>
          </div>
        </article>`;
      byId('emptyClearFilters').addEventListener('click', clearFilters);
      byId('emptyDisableSafe').addEventListener('click', () => {
        showIframeSafeOnly = false;
        dom.iframeSafeOnly.classList.remove('active');
        dom.iframeSafeOnly.textContent = 'School-safe: Off';
        render();
      });
      return;
    }

    list.forEach((game) => {
      const card = document.createElement('article');
      card.className = 'card';
      const isFav = favorites.includes(game.name);
      const blockedExternal = game.sourceType === 'external';
      const badgeClass = blockedExternal ? 'badge warning' : 'badge';
      const modeLabel = (game.players?.max || 1) > 1 ? 'MULTI' : 'SOLO';
      const miniTags = [game.sessionLength, ...(game.moods || []).slice(0, 2), ...(game.genres || []).slice(0, 2)].filter(Boolean).slice(0, 4);
      card.innerHTML = `
        <div class="row"><div class="title" title="${escapeHtml(game.name)}">${escapeHtml(game.name)}</div><span class="${badgeClass}">${modeLabel} • ${escapeHtml(game.sourceType.toUpperCase())}</span></div>
        <div class="tag-row">${miniTags.map((tag) => `<span class="mini-tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="meta">${escapeHtml((game.categories || []).slice(0, 3).join(' • ') || (game.genres || []).slice(0, 3).join(' • ') || 'No category')}</div>
        <div class="meta">${plays[game.name] || 0} plays ${broken[game.name] ? '• ⚠ reported' : ''}</div>
        <div class="meta">${blockedExternal ? 'External domain blocked in school-safe mode' : 'Local and embedded, one click to launch'}</div>
        <div class="actions">
          <button class="play-btn" data-play="${escapeHtml(game.name)}" ${blockedExternal ? 'disabled title="External domains disabled"' : ''}>${blockedExternal ? 'Unavailable' : 'Play'}</button>
          <button data-details="${escapeHtml(game.name)}">Details</button>
          <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${escapeHtml(game.name)}">★</button>
        </div>
      `;
      dom.grid.appendChild(card);
    });

    dom.grid.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => launchGame(getGame(b.dataset.play))));
    dom.grid.querySelectorAll('[data-details]').forEach((b) => b.addEventListener('click', () => openDetails(getGame(b.dataset.details))));
    dom.grid.querySelectorAll('[data-fav]').forEach((b) => b.addEventListener('click', () => {
      const n = b.dataset.fav;
      favorites = favorites.includes(n) ? favorites.filter((x) => x !== n) : [n, ...favorites];
      save(); render();
    }));
  }

  function openDetails(game) {
    if (!game) return;
    const blockedExternal = game.sourceType === 'external';
    const related = relatedGames(game);
    dom.detailsContent.innerHTML = `
      <h2>${escapeHtml(game.name)}</h2>
      <p><strong>Players:</strong> ${game.players?.min || 1}${(game.players?.max || 1) > 1 ? ` to ${game.players.max}` : ''}</p>
      <p><strong>Source:</strong> ${escapeHtml(game.sourceType)}</p>
      <p><strong>Session length:</strong> ${escapeHtml(game.sessionLength || 'medium')}</p>
      <p><strong>Moods:</strong> ${escapeHtml((game.moods || []).join(', ') || 'none')}</p>
      <p><strong>Genres:</strong> ${escapeHtml((game.genres || []).join(', ') || 'none')}</p>
      <p><strong>Tags:</strong> ${escapeHtml((game.categories || []).join(', ') || 'none')}</p>
      <p><strong>Plays:</strong> ${plays[game.name] || 0}</p>
      ${related.length ? `<p><strong>Related:</strong> ${related.map((item) => escapeHtml(item.name)).join(', ')}</p>` : ''}
      <div class="actions">
        <button id="detailPlay" ${blockedExternal ? 'disabled title="External domains disabled"' : ''}>${blockedExternal ? 'Unavailable' : 'Play now'}</button>
        <button id="detailBroken" class="ghost">Report broken</button>
      </div>
    `;
    byId('detailPlay').addEventListener('click', () => { launchGame(game); dom.detailsModal.close(); });
    byId('detailBroken').addEventListener('click', () => { broken[game.name] = Date.now(); save(); dom.detailsModal.close(); render(); });
    dom.detailsModal.showModal();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function closePlayer(updateHash = true) {
    dom.player.classList.add('hidden');
    dom.frame.src = '';
    currentGame = null;
    if (updateHash && location.hash.startsWith('#game/')) history.replaceState(null, '', '#');
  }

  function renderPalette(query = '') {
    const q = query.trim().toLowerCase();
    const commands = [
      { label: 'Go: Home', run: () => setView('home') },
      { label: 'Go: Recent', run: () => setView('recent') },
      { label: 'Go: Favorites', run: () => setView('favorites') },
      { label: 'Go: Multiplayer', run: () => setView('multiplayer') },
      { label: 'Go: Quick Hits', run: () => setView('quick') },
      { label: 'Go: Strategy', run: () => setView('strategy') },
      { label: 'Toggle iframe-safe filter', run: () => { showIframeSafeOnly = !showIframeSafeOnly; render(); } },
      { label: 'Launch random game', run: () => { const list = filteredGames(); if (list[0]) launchGame(list[Math.floor(Math.random() * list.length)]); } },
      { label: 'Clear all filters', run: clearFilters },
    ];

    const games = catalog
      .filter((g) => !q || g.name.toLowerCase().includes(q) || g.aliases.some((a) => a.toLowerCase().includes(q)))
      .slice(0, 12)
      .map((g) => ({ label: `Play: ${g.name}`, run: () => launchGame(g) }));

    const rows = [...commands, ...games].filter((x) => !q || x.label.toLowerCase().includes(q));
    dom.paletteList.innerHTML = rows.map((r, i) => `<button data-cmd="${i}">${escapeHtml(r.label)}</button>`).join('');
    dom.paletteList.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => {
      rows[Number(b.dataset.cmd)]?.run();
      dom.palette.close();
    }));
  }

  function setView(view) {
    activeView = view;
    dom.sideNav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    render();
  }

  function syncRoute() {
    const match = location.hash.match(/^#game\/(.+)$/);
    if (!match) return;
    const game = getGameBySlug(match[1]);
    if (game && currentGame?.slug !== game.slug) launchGame(game, false);
  }

  function render() {
    updateContinueButton();
    updateHero();
    renderSpotlights();
    renderShelves();
    renderFilterSummary();
    renderGrid();
  }

  dom.search.addEventListener('input', render);
  dom.category.addEventListener('change', render);
  dom.sort.addEventListener('change', render);
  dom.modeFilter.addEventListener('change', render);
  dom.vibeFilter.addEventListener('change', render);

  dom.favoritesOnly.addEventListener('click', () => {
    showFavoritesOnly = !showFavoritesOnly;
    dom.favoritesOnly.classList.toggle('active', showFavoritesOnly);
    render();
  });

  dom.iframeSafeOnly.addEventListener('click', () => {
    showIframeSafeOnly = !showIframeSafeOnly;
    dom.iframeSafeOnly.classList.toggle('active', showIframeSafeOnly);
    dom.iframeSafeOnly.textContent = showIframeSafeOnly ? 'School-safe: On' : 'School-safe: Off';
    render();
  });

  dom.continueBtn.addEventListener('click', () => { const g = getGame(lastPlayed); if (g) launchGame(g); });
  dom.heroContinue.addEventListener('click', () => { const g = getGame(lastPlayed); if (g) launchGame(g); });
  dom.randomGame.addEventListener('click', () => { const list = filteredGames(); if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]); });
  dom.heroRandom.addEventListener('click', () => { const list = filteredGames(); if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]); });
  dom.backBtn.addEventListener('click', () => closePlayer());
  dom.openExternal.addEventListener('click', () => {
    if (!currentGame) return;
    window.open(currentGame.url, '_blank', 'noopener');
  });
  dom.reportBroken.addEventListener('click', () => { if (!currentGame) return; broken[currentGame.name] = Date.now(); save(); alert('Marked as broken. Thanks.'); render(); });

  dom.aspectRatio.addEventListener('change', () => {
    dom.frameWrap.classList.remove('ratio-16-9', 'ratio-4-3');
    if (dom.aspectRatio.value === '16:9') dom.frameWrap.classList.add('ratio-16-9');
    if (dom.aspectRatio.value === '4:3') dom.frameWrap.classList.add('ratio-4-3');
  });

  dom.sideNav.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.view === 'random') {
      setView('home');
      const list = filteredGames();
      if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]);
      return;
    }
    setView(b.dataset.view);
    dom.sidebar.classList.remove('nav-open');
    dom.sidebarToggle?.setAttribute('aria-expanded', 'false');
  }));

  dom.sidebarToggle?.addEventListener('click', () => {
    const next = !dom.sidebar.classList.contains('nav-open');
    dom.sidebar.classList.toggle('nav-open', next);
    dom.sidebarToggle.setAttribute('aria-expanded', String(next));
  });

  dom.openPalette.addEventListener('click', () => {
    renderPalette();
    dom.palette.showModal();
    dom.paletteInput.value = '';
    dom.paletteInput.focus();
  });
  dom.paletteInput.addEventListener('input', () => renderPalette(dom.paletteInput.value));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.palette.open) {
        dom.palette.close();
        return;
      }
      if (dom.detailsModal.open) {
        dom.detailsModal.close();
        return;
      }
      if (!dom.player.classList.contains('hidden')) {
        closePlayer();
        return;
      }
    }
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault(); dom.search.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); renderPalette(); dom.palette.showModal(); dom.paletteInput.focus();
    }
    if (['ArrowRight', 'ArrowLeft'].includes(e.key) && dom.player.classList.contains('hidden')) {
      const cards = Array.from(document.querySelectorAll('[data-play]'));
      const idx = cards.indexOf(document.activeElement);
      const next = e.key === 'ArrowRight' ? cards[idx + 1] : cards[idx - 1];
      if (next) next.focus();
    }
  });

  window.addEventListener('hashchange', syncRoute);

  dom.iframeSafeOnly.classList.toggle('active', showIframeSafeOnly);
  dom.iframeSafeOnly.textContent = showIframeSafeOnly ? 'School-safe: On' : 'School-safe: Off';

  setView('home');
  syncRoute();
})();
