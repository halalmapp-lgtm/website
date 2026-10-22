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
