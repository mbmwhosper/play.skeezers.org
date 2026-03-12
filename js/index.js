(() => {
  const gamesSource = (window.json && window.json.games) || {};

  const inferTraits = (name, categories) => {
    const lower = name.toLowerCase();
    const tags = new Set(categories.map((c) => c.toLowerCase()));

    const multiplayer = tags.has("online") || lower.includes(".io") || lower.includes("random") || lower.includes("karts");
    const quick = tags.has("arcade") || tags.has("runner") || lower.includes("random") || lower.includes("slope");
    const chill = tags.has("puzzle") || tags.has("idle") || tags.has("strategy") || tags.has("sandbox") || lower.includes("clicker");

    return { multiplayer, quick, chill, controller: false };
  };

  const allGames = Object.entries(gamesSource).map(([name, data]) => {
    const path = data?.path || "";
    const isLegacy = path.startsWith("flash/");
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
      type: isLegacy ? "legacy" : "html5",
      ...traits,
    };
  });

  const dom = {
    search: document.getElementById("search"),
    category: document.getElementById("category"),
    sort: document.getElementById("sort"),
    modeFilter: document.getElementById("modeFilter"),
    vibeFilter: document.getElementById("vibeFilter"),
    favoritesOnly: document.getElementById("favoritesOnly"),
    continueBtn: document.getElementById("continueBtn"),
    randomGame: document.getElementById("randomGame"),
    stats: document.getElementById("stats"),
    shelves: document.getElementById("shelves"),
    recent: document.getElementById("recent"),
    grid: document.getElementById("gamesGrid"),
    player: document.getElementById("player"),
    frame: document.getElementById("gameFrame"),
    nowPlaying: document.getElementById("nowPlaying"),
    backBtn: document.getElementById("backBtn"),
    openExternal: document.getElementById("openExternal"),
    frameFallback: document.getElementById("frameFallback"),
    fallbackOpen: document.getElementById("fallbackOpen"),
    detailsModal: document.getElementById("detailsModal"),
    detailsContent: document.getElementById("detailsContent"),
  };

  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  let showFavoritesOnly = false;
  let lastPlayed = localStorage.getItem("lastPlayed") || "";
  let recentPlayed = JSON.parse(localStorage.getItem("recentPlayed") || "[]");
  let plays = JSON.parse(localStorage.getItem("plays") || "{}");
  let ratings = JSON.parse(localStorage.getItem("ratings") || "{}");
  let currentGame = null;

  const categories = new Set();
  allGames.forEach((g) => g.categories.forEach((c) => c && categories.add(c)));
  [...categories].sort().forEach((c) => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    dom.category.appendChild(option);
  });

  function saveState() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
    localStorage.setItem("recentPlayed", JSON.stringify(recentPlayed));
    localStorage.setItem("plays", JSON.stringify(plays));
    localStorage.setItem("ratings", JSON.stringify(ratings));
    localStorage.setItem("lastPlayed", lastPlayed);
  }

  function getGame(name) {
    return allGames.find((g) => g.name === name);
  }

  function toggleFavorite(name) {
    if (favorites.includes(name)) favorites = favorites.filter((x) => x !== name);
    else favorites.unshift(name);
    saveState();
    render();
  }

  function vote(name, type) {
    if (!ratings[name]) ratings[name] = { up: 0, down: 0 };
    ratings[name][type] += 1;
    saveState();
    render();
  }

  function trackPlay(game) {
    lastPlayed = game.name;
    plays[game.name] = (plays[game.name] || 0) + 1;
    recentPlayed = [game.name, ...recentPlayed.filter((x) => x !== game.name)].slice(0, 8);
    saveState();
  }

  function filteredGames() {
    const q = dom.search.value.trim().toLowerCase();
    const category = dom.category.value;
    const sort = dom.sort.value;
    const mode = dom.modeFilter.value;
    const vibe = dom.vibeFilter.value;

    let out = allGames.filter((g) => {
      const inSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.aliases.some((a) => a.toLowerCase().includes(q));
      const inCategory = category === "all" || g.categories.includes(category);
      const inFav = !showFavoritesOnly || favorites.includes(g.name);
      const inMode = mode === "all" || (mode === "multiplayer" ? g.multiplayer : !g.multiplayer);
      const inVibe = vibe === "all" || (vibe === "quick" ? g.quick : g.chill);
      return inSearch && inCategory && inFav && inMode && inVibe;
    });

    out.sort((a, b) => {
      if (sort === "za") return b.name.localeCompare(a.name);
      if (sort === "popular") return (plays[b.name] || 0) - (plays[a.name] || 0);
      return a.name.localeCompare(b.name);
    });

    return out;
  }

  function launchGame(game) {
    currentGame = game;
    trackPlay(game);

    if (dom.frameFallback) dom.frameFallback.classList.add("hidden");
    dom.frame.classList.remove("hidden");
    dom.frame.src = game.url;
    dom.nowPlaying.textContent = `Now Playing: ${game.name}`;
    dom.player.classList.remove("hidden");

    render();
  }

  dom.frame.addEventListener("load", () => {
    dom.frame.classList.remove("hidden");
    if (dom.frameFallback) dom.frameFallback.classList.add("hidden");
  });

  function similarGames(game) {
    return allGames
      .filter((g) => g.name !== game.name)
      .map((g) => ({ g, score: g.categories.filter((c) => game.categories.includes(c)).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.g);
  }

  function details(game) {
    const rating = ratings[game.name] || { up: 0, down: 0 };
    const sims = similarGames(game)
      .map((g) => `<button class="link-btn" data-play="${g.name}">${g.name}</button>`)
      .join(" ");

    dom.detailsContent.innerHTML = `
      <h2>${game.name}</h2>
      <p><strong>Type:</strong> ${game.type.toUpperCase()} • ${game.multiplayer ? "Multiplayer" : "Single-player"}</p>
      <p><strong>Tags:</strong> ${game.categories.join(", ") || "none"} ${game.quick ? "• quick" : ""} ${game.chill ? "• chill" : ""}</p>
      <p><strong>Plays:</strong> ${plays[game.name] || 0}</p>
      <p><strong>Rating:</strong> 👍 ${rating.up} • 👎 ${rating.down}</p>
      <div class="actions">
        <button data-play="${game.name}">Play now</button>
        <button data-vote="up" data-name="${game.name}">👍</button>
        <button data-vote="down" data-name="${game.name}">👎</button>
      </div>
      <p><strong>Similar:</strong> ${sims || "none yet"}</p>
    `;

    dom.detailsContent.querySelectorAll("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const g = getGame(btn.dataset.play);
        if (g) launchGame(g);
        dom.detailsModal.close();
      });
    });

    dom.detailsContent.querySelectorAll("[data-vote]").forEach((btn) => {
      btn.addEventListener("click", () => {
        vote(btn.dataset.name, btn.dataset.vote);
        details(game);
      });
    });

    dom.detailsModal.showModal();
  }

  function renderStats(list) {
    const total = allGames.length;
    const html5 = allGames.filter((g) => g.type === "html5").length;
    const hot = [...allGames]
      .sort((a, b) => (plays[b.name] || 0) - (plays[a.name] || 0))
      .slice(0, 1)[0];

    dom.stats.textContent = `${list.length} shown • ${total} total • ${html5} HTML5 • Most played: ${hot ? hot.name : "n/a"}`;
  }

  function shelf(title, items) {
    if (!items.length) return "";
    const cards = items
      .slice(0, 6)
      .map(
        (g) => `<button class="shelf-item" data-play="${g.name}">${g.name}<small>${plays[g.name] || 0} plays</small></button>`,
      )
      .join("");
    return `<section class="shelf"><h3>${title}</h3><div class="shelf-row">${cards}</div></section>`;
  }

  function renderShelves() {
    const dayIndex = new Date().getDate() % Math.max(allGames.length, 1);
    const daily = allGames[dayIndex] ? [allGames[dayIndex]] : [];
    const weekly = [...allGames].sort((a, b) => (plays[b.name] || 0) - (plays[a.name] || 0));

    dom.shelves.innerHTML = [
      shelf("Game of the Day", daily),
      shelf("Weekly Highlights", weekly),
      shelf("Best with friends", allGames.filter((g) => g.multiplayer)),
      shelf("Quick chaos", allGames.filter((g) => g.quick)),
      shelf("Chill picks", allGames.filter((g) => g.chill)),
    ].join("");

    dom.shelves.querySelectorAll("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const g = getGame(btn.dataset.play);
        if (g) launchGame(g);
      });
    });
  }

  function renderRecent() {
    const games = recentPlayed.map(getGame).filter(Boolean);
    if (!games.length) {
      dom.recent.innerHTML = "";
      return;
    }

    dom.recent.innerHTML = `<h3>Recently played</h3><div class="recent-row">${games
      .map((g) => `<button data-play="${g.name}">${g.name}</button>`)
      .join("")}</div>`;

    dom.recent.querySelectorAll("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const g = getGame(btn.dataset.play);
        if (g) launchGame(g);
      });
    });
  }

  function render() {
    const list = filteredGames();
    renderStats(list);
    renderShelves();
    renderRecent();
    dom.grid.innerHTML = "";

    list.forEach((game) => {
      const card = document.createElement("article");
      card.className = "card";

      const isFav = favorites.includes(game.name);
      const rating = ratings[game.name] || { up: 0, down: 0 };
      const categoryText = game.categories.length ? game.categories.slice(0, 2).join(" • ") : "No category";

      card.innerHTML = `
        <div class="row">
          <div class="title" title="${game.name}">${game.name}</div>
          <span class="badge">${game.multiplayer ? "MULTI" : "SOLO"}</span>
        </div>
        <div class="meta">${categoryText}</div>
        <div class="meta">👍 ${rating.up} • 👎 ${rating.down} • ${plays[game.name] || 0} plays</div>
        <div class="actions">
          <button class="play-btn">Play</button>
          <button class="details-btn">Details</button>
          <button class="fav-btn ${isFav ? "active" : ""}" title="Favorite">★</button>
        </div>
      `;

      card.querySelector(".play-btn").addEventListener("click", () => launchGame(game));
      card.querySelector(".details-btn").addEventListener("click", () => details(game));
      card.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(game.name));
      dom.grid.appendChild(card);
    });
  }

  dom.search.addEventListener("input", render);
  dom.category.addEventListener("change", render);
  dom.sort.addEventListener("change", render);
  dom.modeFilter.addEventListener("change", render);
  dom.vibeFilter.addEventListener("change", render);

  dom.favoritesOnly.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    dom.favoritesOnly.classList.toggle("active", showFavoritesOnly);
    dom.favoritesOnly.textContent = showFavoritesOnly ? "All games" : "Favorites only";
    render();
  });

  dom.continueBtn.addEventListener("click", () => {
    const game = getGame(lastPlayed);
    if (game) launchGame(game);
  });

  dom.randomGame.addEventListener("click", () => {
    const list = filteredGames();
    if (!list.length) return;
    const game = list[Math.floor(Math.random() * list.length)];
    launchGame(game);
  });

  dom.backBtn.addEventListener("click", () => {
    dom.player.classList.add("hidden");
    dom.frame.src = "";
  });

  function openCurrentExternal() {
    if (!currentGame) return;
    window.open(currentGame.url, "_blank", "noopener");
  }

  if (dom.openExternal) dom.openExternal.addEventListener("click", openCurrentExternal);
  if (dom.fallbackOpen) dom.fallbackOpen.addEventListener("click", openCurrentExternal);

  render();
})();
