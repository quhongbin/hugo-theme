(() => {
  const header = document.querySelector("[data-site-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const navigation = document.querySelector("[data-navigation]");

  const closeMenu = () => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
  };

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      navigation.classList.toggle("is-open", !open);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  const updateScrollState = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);

    const progress = document.querySelector("[data-reading-progress]");
    const article = document.querySelector("[data-article-content]");
    if (!progress || !article) return;

    const articleTop = article.getBoundingClientRect().top + window.scrollY;
    const readableDistance = article.offsetHeight - window.innerHeight * 0.65;
    const current = window.scrollY - articleTop + window.innerHeight * 0.2;
    const percentage = readableDistance > 0
      ? Math.min(100, Math.max(0, (current / readableDistance) * 100))
      : 100;
    progress.style.width = `${percentage}%`;
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
    updateScrollState();
  });

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -30px", threshold: 0.08 });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 45, 180)}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
