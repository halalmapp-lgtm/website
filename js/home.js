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

  // 3,000+ map: build the dots once, then play the fill-in the first time
  // the card scrolls into view. Reduced-motion visitors see the end state.
  const mapviz = document.querySelector(".mapviz");
  if (mapviz) {
    const dotsLayer = mapviz.querySelector(".mapviz-dots");
    const countEl = mapviz.querySelector(".mapviz-count b");
    const target = Number(countEl.dataset.target) || 3000;
    const colours = ["#2fa66a", "#2fa66a", "#2fa66a", "#6a95f0", "#e2b33b", "#e2b33b", "#e0574a"];
    let seed = 11;
    const rand = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const DOTS = 140, FILL_MS = 1700;
    for (let i = 0; i < DOTS; i++) {
      const dot = document.createElement("i");
      // Keep the top-left corner clear for the count and bunch dots in clusters.
      let x, y;
      do { x = 3 + rand() * 94; y = 8 + rand() * 86; } while (x < 56 && y < 30);
      dot.style.left = x + "%";
      dot.style.top = y + "%";
      dot.style.background = colours[Math.floor(rand() * colours.length)];
      dot.style.animationDelay = Math.round(Math.pow(i / DOTS, 1.4) * FILL_MS) + "ms";
      dotsLayer.appendChild(dot);
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = function () { countEl.textContent = target.toLocaleString("en-CA") + "+"; mapviz.classList.add("is-done"); };
    const play = function () {
      mapviz.classList.add("is-on");
      if (reduce) { finish(); return; }
      const start = performance.now();
      const tick = function (now) {
        const t = Math.min(1, (now - start) / FILL_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        countEl.textContent = Math.round(eased * (target - 1)).toLocaleString("en-CA");
        if (t < 1) requestAnimationFrame(tick); else setTimeout(finish, 120);
      };
      countEl.textContent = "0";
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      const seen = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { seen.disconnect(); play(); }
      }, { threshold: 0.45 });
      seen.observe(mapviz);
    } else {
      play();
    }
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
