(() => {
  const catalog = (window.catalogV2?.games?.length
    ? window.catalogV2.games.map((item) => ({
        ...item,
        type: item.type || 'game',
        description: item.description || '',
        featured: Boolean(item.featured),
        tags: item.tags || [],
      }))
    : buildFallbackCatalog((window.json && window.json.games) || {}))
    .filter((item) => {
      const url = String(item.url || '');
      const isGithubPlaceholder = /github\.com\//i.test(url);
      return !isGithubPlaceholder;
    });
  const collections = window.catalogV2?.collections || [];

  function buildFallbackCatalog(gamesSource) {
    return Object.entries(gamesSource).map(([name, data]) => {
      const path = data?.path || '';
      const isExternal = /^https?:\/\//i.test(path);
      const categories = Array.isArray(data?.categories) ? data.categories : [];
      const lower = name.toLowerCase();
      const genres = [...new Set(categories.map((c) => String(c).toLowerCase()))];
      return {
        id: slugify(name), slug: slugify(name), name, path,
        url: isExternal ? path : `games/${path}`,
        sourceType: isExternal ? 'external' : (path.startsWith('flash/') ? 'flash' : 'local'),
        iframeSafe: !isExternal,
        aliases: Array.isArray(data?.aliases) ? data.aliases : [],
        categories, genres, features: [],
        players: genres.includes('online') || lower.includes('.io') ? { min: 2, max: 16 } : { min: 1, max: 1 },
        sessionLength: genres.includes('idle') ? 'long' : (genres.includes('arcade') ? 'short' : 'medium'),
        moods: genres.includes('puzzle') ? ['chill'] : ['arcade'],
        difficulty: 'medium', type: 'game', description: '', featured: false, tags: [], coverGradient: '', eyebrow: '',
      };
    });
  }

  function slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  function getCoverGradient(item) { return item.coverGradient || 'linear-gradient(135deg, #1e3a8a, #111827)'; }
  function getEyebrow(item) { return item.eyebrow || (item.type === 'game' ? 'Playable now' : item.type === 'app' ? 'App surface' : item.type === 'emulator' ? 'Emulator surface' : 'Utility surface'); }

  const dom = {
    search: byId('search'), category: byId('category'), sort: byId('sort'), modeFilter: byId('modeFilter'), vibeFilter: byId('vibeFilter'),
    iframeSafeOnly: byId('iframeSafeOnly'), favoritesOnly: byId('favoritesOnly'), continueBtn: byId('continueBtn'), randomGame: byId('randomGame'),
    stats: byId('stats'), filterSummary: byId('filterSummary'), spotlights: byId('spotlights'), detailPage: byId('detailPage'), shelves: byId('shelves'), grid: byId('gamesGrid'), sideNav: byId('sideNav'),
    player: byId('player'), frame: byId('gameFrame'), frameWrap: byId('frameWrap'), aspectRatio: byId('aspectRatio'),
    nowPlaying: byId('nowPlaying'), backBtn: byId('backBtn'), openExternal: byId('openExternal'), reportBroken: byId('reportBroken'),
    detailsModal: byId('detailsModal'), detailsContent: byId('detailsContent'),
    palette: byId('palette'), paletteInput: byId('paletteInput'), paletteList: byId('paletteList'), openPalette: byId('openPalette'),
    heroCatalogCount: byId('heroCatalogCount'), heroVibe: byId('heroVibe'), heroVibeMeta: byId('heroVibeMeta'), heroContinueTitle: byId('heroContinueTitle'), heroContinueMeta: byId('heroContinueMeta'),
    heroRandom: byId('heroRandom'), heroContinue: byId('heroContinue'), sidebar: byId('sidebar'), sidebarToggle: byId('sidebarToggle'),
  };

  const migratedSiteData = window.SkeezersStorageCompat?.migrateSiteData?.() || {};
  let favorites = migratedSiteData.favorites || readJSON('skeezersArcade.favorites', readJSON('favorites', []));
  let recentPlayed = migratedSiteData.recentPlayed || readJSON('skeezersArcade.recentPlayed', readJSON('recentPlayed', []));
  let plays = migratedSiteData.plays || readJSON('skeezersArcade.plays', readJSON('plays', {}));
  let broken = migratedSiteData.brokenGames || readJSON('skeezersArcade.brokenGames', readJSON('brokenGames', {}));
  let lastPlayed = migratedSiteData.lastPlayed ?? localStorage.getItem('skeezersArcade.lastPlayed') ?? localStorage.getItem('lastPlayed') ?? '';
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
    localStorage.setItem('skeezersArcade.favorites', JSON.stringify(favorites));
    localStorage.setItem('skeezersArcade.recentPlayed', JSON.stringify(recentPlayed));
    localStorage.setItem('skeezersArcade.plays', JSON.stringify(plays));
    localStorage.setItem('skeezersArcade.brokenGames', JSON.stringify(broken));
    localStorage.setItem('skeezersArcade.lastPlayed', lastPlayed);
  }
  function getGame(name) { return catalog.find((g) => g.name === name); }
  function getGameBySlug(slug) { return catalog.find((g) => g.slug === slug); }
  function scoreGame(game) { return (plays[game.name] || 0) + (game.featured ? 2 : 0) + (game.sessionLength === 'short' ? 2 : 0) + ((game.players?.max || 1) > 1 ? 1 : 0) + ((game.moods || []).includes('chill') ? 1 : 0); }
  function pickRecommended() { const candidates = catalog.filter((g) => g.type === 'game' && g.iframeSafe).sort((a, b) => scoreGame(b) - scoreGame(a)); return candidates[0] || catalog[0] || null; }
  function trackPlay(game) { lastPlayed = game.name; plays[game.name] = (plays[game.name] || 0) + 1; recentPlayed = [game.name, ...recentPlayed.filter((x) => x !== game.name)].slice(0, 12); save(); }
  function isLaunchable(game) {
    return game.type === 'game'
      && game.sourceType !== 'external'
      && game.sourceType !== 'proxy'
      && game.sourceType !== 'app'
      && game.sourceType !== 'emulator'
      && !game.externalHostingStatus;
  }

  function launchGame(game, updateHash = true) {
    if (!game) return;
    if (!isLaunchable(game)) { openDetailPage(game, updateHash); return; }
    dom.detailsModal.open && dom.detailsModal.close();
    currentGame = game;
    trackPlay(game);
    dom.player.classList.remove('hidden');
    dom.frame.src = game.url;
    dom.nowPlaying.textContent = `${game.name} • ${game.sourceType} • ${plays[game.name]} play${plays[game.name] === 1 ? '' : 's'}`;
    dom.detailPage.classList.add('hidden');
    if (updateHash) history.replaceState(null, '', `#item/${game.slug}`);
    render();
  }

  function filteredGames() {
    const q = dom.search.value.trim().toLowerCase();
    const category = dom.category.value;
    const sort = dom.sort.value;
    const mode = dom.modeFilter.value;
    const vibe = dom.vibeFilter.value;

    let out = catalog.filter((g) => {
      const inSearch = !q || g.name.toLowerCase().includes(q) || (g.aliases || []).some((a) => a.toLowerCase().includes(q));
      const inCategory = category === 'all' || (g.categories || []).includes(category);
      const inFav = !showFavoritesOnly || favorites.includes(g.name);
      const inSafe = !showIframeSafeOnly || g.iframeSafe || g.type !== 'game';
      const isMulti = (g.players?.max || 1) > 1 || (g.genres || []).includes('multiplayer');
      const isQuick = g.sessionLength === 'short';
      const isChill = (g.moods || []).includes('chill');
      const isStrategy = (g.genres || []).includes('strategy') || (g.genres || []).includes('tower-defense');
      const inMode = mode === 'all' || (mode === 'multiplayer' ? isMulti : !isMulti);
      const inVibe = vibe === 'all' || (vibe === 'quick' ? isQuick : isChill);
      const inView = activeView === 'home' || (activeView === 'games' && g.type === 'game') || (activeView === 'apps' && g.type === 'app') || (activeView === 'emulators' && g.type === 'emulator') || (activeView === 'featured' && g.featured) || (activeView === 'proxy' && g.type === 'proxy') || (activeView === 'recent' && recentPlayed.includes(g.name)) || (activeView === 'favorites' && favorites.includes(g.name)) || (activeView === 'multiplayer' && isMulti) || (activeView === 'chill' && isChill) || (activeView === 'quick' && isQuick) || (activeView === 'strategy' && isStrategy) || activeView === 'random';
      return inSearch && inCategory && inFav && inSafe && inMode && inVibe && inView;
    });

    if (activeView === 'random') out = out.sort(() => Math.random() - 0.5);
    out.sort((a, b) => sort === 'za' ? b.name.localeCompare(a.name) : sort === 'popular' ? (plays[b.name] || 0) - (plays[a.name] || 0) : a.name.localeCompare(b.name));
    return out;
  }

  function shelf(title, subtitle, items) {
    if (!items.length) return '';
    return `<section class="shelf"><div class="shelf-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="shelf-row">${items.slice(0, 8).map((g) => `
      <button class="shelf-item" data-play="${escapeHtml(g.name)}" style="background:${escapeHtml(getCoverGradient(g))};">
        <span class="shelf-eyebrow">${escapeHtml(getEyebrow(g))}</span>
        ${escapeHtml(g.name)}
        <small>${describeGame(g)}</small>
      </button>
    `).join('')}</div></section>`;
  }

  function renderShelves() {
    if (activeView !== 'home') { dom.shelves.innerHTML = ''; return; }
    const games = catalog.filter((g) => g.type === 'game' && g.iframeSafe);
    const apps = catalog.filter((g) => g.type === 'app');
    const emulators = catalog.filter((g) => g.type === 'emulator');
    const featured = catalog.filter((g) => g.featured);
    const hot = [...games].sort((a, b) => (plays[b.name] || 0) - (plays[a.name] || 0));
    const recent = recentPlayed.map(getGame).filter(Boolean);
    const collectionShelves = collections.map((collection) => {
      const items = (collection.items || []).map((slug) => getGameBySlug(slug)).filter(Boolean);
      return shelf(collection.title, collection.description || '', items);
    }).join('');
    dom.shelves.innerHTML = [
      shelf('Continue where you left off', 'Your recent queue', recent.length ? recent : hot),
      shelf('Featured now', 'Flagship titles and platform surfaces', featured),
      collectionShelves,
      shelf('Quick 5-minute games', 'Fast starts, low commitment', games.filter((g) => g.sessionLength === 'short')),
      shelf('Best with friends', 'Multiplayer and versus picks', games.filter((g) => (g.players?.max || 1) > 1 || (g.genres || []).includes('multiplayer'))),
      shelf('Apps and utilities', 'Launchers, tools, and platform surfaces', apps),
      shelf('Emulator lane', 'Retro systems and runtime tools', emulators),
    ].join('');
    dom.shelves.querySelectorAll('[data-play]').forEach((btn) => btn.addEventListener('click', () => { const g = getGame(btn.dataset.play); if (g) launchGame(g); }));
  }

  function renderSpotlights() {
    const featured = catalog.filter((g) => g.featured).slice(0, 3);
    dom.spotlights.innerHTML = featured.map((card) => `
      <article class="spotlight-card" style="background:${escapeHtml(getCoverGradient(card))};">
        <h3>${escapeHtml(getEyebrow(card))}</h3>
        <strong>${escapeHtml(card.name)}</strong>
        <p>${escapeHtml(card.description || describeGame(card))}</p>
        <button type="button" data-play="${escapeHtml(card.name)}">${card.type === 'game' && isLaunchable(card) ? 'Play' : 'Open details'}</button>
      </article>
    `).join('');
    dom.spotlights.querySelectorAll('[data-play]').forEach((btn) => btn.addEventListener('click', () => { const g = getGame(btn.dataset.play); if (g) launchGame(g); }));
  }

  function renderStats(list) {
    const totals = { items: catalog.length, games: catalog.filter((g) => g.type === 'game').length, apps: catalog.filter((g) => g.type === 'app').length, emulators: catalog.filter((g) => g.type === 'emulator').length, proxy: catalog.filter((g) => g.type === 'proxy').length };
    dom.stats.textContent = `${list.length} shown · ${totals.items} real items live · ${totals.games} games · ${totals.apps} apps · ${totals.emulators} emulators · ${totals.proxy} proxy surfaces`;
  }

  function getResumeCandidate() {
    const recent = getGame(lastPlayed);
    if (recent && isLaunchable(recent)) return recent;
    return recentPlayed.map(getGame).find((game) => game && isLaunchable(game)) || null;
  }

  function updateHero() {
    const recommended = pickRecommended();
    const resumeGame = getResumeCandidate();
    dom.heroCatalogCount.textContent = `${catalog.length} items`;
    dom.heroVibe.textContent = activeView === 'home' ? 'Featured games' : activeView[0].toUpperCase() + activeView.slice(1);
    dom.heroVibeMeta.textContent = `${catalog.filter((g) => g.featured).length} featured surfaces ready`;
    dom.heroContinueTitle.textContent = resumeGame ? resumeGame.name : 'Nothing yet';
    dom.heroContinueMeta.textContent = resumeGame
      ? `${plays[resumeGame.name] || 0} launches tracked in this browser`
      : (recommended ? `Try ${recommended.name} to start a resume trail` : 'Pick a title to start tracking');
    dom.heroContinue.disabled = !resumeGame;
    dom.heroContinue.textContent = resumeGame ? `Resume ${resumeGame.name}` : 'Resume last game';
  }

  function updateContinueButton() {
    const game = getResumeCandidate();
    const canContinue = Boolean(game);
    dom.continueBtn.disabled = !canContinue;
    dom.continueBtn.classList.toggle('active', canContinue);
    dom.continueBtn.textContent = canContinue ? `Continue: ${game.name}` : 'Continue';
    dom.continueBtn.title = canContinue ? `Resume ${game.name}` : 'Play something first to unlock resume';
  }

  function chip(label, value, key) { return `<span class="filter-chip"><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}<button type="button" data-clear-filter="${escapeHtml(key)}" aria-label="Clear ${escapeHtml(label)} filter">×</button></span>`; }

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
    if (!chips.length) { dom.filterSummary.hidden = true; dom.filterSummary.innerHTML = ''; return; }
    dom.filterSummary.hidden = false;
    dom.filterSummary.innerHTML = `${chips.join('')}<button id="clearFilters" class="ghost" type="button">Clear filters</button>`;
    byId('clearFilters').addEventListener('click', clearFilters);
    dom.filterSummary.querySelectorAll('[data-clear-filter]').forEach((btn) => btn.addEventListener('click', () => clearOneFilter(btn.dataset.clearFilter)));
  }

  function clearOneFilter(key) {
    if (key === 'search') dom.search.value = '';
    if (key === 'category') dom.category.value = 'all';
    if (key === 'mode') dom.modeFilter.value = 'all';
    if (key === 'vibe') dom.vibeFilter.value = 'all';
    if (key === 'sort') dom.sort.value = 'az';
    if (key === 'favorites') { showFavoritesOnly = false; dom.favoritesOnly.classList.remove('active'); }
    if (key === 'safe') { showIframeSafeOnly = false; dom.iframeSafeOnly.classList.remove('active'); dom.iframeSafeOnly.textContent = 'School-safe: Off'; }
    if (key === 'view') { activeView = 'home'; dom.sideNav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === 'home')); }
    render();
  }

  function clearFilters() {
    dom.search.value = '';
    dom.category.value = 'all'; dom.sort.value = 'az'; dom.modeFilter.value = 'all'; dom.vibeFilter.value = 'all';
    showFavoritesOnly = false; showIframeSafeOnly = true; activeView = 'home';
    dom.favoritesOnly.classList.remove('active'); dom.iframeSafeOnly.classList.toggle('active', showIframeSafeOnly); dom.iframeSafeOnly.textContent = showIframeSafeOnly ? 'School-safe: On' : 'School-safe: Off';
    dom.sideNav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === 'home')); history.replaceState(null, '', '#'); render();
  }

  function describeGame(game) {
    const traits = [game.type];
    if ((game.players?.max || 1) > 1) traits.push(`${game.players.min}-${game.players.max} players`);
    if (game.sessionLength) traits.push(game.sessionLength);
    return `${traits.slice(0, 2).join(' • ')} · ${plays[game.name] || 0} plays`;
  }

  function relatedGames(game) {
    const genres = new Set(game.genres || []);
    return catalog.filter((candidate) => candidate.name !== game.name).map((candidate) => ({ candidate, score: (candidate.genres || []).filter((genre) => genres.has(genre)).length + ((candidate.type === game.type) ? 1 : 0) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((entry) => entry.candidate);
  }

  function renderGrid() {
    const list = filteredGames();
    renderStats(list);
    dom.grid.innerHTML = '';
    if (!list.length) {
      dom.grid.innerHTML = `<article class="card empty-state"><div class="title">No items match this filter</div><div class="meta">Try clearing the current search or relaxing filters.</div><div class="empty-actions"><button type="button" id="emptyClearFilters">Clear filters</button></div></article>`;
      byId('emptyClearFilters').addEventListener('click', clearFilters);
      return;
    }

    list.forEach((game) => {
      const card = document.createElement('article');
      card.className = 'card';
      const isFav = favorites.includes(game.name);
      const launchable = isLaunchable(game);
      const miniTags = [game.sessionLength, ...(game.moods || []).slice(0, 2), ...(game.genres || []).slice(0, 2)].filter(Boolean).slice(0, 4);
      card.innerHTML = `
        <div class="card-cover" style="background:${escapeHtml(getCoverGradient(game))};">
          <span class="card-eyebrow">${escapeHtml(getEyebrow(game))}</span>
          <span class="badge">${escapeHtml(game.type.toUpperCase())}</span>
        </div>
        <div class="row"><div class="title" title="${escapeHtml(game.name)}">${escapeHtml(game.name)}</div></div>
        <div class="tag-row">${miniTags.map((tag) => `<span class="mini-tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="meta">${escapeHtml(game.description || 'No description yet')}</div>
        <div class="meta">${plays[game.name] || 0} launches ${broken[game.name] ? '• ⚠ reported' : ''}</div>
        <div class="actions">
          <button class="play-btn" data-play="${escapeHtml(game.name)}">${launchable ? 'Play' : 'Open details'}</button>
          <button data-details="${escapeHtml(game.name)}">Details</button>
          <button class="fav-btn ${isFav ? 'active' : ''}" data-fav="${escapeHtml(game.name)}">★</button>
        </div>
      `;
      dom.grid.appendChild(card);
    });

    dom.grid.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => launchGame(getGame(b.dataset.play))));
    dom.grid.querySelectorAll('[data-details]').forEach((b) => b.addEventListener('click', () => openDetails(getGame(b.dataset.details))));
    dom.grid.querySelectorAll('[data-fav]').forEach((b) => b.addEventListener('click', () => { const n = b.dataset.fav; favorites = favorites.includes(n) ? favorites.filter((x) => x !== n) : [n, ...favorites]; save(); render(); }));
  }

  function detailMarkup(game, includeBack = false) {
    const related = relatedGames(game);
    const launchable = isLaunchable(game);
    return `
      <section class="detail-hero" style="background:${escapeHtml(getCoverGradient(game))};">
        ${includeBack ? '<button id="detailPageBack" class="ghost detail-back">← Back</button>' : ''}
        <span class="detail-eyebrow">${escapeHtml(getEyebrow(game))}</span>
        <h2>${escapeHtml(game.name)}</h2>
        <p>${escapeHtml(game.description || 'No description yet.')}</p>
        <div class="detail-actions">
          <button id="detailPlay">${launchable ? 'Play now' : (game.externalHostingStatus ? 'Coming soon' : 'Open item')}</button>
          <button id="detailBroken" class="ghost">Report broken</button>
        </div>
      </section>
      <section class="detail-grid">
        <article class="detail-panel"><h3>Type</h3><p>${escapeHtml(game.type)}</p></article>
        <article class="detail-panel"><h3>Source</h3><p>${escapeHtml(game.sourceType)}</p></article>
        <article class="detail-panel"><h3>Players</h3><p>${game.players?.min || 1}${(game.players?.max || 1) > 1 ? ` to ${game.players.max}` : ''}</p></article>
        <article class="detail-panel"><h3>Session</h3><p>${escapeHtml(game.sessionLength || 'medium')}</p></article>
      </section>
      <section class="detail-meta-blocks">
        <article class="detail-panel"><h3>Moods</h3><p>${escapeHtml((game.moods || []).join(', ') || 'none')}</p></article>
        <article class="detail-panel"><h3>Genres</h3><p>${escapeHtml((game.genres || []).join(', ') || 'none')}</p></article>
        <article class="detail-panel"><h3>Plays</h3><p>${plays[game.name] || 0}</p></article>
        ${related.length ? `<article class="detail-panel"><h3>Related</h3><p>${related.map((item) => escapeHtml(item.name)).join(', ')}</p></article>` : ''}
        ${game.type === 'emulator' ? '<article class="detail-panel"><h3>Save support</h3><p>Depends on emulator/runtime, document per item before launch.</p></article>' : ''}
        ${game.type === 'proxy' ? '<article class="detail-panel"><h3>Warning</h3><p>Keep proxy tools separate from the normal browse and play flow.</p></article>' : ''}
        ${game.externalHostingStatus ? `<article class="detail-panel"><h3>Hosting status</h3><p>${escapeHtml(game.externalHostingReason || 'This item needs external asset hosting before it can launch from the new deployment.')}</p></article>` : ''}
      </section>`;
  }

  function bindDetailActions(game, scope = document) {
    const launchable = isLaunchable(game);
    scope.querySelector('#detailPlay')?.addEventListener('click', () => {
      if (launchable) {
        launchGame(game);
      } else if (game.externalHostingStatus) {
        alert('This game needs external asset hosting before it can launch from the new Cloudflare deployment.');
      } else {
        if (game.url && game.url !== '#') window.open(game.url, '_blank', 'noopener');
      }
    });
    scope.querySelector('#detailBroken')?.addEventListener('click', () => { broken[game.name] = Date.now(); save(); render(); });
    scope.querySelector('#detailPageBack')?.addEventListener('click', () => {
      dom.detailPage.classList.add('hidden');
      history.replaceState(null, '', '#');
      render();
    });
  }

  function openDetails(game) {
    if (!game) return;
    if (window.innerWidth <= 920) {
      openDetailPage(game, true);
      return;
    }
    dom.detailsContent.innerHTML = detailMarkup(game, false);
    bindDetailActions(game, dom.detailsContent);
    dom.detailsModal.showModal();
  }

  function openDetailPage(game, updateHash = true) {
    dom.detailsModal.open && dom.detailsModal.close();
    dom.player.classList.add('hidden');
    dom.frame.src = '';
    currentGame = null;
    dom.detailPage.innerHTML = detailMarkup(game, true);
    dom.detailPage.classList.remove('hidden');
    bindDetailActions(game, dom.detailPage);
    if (updateHash) history.replaceState(null, '', `#item/${game.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
  function closePlayer(updateHash = true) { dom.player.classList.add('hidden'); dom.frame.src = ''; currentGame = null; if (updateHash && location.hash.startsWith('#item/')) history.replaceState(null, '', '#'); }

  function renderPalette(query = '') {
    const q = query.trim().toLowerCase();
    const commands = [
      { label: 'Go: Home', run: () => setView('home') }, { label: 'Go: Games', run: () => setView('games') }, { label: 'Go: Apps', run: () => setView('apps') }, { label: 'Go: Emulators', run: () => setView('emulators') }, { label: 'Go: Featured', run: () => setView('featured') }, { label: 'Go: Proxy', run: () => setView('proxy') }, { label: 'Launch random item', run: () => { const list = filteredGames(); if (list[0]) launchGame(list[Math.floor(Math.random() * list.length)]); } }, { label: 'Clear all filters', run: clearFilters },
    ];
    const games = catalog.filter((g) => !q || g.name.toLowerCase().includes(q) || (g.aliases || []).some((a) => a.toLowerCase().includes(q))).slice(0, 12).map((g) => ({ label: `Open: ${g.name}`, run: () => launchGame(g) }));
    const rows = [...commands, ...games].filter((x) => !q || x.label.toLowerCase().includes(q));
    dom.paletteList.innerHTML = rows.map((r, i) => `<button data-cmd="${i}">${escapeHtml(r.label)}</button>`).join('');
    dom.paletteList.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => { rows[Number(b.dataset.cmd)]?.run(); dom.palette.close(); }));
  }

  function setView(view) { activeView = view; dom.sideNav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === view)); render(); }

  function syncRoute() {
    const compatPath = window.SkeezersRouteCompat?.normalizeLegacyPath?.(location.pathname);
    if (compatPath && location.hash !== compatPath) history.replaceState(null, '', `${location.origin}${location.pathname}${compatPath}`);
    const normalizedHash = window.SkeezersRouteCompat?.normalizeLegacyHash?.(location.hash) || location.hash;
    if (normalizedHash !== location.hash) history.replaceState(null, '', normalizedHash);
    const match = normalizedHash.match(/^#item\/(.+)$/) || normalizedHash.match(/^#game\/(.+)$/);
    if (match) {
      const game = getGameBySlug(match[1]);
      if (game) {
        if (isLaunchable(game)) {
          if (currentGame?.slug !== game.slug) launchGame(game, false);
        } else {
          openDetailPage(game, false);
        }
      }
      return;
    }
    const legacyMatch = normalizedHash.match(/^#legacy\/(.+)$/);
    if (legacyMatch) {
      const decoded = decodeURIComponent(legacyMatch[1]);
      const target = getGameBySlug(decoded) || getGame(decoded) || catalog.find((game) => game.path === decoded || game.url === `games/${decoded}` || game.url === decoded);
      if (target && currentGame?.slug !== target.slug) launchGame(target, false);
    }
  }

  function render() {
    const showingDetailRoute = location.hash.startsWith('#item/');
    if (!showingDetailRoute) dom.detailPage.classList.add('hidden');
    updateContinueButton();
    updateHero();
    renderSpotlights();
    renderShelves();
    renderFilterSummary();
    renderGrid();
    dom.spotlights.style.display = activeView === 'home' && !showingDetailRoute ? '' : 'none';
    dom.shelves.style.display = activeView === 'home' && !showingDetailRoute ? '' : 'none';
    dom.grid.style.display = showingDetailRoute ? 'none' : '';
  }

  dom.search.addEventListener('input', render);
  dom.category.addEventListener('change', render);
  dom.sort.addEventListener('change', render);
  dom.modeFilter.addEventListener('change', render);
  dom.vibeFilter.addEventListener('change', render);
  dom.favoritesOnly.addEventListener('click', () => { showFavoritesOnly = !showFavoritesOnly; dom.favoritesOnly.classList.toggle('active', showFavoritesOnly); render(); });
  dom.iframeSafeOnly.addEventListener('click', () => { showIframeSafeOnly = !showIframeSafeOnly; dom.iframeSafeOnly.classList.toggle('active', showIframeSafeOnly); dom.iframeSafeOnly.textContent = showIframeSafeOnly ? 'School-safe: On' : 'School-safe: Off'; render(); });
  dom.continueBtn.addEventListener('click', () => { const g = getResumeCandidate(); if (g) launchGame(g); });
  dom.heroContinue.addEventListener('click', () => { const g = getResumeCandidate(); if (g) launchGame(g); });
  dom.randomGame.addEventListener('click', () => { const list = filteredGames(); if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]); });
  dom.heroRandom.addEventListener('click', () => { const list = filteredGames(); if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]); });
  dom.backBtn.addEventListener('click', () => closePlayer());
  dom.openExternal.addEventListener('click', () => { if (!currentGame) return; window.open(currentGame.url, '_blank', 'noopener'); });
  dom.reportBroken.addEventListener('click', () => { if (!currentGame) return; broken[currentGame.name] = Date.now(); save(); alert('Marked as broken. Thanks.'); render(); });
  dom.aspectRatio.addEventListener('change', () => { dom.frameWrap.classList.remove('ratio-16-9', 'ratio-4-3'); if (dom.aspectRatio.value === '16:9') dom.frameWrap.classList.add('ratio-16-9'); if (dom.aspectRatio.value === '4:3') dom.frameWrap.classList.add('ratio-4-3'); });
  dom.sideNav.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.view === 'random') { setView('home'); const list = filteredGames(); if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]); return; } setView(b.dataset.view); dom.sidebar.classList.remove('nav-open'); dom.sidebarToggle?.setAttribute('aria-expanded', 'false'); }));
  dom.sidebarToggle?.addEventListener('click', () => { const next = !dom.sidebar.classList.contains('nav-open'); dom.sidebar.classList.toggle('nav-open', next); dom.sidebarToggle.setAttribute('aria-expanded', String(next)); });
  dom.openPalette.addEventListener('click', () => { renderPalette(); dom.palette.showModal(); dom.paletteInput.value = ''; dom.paletteInput.focus(); });
  dom.paletteInput.addEventListener('input', () => renderPalette(dom.paletteInput.value));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (dom.palette.open) { dom.palette.close(); return; } if (dom.detailsModal.open) { dom.detailsModal.close(); return; } if (!dom.player.classList.contains('hidden')) { closePlayer(); return; } } if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); dom.search.focus(); } if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); renderPalette(); dom.palette.showModal(); dom.paletteInput.focus(); } });
  window.addEventListener('hashchange', syncRoute);
  dom.iframeSafeOnly.classList.toggle('active', showIframeSafeOnly);
  dom.iframeSafeOnly.textContent = showIframeSafeOnly ? 'School-safe: On' : 'School-safe: Off';
  setView('home');
  syncRoute();
})();
