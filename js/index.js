(() => {
  const gamesSource = (window.json && window.json.games) || {};
  const allGames = Object.entries(gamesSource).map(([name, data]) => {
    const path = data?.path || "";
    const isLegacy = path.startsWith("flash/");
    return {
      name,
      path,
      url: `games/${path}`,
      aliases: Array.isArray(data?.aliases) ? data.aliases : [],
      categories: Array.isArray(data?.categories) ? data.categories : [],
      type: isLegacy ? "legacy" : "html5",
    };
  });

  const dom = {
    search: document.getElementById("search"),
    category: document.getElementById("category"),
    sort: document.getElementById("sort"),
    favoritesOnly: document.getElementById("favoritesOnly"),
    randomGame: document.getElementById("randomGame"),
    stats: document.getElementById("stats"),
    grid: document.getElementById("gamesGrid"),
    player: document.getElementById("player"),
    frame: document.getElementById("gameFrame"),
    nowPlaying: document.getElementById("nowPlaying"),
    backBtn: document.getElementById("backBtn"),
  };

  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  let showFavoritesOnly = false;

  const categories = new Set();
  allGames.forEach((g) => g.categories.forEach((c) => c && categories.add(c)));
  [...categories].sort().forEach((c) => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    dom.category.appendChild(option);
  });

  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  function toggleFavorite(name) {
    if (favorites.includes(name)) favorites = favorites.filter((x) => x !== name);
    else favorites.unshift(name);
    saveFavorites();
    render();
  }

  function filteredGames() {
    const q = dom.search.value.trim().toLowerCase();
    const category = dom.category.value;
    const sort = dom.sort.value;

    let out = allGames.filter((g) => {
      const inSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.aliases.some((a) => a.toLowerCase().includes(q));
      const inCategory = category === "all" || g.categories.includes(category);
      const inFav = !showFavoritesOnly || favorites.includes(g.name);
      return inSearch && inCategory && inFav;
    });

    out.sort((a, b) =>
      sort === "za" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name),
    );

    return out;
  }

  function launchGame(game) {
    dom.frame.src = game.url;
    dom.nowPlaying.textContent = `Now Playing: ${game.name}`;
    dom.player.classList.remove("hidden");
  }

  function renderStats(list) {
    const total = allGames.length;
    const html5 = allGames.filter((g) => g.type === "html5").length;
    dom.stats.textContent = `${list.length} shown • ${total} total • ${html5} HTML5`;
  }

  function render() {
    const list = filteredGames();
    renderStats(list);
    dom.grid.innerHTML = "";

    list.forEach((game) => {
      const card = document.createElement("article");
      card.className = "card";

      const isFav = favorites.includes(game.name);
      const categoryText = game.categories.length ? game.categories.slice(0, 2).join(" • ") : "No category";

      card.innerHTML = `
        <div class="row">
          <div class="title" title="${game.name}">${game.name}</div>
          <span class="badge">${game.type === "html5" ? "HTML5" : "Legacy"}</span>
        </div>
        <div class="meta">${categoryText}</div>
        <div class="actions">
          <button class="play-btn">Play</button>
          <button class="fav-btn ${isFav ? "active" : ""}" title="Favorite">★</button>
        </div>
      `;

      card.querySelector(".play-btn").addEventListener("click", () => launchGame(game));
      card.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(game.name));
      dom.grid.appendChild(card);
    });
  }

  dom.search.addEventListener("input", render);
  dom.category.addEventListener("change", render);
  dom.sort.addEventListener("change", render);

  dom.favoritesOnly.addEventListener("click", () => {
    showFavoritesOnly = !showFavoritesOnly;
    dom.favoritesOnly.classList.toggle("active", showFavoritesOnly);
    dom.favoritesOnly.textContent = showFavoritesOnly ? "All games" : "Favorites only";
    render();
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

  render();
})();
