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

  /* ---------- 首屏滚动：背景模糊 + 首页内容淡入 ---------- */

  const splash = document.querySelector("[data-splash]");
  const siteBackground = document.querySelector(".site-background");
  const maxBlur = Number((splash && splash.dataset.blur) || 14);

  const updateSplash = () => {
    if (!splash) return;
    // 首屏高度 = 100vh - 顶部导航，滚过这段距离即视为「下滑一整页」
    const distance = Math.max(splash.offsetHeight || window.innerHeight, 1);
    const progress = Math.min(1, Math.max(0, window.scrollY / distance));

    if (siteBackground) {
      siteBackground.style.setProperty("--bg-blur", `${(progress * maxBlur).toFixed(2)}px`);
      siteBackground.style.setProperty("--bg-dim", progress.toFixed(3));
    }

    splash.classList.toggle("is-past", progress > 0.12);
    document.body.classList.toggle("is-revealed", progress > 0.62);
  };

  const updateScrollState = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);

    const progress = document.querySelector("[data-reading-progress]");
    const article = document.querySelector("[data-article-content]");
    if (progress && article) {
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const readableDistance = article.offsetHeight - window.innerHeight * 0.65;
      const current = window.scrollY - articleTop + window.innerHeight * 0.2;
      const percentage = readableDistance > 0
        ? Math.min(100, Math.max(0, (current / readableDistance) * 100))
        : 100;
      progress.style.width = `${percentage}%`;
    }

    updateSplash();
  };

  let splashTick = false;
  const onScroll = () => {
    if (splashTick) return;
    splashTick = true;
    window.requestAnimationFrame(() => {
      splashTick = false;
      updateScrollState();
    });
  };

  // Trigger the header avatar reveal once the page is ready.
  requestAnimationFrame(() => {
    if (header) header.classList.add("is-ready");
  });

  updateScrollState();
  window.addEventListener("scroll", onScroll, { passive: true });
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

    revealItems.forEach((item) => {
      /* 延迟按「同一容器内的出现顺序」算，而不是全页序号：
         否则栅格里的卡片会一起撞到上限、同时淡入，看不出错落感。 */
      const siblings = item.parentElement ? item.parentElement.children : [];
      let step = 0;
      for (let i = 0; i < siblings.length; i += 1) {
        if (siblings[i] === item) break;
        if (siblings[i].classList.contains("reveal")) step += 1;
      }
      item.style.transitionDelay = `${Math.min(step * 45, 240)}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- 每日一言 ---------- */
  /* 注意：initDailyQuote 的调用必须放在本节所有 const 声明之后。
     函数声明会被提升，但 const 不会——提前调用会在 initDailyQuote 内部
     读到尚未初始化的 parseJSON / store / today 等，直接抛 ReferenceError，
     连带着后面的主题切换、阅读进度等逻辑一起中断。 */

  const ANIMATIONS = ["fade-up", "fade-down", "fade-right", "fade-left", "tornado"];

  const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const parseJSON = (value, fallback) => {
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  };

  // 按 "a.b.c" 这样的路径从接口响应里取值
  const readPath = (source, path) => {
    if (!path) return "";
    const value = String(path).split(".").reduce((acc, key) => {
      if (acc === null || acc === undefined) return undefined;
      return acc[key];
    }, source);
    return value === null || value === undefined ? "" : String(value).trim();
  };

  const store = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (error) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (error) { /* 隐私模式下忽略 */ }
    }
  };

  const today = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };

  const fingerprint = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36);
  };

  const shuffled = (list) => {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  };

  // 随机挑一个数据源请求，失败自动换下一个，全部失败返回 null
  async function fetchQuote(config) {
    const sources = (config.sources || []).filter((source) => source && source.url);
    for (const source of shuffled(sources)) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), config.timeout || 6000);
        const response = await fetch(source.url, { signal: controller.signal, credentials: "omit" });
        clearTimeout(timer);
        if (!response.ok) continue;
        const data = await response.json();
        const content = readPath(data, source.contentField || "content");
        if (!content) continue;
        return { content, author: readPath(data, source.authorField) };
      } catch (error) {
        /* 超时或跨域失败，继续尝试下一个数据源 */
      }
    }
    return null;
  }

  function typeInto(node, text, speed, onDone) {
    if (prefersReducedMotion()) {
      node.textContent = text;
      if (onDone) onDone();
      return;
    }
    // 单字间隔会自动压缩，保证整句约 3 秒内打完
    const perChar = Math.max(16, Math.min(speed, 3000 / Math.max(text.length, 1)));
    let index = 0;
    node.textContent = "";
    const step = () => {
      index += 1;
      node.textContent = text.slice(0, index);
      if (index < text.length) {
        setTimeout(step, perChar + Math.random() * perChar * 0.5);
      } else if (onDone) {
        onDone();
      }
    };
    step();
  }

  function initDailyQuote(el) {
    const textNode = el.querySelector("[data-quote-text]");
    const authorNode = el.querySelector("[data-quote-author]");
    if (!textNode) return;

    const config = {
      sources: parseJSON(el.dataset.sources, []),
      fallbacks: parseJSON(el.dataset.fallbacks, []),
      timeout: Number(el.dataset.timeout) || 6000,
      typeSpeed: Number(el.dataset.typeSpeed) || 70,
      cacheDaily: el.dataset.cacheDaily !== "false"
    };

    // 缓存键带上数据源指纹：改了接口地址后缓存自动失效
    const cacheKey = `daily-quote:${fingerprint(JSON.stringify(config.sources))}`;
    let cached = null;
    if (config.cacheDaily) {
      cached = parseJSON(store.get(cacheKey), null);
      if (cached && cached.date !== today()) cached = null;
    }

    const play = (quote) => {
      const run = () => {
        el.dataset.state = "typing";
        typeInto(textNode, quote.content, config.typeSpeed, () => {
          el.dataset.state = "done";
          if (authorNode) authorNode.textContent = quote.author ? `— ${quote.author}` : "";
        });
      };

      if (prefersReducedMotion()) {
        el.dataset.state = "ready";
        run();
        return;
      }

      el.dataset.state = "ready";
      el.classList.add(`anim-${ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)]}`);
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        run();
      };
      el.addEventListener("animationend", start, { once: true });
      setTimeout(start, 1500);
    };

    const resolve = async () => {
      let quote = cached;
      if (!quote) {
        quote = await fetchQuote(config);
        if (!quote && config.fallbacks.length) {
          const list = config.fallbacks.filter((item) => item && item.content);
          quote = list.length ? list[Math.floor(Math.random() * list.length)] : null;
        }
        if (quote && config.cacheDaily) {
          store.set(cacheKey, JSON.stringify({ date: today(), content: quote.content, author: quote.author || "" }));
        }
      }

      if (!quote || !quote.content) {
        el.hidden = true;
        return;
      }
      play(quote);
    };

    resolve();
  }

  const quoteEl = document.querySelector("[data-daily-quote]");
  if (quoteEl) initDailyQuote(quoteEl);

  /* ---------- 主题切换：亮 / 暗 背景图 ---------- */

  const themeButton = document.querySelector("[data-theme-toggle]");
  const rootElement = document.documentElement;

  const getStoredTheme = () => {
    try { return localStorage.getItem("site-theme"); } catch (error) { return null; }
  };

  const applyTheme = (theme, persist) => {
    if (theme !== "light" && theme !== "dark") theme = "light";
    rootElement.setAttribute("data-theme", theme);
    if (themeButton) {
      themeButton.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
    if (persist) {
      try { localStorage.setItem("site-theme", theme); } catch (error) { /* 隐私模式忽略 */ }
    }
  };

  if (themeButton) {
    // 同步 head 里的预设值，确保按钮 aria 与实际一致
    applyTheme(rootElement.getAttribute("data-theme") || "light", false);
    themeButton.addEventListener("click", () => {
      const next = rootElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next, true);
    });
  }

  // 跟随系统主题变化（仅在用户未显式设置时）
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemThemeChange = (event) => {
    if (getStoredTheme()) return;
    applyTheme(event.matches ? "dark" : "light", false);
  };
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", onSystemThemeChange);
  } else if (mediaQuery.addListener) {
    // 兼容旧浏览器
    mediaQuery.addListener(onSystemThemeChange);
  }

  /* ---------- 站点配色选择器（悬停太阳/月亮图标时展开） ---------- */
  /* 每个选项由 header.html 提供两个 data 属性：
       data-palette-value  default | macos | github | gruvbox
       data-palette-mode   light | dark
     属性名、localStorage 键（site-palette）必须与 head.html 里的首屏恢复脚本
     和 assets/css/themes/*.css 的 :root[data-palette="…"] 选择器保持一致。 */

  const PALETTES = ["default", "macos", "github", "gruvbox"];
  const paletteOptions = document.querySelectorAll("[data-palette-value]");

  const markActivePalette = () => {
    const palette = rootElement.getAttribute("data-palette") || "default";
    const mode = rootElement.getAttribute("data-theme") || "light";
    paletteOptions.forEach((option) => {
      const active = option.dataset.paletteValue === palette && option.dataset.paletteMode === mode;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-pressed", String(active));
    });
  };

  const applyPalette = (palette) => {
    if (!PALETTES.includes(palette)) palette = "default";
    // default 即 main.css :root 的 custom-theme 配色：移除属性而不是写入值
    if (palette === "default") {
      rootElement.removeAttribute("data-palette");
    } else {
      rootElement.setAttribute("data-palette", palette);
    }
    try { localStorage.setItem("site-palette", palette); } catch (error) { /* 隐私模式忽略 */ }
  };

  if (paletteOptions.length) {
    markActivePalette();
    paletteOptions.forEach((option) => {
      option.addEventListener("click", () => {
        applyPalette(option.dataset.paletteValue);
        applyTheme(option.dataset.paletteMode, true);
        markActivePalette();
      });
    });

    // 太阳/月亮按钮只翻转亮暗，配色不变，但高亮项要跟着换组。
    // 这个监听注册在上面翻转 data-theme 的那个之后，因此读到的已是新值。
    if (themeButton) themeButton.addEventListener("click", markActivePalette);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", markActivePalette);
  }
})();
