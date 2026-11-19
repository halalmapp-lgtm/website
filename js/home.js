// Home page motion: scroll reveals and the looping Instagram rail.
(function () {
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // GTA map: a dot for every restaurant on HalalMapp, filling in the first
  // time the card scrolls into view. Reduced-motion visitors see it finished.
  const gtamap = document.querySelector(".gtamap");
  if (gtamap) {
    const canvas = gtamap.querySelector("canvas");
    const countEl = gtamap.querySelector(".gtamap-count b");
    const target = Number(countEl.dataset.target) || 3000;
    // View: Hamilton to Oshawa. Lake Ontario's shoreline and the main highways, west to east.
    const VIEW = { west: -80.02, east: -78.78, south: 43.28, north: 44.02 };
    const SHORE = [[43.27, -79.95], [43.29, -79.80], [43.33, -79.79], [43.39, -79.72], [43.44, -79.66], [43.50, -79.60], [43.55, -79.57], [43.60, -79.50], [43.62, -79.47], [43.63, -79.41], [43.632, -79.37], [43.65, -79.32], [43.67, -79.27], [43.70, -79.23], [43.74, -79.17], [43.79, -79.11], [43.81, -79.04], [43.84, -78.96], [43.86, -78.88], [43.87, -78.80], [43.88, -78.70]];
    const ROADS = [
      [[43.51, -79.95], [43.56, -79.80], [43.64, -79.65], [43.70, -79.53], [43.72, -79.45], [43.76, -79.30], [43.80, -79.18], [43.85, -79.04], [43.89, -78.90], [43.92, -78.75]],
      [[43.33, -79.80], [43.40, -79.73], [43.46, -79.67], [43.55, -79.60], [43.61, -79.53], [43.63, -79.45]],
      [[43.47, -80.00], [43.55, -79.86], [43.66, -79.72], [43.78, -79.55], [43.83, -79.38], [43.86, -79.22], [43.92, -79.02], [43.95, -78.85]],
      [[43.72, -79.53], [43.83, -79.55], [43.95, -79.58], [44.03, -79.60]],
      [[43.66, -79.36], [43.76, -79.35], [43.86, -79.38], [43.96, -79.42], [44.03, -79.44]],
    ];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let points = null, ctx = null, project = null, played = false;

    const setup = function () {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Equirectangular with longitude shrunk by cos(lat), scaled to cover the card.
      const k = Math.cos(43.7 * Math.PI / 180);
      const spanX = (VIEW.east - VIEW.west) * k, spanY = VIEW.north - VIEW.south;
      const scale = Math.max(w / spanX, h / spanY);
      const offX = (w - spanX * scale) / 2, offY = (h - spanY * scale) / 2;
      project = function (lat, lng) { return [offX + (lng - VIEW.west) * k * scale, offY + (VIEW.north - lat) * scale]; };
      // Land, then the lake below the shoreline, then faint highways.
      ctx.fillStyle = "#0e1c16"; ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      SHORE.forEach(function (pt, i) { const xy = project(pt[0], pt[1]); i ? ctx.lineTo(xy[0], xy[1]) : ctx.moveTo(xy[0], xy[1]); });
      ctx.lineTo(w + 10, h + 10); ctx.lineTo(-10, h + 10); ctx.closePath();
      ctx.fillStyle = "#11233a"; ctx.fill();
      ctx.strokeStyle = "rgba(160, 190, 220, 0.18)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = "rgba(220, 235, 225, 0.09)"; ctx.lineWidth = 1.2;
      ROADS.forEach(function (road) {
        ctx.beginPath();
        road.forEach(function (pt, i) { const xy = project(pt[0], pt[1]); i ? ctx.lineTo(xy[0], xy[1]) : ctx.moveTo(xy[0], xy[1]); });
        ctx.stroke();
      });
    };
    const drawDots = function (from, to) {
      for (let i = from; i < to; i++) {
        const xy = project(points[i][0], points[i][1]);
        ctx.fillStyle = "rgba(62, 224, 143, 0.16)";
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 3.2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "#3ee08f";
        ctx.beginPath(); ctx.arc(xy[0], xy[1], 1.3, 0, 6.2832); ctx.fill();
      }
    };
    const play = function () {
      played = true;
      setup();
      if (reduce) { drawDots(0, points.length); countEl.textContent = target.toLocaleString("en-CA"); return; }
      const FILL_MS = 1900, start = performance.now();
      let drawn = 0;
      const tick = function (now) {
        const t = Math.min(1, (now - start) / FILL_MS);
        const eased = 1 - Math.pow(1 - t, 2.4);
        const upto = Math.round(eased * points.length);
        drawDots(drawn, upto); drawn = upto;
        countEl.textContent = Math.round(eased * target).toLocaleString("en-CA");
        if (t < 1) requestAnimationFrame(tick);
      };
      countEl.textContent = "0";
      requestAnimationFrame(tick);
    };
    const load = fetch("/assets/data/gta-restaurants.json").then(function (r) { return r.json(); }).then(function (flat) {
      const list = [];
      for (let i = 0; i < flat.length; i += 2) list.push([flat[i] / 1e4, flat[i + 1] / 1e4]);
      // Shuffle with a fixed seed so dots appear across the whole city at once.
      let seed = 7;
      for (let i = list.length - 1; i > 0; i--) { seed = (seed * 16807) % 2147483647; const j = seed % (i + 1); const tmp = list[i]; list[i] = list[j]; list[j] = tmp; }
      points = list;
    }).catch(function () { points = []; });
    const start = function () { load.then(play); };
    if ("IntersectionObserver" in window) {
      const seen = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { seen.disconnect(); start(); }
      }, { threshold: 0.4 });
      seen.observe(gtamap);
    } else {
      start();
    }
    // Redraw the finished map if the card changes size after it has played.
    let resizeTimer = null;
    window.addEventListener("resize", function () {
      if (!played || !points) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { setup(); drawDots(0, points.length); }, 150);
    });
  }

  // Pricing: switch paid plans between monthly and yearly prices.
  const billingButtons = document.querySelectorAll(".price-toggle button");
  billingButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const period = button.dataset.billing;
      billingButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === button)); });
      document.querySelectorAll(".plan-price[data-monthly]").forEach(function (price) {
        price.querySelector("b").textContent = price.dataset[period];
        price.querySelector("span").textContent = period === "yearly" ? "/year" : "/month";
      });
      document.querySelectorAll(".plan-note[data-monthly]").forEach(function (note) {
        note.textContent = note.dataset[period];
      });
    });
  });

  // Hero phone recording: hold on the poster frame for reduced-motion visitors.
  const screen = document.querySelector(".device-screen");
  if (screen && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    screen.removeAttribute("autoplay");
    screen.pause();
  }

  // The rail scrolls by half its width, so it needs a second copy of the posts.
  // The copy is hidden from screen readers and keyboard focus.
  const rail = document.getElementById("ig-rail");
  if (rail && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Array.from(rail.children).forEach(function (item) {
      const copy = item.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
      copy.querySelectorAll("img").forEach(function (img) { img.alt = ""; });
      rail.appendChild(copy);
    });
  }
})();
