(() => {
  const gamesSource = (window.json && window.json.games) || {};

  const inferTraits = (name, categories) => {
    const lower = name.toLowerCase();
    const tags = new Set(categories.map((c) => c.toLowerCase()));
    const multiplayer = tags.has("online") || lower.includes(".io") || lower.includes("kart");
    const quick = tags.has("arcade") || tags.has("runner") || lower.includes("slope");
    const chill = tags.has("puzzle") || tags.has("idle") || tags.has("sandbox") || tags.has("strategy");
    return { multiplayer, quick, chill };
  };

  const allGames = Object.entries(gamesSource).map(([name, data]) => {
    const path = data?.path || "";
    const isExternal = /^https?:\/\//i.test(path);
    const categories = Array.isArray(data?.categories) ? data.categories : [];
    const traits = inferTraits(name, categories);
    return {
      name,
      path,
      url: isExternal ? path : `games/${path}`,
      aliases: Array.isArray(data?.aliases) ? data.aliases : [],
      categories,
      isExternal,
      iframeSafe: !isExternal,
      ...traits,
    };
  });

  const dom = {
    search: byId("search"), category: byId("category"), sort: byId("sort"), modeFilter: byId("modeFilter"), vibeFilter: byId("vibeFilter"),
    iframeSafeOnly: byId("iframeSafeOnly"), favoritesOnly: byId("favoritesOnly"), continueBtn: byId("continueBtn"), randomGame: byId("randomGame"),
    stats: byId("stats"), shelves: byId("shelves"), grid: byId("gamesGrid"), sideNav: byId("sideNav"),
    player: byId("player"), frame: byId("gameFrame"), frameWrap: byId("frameWrap"), aspectRatio: byId("aspectRatio"),
    nowPlaying: byId("nowPlaying"), backBtn: byId("backBtn"), openExternal: byId("openExternal"), reportBroken: byId("reportBroken"),
    detailsModal: byId("detailsModal"), detailsContent: byId("detailsContent"),
    palette: byId("palette"), paletteInput: byId("paletteInput"), paletteList: byId("paletteList"), openPalette: byId("openPalette"),
  };

  let favorites = readJSON("favorites", []);
  let recentPlayed = readJSON("recentPlayed", []);
  let plays = readJSON("plays", {});
  let broken = readJSON("brokenGames", {});
  let lastPlayed = localStorage.getItem("lastPlayed") || "";
  let showFavoritesOnly = false;
  let showIframeSafeOnly = false;
  let currentGame = null;
  let activeView = "home";

  const categories = new Set();
  allGames.forEach((g) => g.categories.forEach((c) => c && categories.add(c)));
  [...categories].sort().forEach((c) => dom.category.append(new Option(c, c)));

  function byId(id) { return document.getElementById(id); }
  function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function save() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
    localStorage.setItem("recentPlayed", JSON.stringify(recentPlayed));
    localStorage.setItem("plays", JSON.stringify(plays));
    localStorage.setItem("brokenGames", JSON.stringify(broken));
    localStorage.setItem("lastPlayed", lastPlayed);
  }
  function getGame(name) { return allGames.find((g) => g.name === name); }

  function trackPlay(game) {
    lastPlayed = game.name;
    plays[game.name] = (plays[game.name] || 0) + 1;
    recentPlayed = [game.name, ...recentPlayed.filter((x) => x !== game.name)].slice(0, 12);
    save();
  }

  function launchGame(game) {
    currentGame = game;
    trackPlay(game);
    dom.player.classList.remove("hidden");
    dom.frame.src = game.url;
    dom.nowPlaying.textContent = `${game.name} • ${game.isExternal ? "External" : "Embedded"}`;
    render();
  }

  function filteredGames() {
    const q = dom.search.value.trim().toLowerCase();
    const category = dom.category.value;
    const sort = dom.sort.value;
    const mode = dom.modeFilter.value;
    const vibe = dom.vibeFilter.value;

    let out = allGames.filter((g) => {
      const inSearch = !q || g.name.toLowerCase().includes(q) || g.aliases.some((a) => a.toLowerCase().includes(q));
      const inCategory = category === "all" || g.categories.includes(category);
      const inFav = !showFavoritesOnly || favorites.includes(g.name);
      const inSafe = !showIframeSafeOnly || g.iframeSafe;
      const inMode = mode === "all" || (mode === "multiplayer" ? g.multiplayer : !g.multiplayer);
      const inVibe = vibe === "all" || (vibe === "quick" ? g.quick : g.chill);
      const inView =
        activeView === "home" ||
        (activeView === "recent" && recentPlayed.includes(g.name)) ||
        (activeView === "favorites" && favorites.includes(g.name)) ||
        (activeView === "multiplayer" && g.multiplayer) ||
        (activeView === "chill" && g.chill) ||
        activeView === "random";

      return inSearch && inCategory && inFav && inSafe && inMode && inVibe && inView;
    });

    if (activeView === "random") out = out.sort(() => Math.random() - 0.5);

    out.sort((a, b) => {
      if (sort === "za") return b.name.localeCompare(a.name);
      if (sort === "popular") return (plays[b.name] || 0) - (plays[a.name] || 0);
      return a.name.localeCompare(b.name);
    });

    return out;
  }

  function shelf(title, items) {
    if (!items.length) return "";
    return `<section class="shelf"><h3>${title}</h3><div class="shelf-row">${items.slice(0, 8).map((g) => `
      <button class="shelf-item" data-play="${escapeHtml(g.name)}">${escapeHtml(g.name)}<small>${plays[g.name] || 0} plays</small></button>
    `).join("")}</div></section>`;
  }

  function renderShelves() {
    if (activeView !== "home") { dom.shelves.innerHTML = ""; return; }
    const hot = [...allGames].sort((a, b) => (plays[b.name] || 0) - (plays[a.name] || 0));
    const recent = recentPlayed.map(getGame).filter(Boolean);
    const quick = allGames.filter((g) => g.quick);
    const multi = allGames.filter((g) => g.multiplayer);
    const chill = allGames.filter((g) => g.chill);

    dom.shelves.innerHTML = [
      shelf("Continue where you left off", recent.length ? recent : hot),
      shelf("Trending now", hot),
      shelf("Quick 5-minute games", quick),
      shelf("Best with friends", multi),
      shelf("Chill picks", chill),
    ].join("");

    dom.shelves.querySelectorAll("[data-play]").forEach((btn) => btn.addEventListener("click", () => {
      const g = getGame(btn.dataset.play); if (g) launchGame(g);
    }));
  }

  function renderStats(list) {
    const total = allGames.length;
    const iframeSafe = allGames.filter((g) => g.iframeSafe).length;
    const brokenCount = Object.keys(broken).length;
    dom.stats.textContent = `${list.length} shown · ${total} total · ${iframeSafe} iframe-safe · ${brokenCount} broken reports`;
  }

  function renderGrid() {
    const list = filteredGames();
    renderStats(list);
    dom.grid.innerHTML = "";

    if (!list.length) {
      dom.grid.innerHTML = `<article class="card"><div class="title">No games match this filter</div><div class="meta">Try relaxing category/mode filters or disable iframe-safe only.</div></article>`;
      return;
    }

    list.forEach((game) => {
      const card = document.createElement("article");
      card.className = "card";
      const isFav = favorites.includes(game.name);
      const tags = [game.multiplayer ? "MULTI" : "SOLO", game.iframeSafe ? "IFRAME SAFE" : "EXTERNAL"].join(" • ");
      card.innerHTML = `
        <div class="row"><div class="title" title="${escapeHtml(game.name)}">${escapeHtml(game.name)}</div><span class="badge">${tags}</span></div>
        <div class="meta">${escapeHtml((game.categories.slice(0, 3).join(" • ") || "No category"))}</div>
        <div class="meta">${plays[game.name] || 0} plays ${broken[game.name] ? "• ⚠ reported" : ""}</div>
        <div class="actions">
          <button class="play-btn" data-play="${escapeHtml(game.name)}">Play</button>
          <button data-details="${escapeHtml(game.name)}">Details</button>
          <button class="fav-btn ${isFav ? "active" : ""}" data-fav="${escapeHtml(game.name)}">★</button>
        </div>
      `;
      dom.grid.appendChild(card);
    });

    dom.grid.querySelectorAll("[data-play]").forEach((b) => b.addEventListener("click", () => launchGame(getGame(b.dataset.play))));
    dom.grid.querySelectorAll("[data-details]").forEach((b) => b.addEventListener("click", () => openDetails(getGame(b.dataset.details))));
    dom.grid.querySelectorAll("[data-fav]").forEach((b) => b.addEventListener("click", () => {
      const n = b.dataset.fav;
      favorites = favorites.includes(n) ? favorites.filter((x) => x !== n) : [n, ...favorites];
      save(); render();
    }));
  }

  function openDetails(game) {
    if (!game) return;
    dom.detailsContent.innerHTML = `
      <h2>${escapeHtml(game.name)}</h2>
      <p><strong>Mode:</strong> ${game.multiplayer ? "Multiplayer" : "Single-player"}</p>
      <p><strong>Launch:</strong> ${game.iframeSafe ? "Iframe-safe" : "External"}</p>
      <p><strong>Tags:</strong> ${escapeHtml(game.categories.join(", ") || "none")}</p>
      <p><strong>Plays:</strong> ${plays[game.name] || 0}</p>
      <div class="actions">
        <button id="detailPlay">Play now</button>
        <button id="detailBroken" class="ghost">Report broken</button>
      </div>
    `;
    byId("detailPlay").addEventListener("click", () => { launchGame(game); dom.detailsModal.close(); });
    byId("detailBroken").addEventListener("click", () => { broken[game.name] = Date.now(); save(); dom.detailsModal.close(); render(); });
    dom.detailsModal.showModal();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function renderPalette(query = "") {
    const q = query.trim().toLowerCase();
    const commands = [
      { label: "Go: Home", run: () => setView("home") },
      { label: "Go: Favorites", run: () => setView("favorites") },
      { label: "Go: Multiplayer", run: () => setView("multiplayer") },
      { label: "Toggle iframe-safe filter", run: () => { showIframeSafeOnly = !showIframeSafeOnly; render(); } },
      { label: "Launch random game", run: () => { const list = filteredGames(); if (list[0]) launchGame(list[Math.floor(Math.random() * list.length)]); } },
    ];

    const games = allGames
      .filter((g) => !q || g.name.toLowerCase().includes(q) || g.aliases.some((a) => a.toLowerCase().includes(q)))
      .slice(0, 12)
      .map((g) => ({ label: `Play: ${g.name}`, run: () => launchGame(g) }));

    const rows = [...commands, ...games].filter((x) => !q || x.label.toLowerCase().includes(q));
    dom.paletteList.innerHTML = rows.map((r, i) => `<button data-cmd="${i}">${escapeHtml(r.label)}</button>`).join("");
    dom.paletteList.querySelectorAll("[data-cmd]").forEach((b) => b.addEventListener("click", () => {
      rows[Number(b.dataset.cmd)]?.run();
      dom.palette.close();
    }));
  }

  function setView(view) {
    activeView = view;
    dom.sideNav.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    render();
  }

  function render() { renderShelves(); renderGrid(); }

  dom.search.addEventListener("input", render);
  dom.category.addEventListener("change", render);
  dom.sort.addEventListener("change", render);
  dom.modeFilter.addEventListener("change", render);
  dom.vibeFilter.addEventListener("change", render);

  dom.favoritesOnly.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    dom.favoritesOnly.classList.toggle("active", showFavoritesOnly);
    render();
  });

  dom.iframeSafeOnly.addEventListener("click", () => {
    showIframeSafeOnly = !showIframeSafeOnly;
    dom.iframeSafeOnly.classList.toggle("active", showIframeSafeOnly);
    render();
  });

  dom.continueBtn.addEventListener("click", () => { const g = getGame(lastPlayed); if (g) launchGame(g); });
  dom.randomGame.addEventListener("click", () => { const list = filteredGames(); if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]); });
  dom.backBtn.addEventListener("click", () => { dom.player.classList.add("hidden"); dom.frame.src = ""; });
  dom.openExternal.addEventListener("click", () => { if (currentGame) window.open(currentGame.url, "_blank", "noopener"); });
  dom.reportBroken.addEventListener("click", () => { if (!currentGame) return; broken[currentGame.name] = Date.now(); save(); alert("Marked as broken. Thanks."); render(); });

  dom.aspectRatio.addEventListener("change", () => {
    dom.frameWrap.classList.remove("ratio-16-9", "ratio-4-3");
    if (dom.aspectRatio.value === "16:9") dom.frameWrap.classList.add("ratio-16-9");
    if (dom.aspectRatio.value === "4:3") dom.frameWrap.classList.add("ratio-4-3");
  });

  dom.sideNav.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.view === "random") {
      setView("home");
      const list = filteredGames();
      if (list.length) launchGame(list[Math.floor(Math.random() * list.length)]);
      return;
    }
    setView(b.dataset.view);
  }));

  dom.openPalette.addEventListener("click", () => {
    renderPalette();
    dom.palette.showModal();
    dom.paletteInput.value = "";
    dom.paletteInput.focus();
  });
  dom.paletteInput.addEventListener("input", () => renderPalette(dom.paletteInput.value));

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      e.preventDefault(); dom.search.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault(); renderPalette(); dom.palette.showModal(); dom.paletteInput.focus();
    }
    if (["ArrowRight", "ArrowLeft"].includes(e.key) && dom.player.classList.contains("hidden")) {
      const cards = Array.from(document.querySelectorAll("[data-play]"));
      const idx = cards.indexOf(document.activeElement);
      const next = e.key === "ArrowRight" ? cards[idx + 1] : cards[idx - 1];
      if (next) next.focus();
    }
  });

  setView("home");
})();