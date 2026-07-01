(function () {
  const toggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".nav-mobile");
  if (!toggle || !mobileNav) return;

  toggle.addEventListener("click", function () {
    const open = mobileNav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      mobileNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();
