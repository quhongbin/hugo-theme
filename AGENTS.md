# 项目简介

Mountain Glass —— 一个 Hugo 静态博客主题（MIT）。视觉风格取自 `myweb-vue3-ts`：全屏风景背景、
半透明玻璃卡片、紧凑的资料面板、标签导航、带动画的文章卡片。

技术边界：**只有 Hugo 模板 + 原生 CSS + 一份原生 JS**，没有运行时框架、没有构建工具链、
没有 npm 依赖、没有图标库（图标为内联 SVG）。唯一的外部资源是 KaTeX（按需从 CDN 加载）。
新增功能时请守住这条边界。

要求 Hugo ≥ 0.158.0（extended 版，需要 CSS/JS 的 minify 与 fingerprint）。

# 仓库关系与本地开发

本仓库只是主题，不含内容。站点内容在同级的独立仓库里：

```text
Blogs/
├── hugo-blogs-contents/   # 站点：hugo.yaml + content/，themesDir: ../ + theme: hugo-theme
└── hugo-theme/            # 本仓库
```

改完主题后到内容仓库预览：

```sh
cd ../hugo-blogs-contents && hugo server -D
```

`exampleSite/` 已被 `.gitignore` 忽略，当前不存在；README 里那条 `hugo server --source exampleSite`
命令目前跑不起来，实际调试请用上面的内容仓库。

# 目录结构

- `layouts/_default/baseof.html` —— 整页骨架，其余页面模板用 `{{ define "main" }}` 填充
- `layouts/` 页面模板：`index.html`、`_default/{list,single,taxonomy}.html`、
  `taxonomy/term.html`、`section/logs.html`、`404.html`
- `layouts/partials/` —— 页眉页脚、侧边栏、文章卡片、分页、语言切换、每日一言、
  日志时间线/贡献日历、词条栅格、内联图标、CSS 变量注入
- `layouts/_markup/` —— 围栏代码块的渲染钩子（`math` / `latex`）
- `assets/css/main.css` —— 全部布局与配色变量（约 2700 行，单文件）
- `assets/css/code-themes.css` —— chroma token 类到 `--tok-*` 变量的映射规则（不写具体颜色）
- `assets/css/themes/{macos,github,gruvbox}.css` —— 三套可选配色，各自带 `:root[data-palette="…"]` 前缀
- `assets/js/main.js` —— 唯一的脚本（IIFE）：移动端菜单、首屏滚动、阅读进度、
  入场动画、每日一言、亮暗切换
- `i18n/{en,zh-cn}.yaml` —— 全部界面文案，**两个文件的键必须一一对应**
- `static/images/` —— 背景图与头像

**每个模板/partial 的逐项说明（它渲染哪一块、`{{ }}` 里的参数从哪来）见 `README.md`
的「Layouts 模板说明」一节，改模板前先读那里，不要在本文件里重复。**

# 关键机制

- **样式加载顺序**：`head.html` 依次输出 `main.css` → 拼接后的 palette 包 → `css-vars.html`
  注入的行内变量。后者靠「同优先级后写者胜」覆盖默认值，**顺序调换配置就完全失效**。
- **可配置宽度**：`params.layout` 下的 `contentWidth` / `articleWidth` / `tocWidth` /
  `articlePadding` 经 `css-length.html` 归一化（纯数字补 px，字符串原样并过滤危险字符）后
  变成 CSS 变量。未配置的项不输出，保留默认值。
- **配色主题**：`<html data-palette="macos|github|gruvbox">` 选配色，不设属性即站点默认
  （`custom-theme`，代码块不分词着色）；亮暗由 `data-theme` 控制。首选项存在
  localStorage 的 `site-palette` / `site-theme`，并在 `head.html` 的内联脚本里提前恢复以避免闪白。
- **多语言**：中英文各自的 `content/<lang>/`，靠相同的 `translationKey` 互链；
  文案一律走 `i18n "key"`，不要把中文硬编码进模板。
- **数学公式**：站点级 `params.math.enabled` 或单页 front matter `math: true` 任一为真即启用。
  行内 `$…$` 交给 KaTeX auto-render；复杂公式请用围栏 math / latex 代码块（走 `_markup` 钩子，
  反斜杠命令不会被 Goldmark 的 CommonMark 转义吃掉）。
- **日志页**：`/logs/` 由 `section/logs.html` 聚合全站带 `logs` front matter 的页面，
  按 `params.logs.mode`（`timeline` / `calendar` / `both`）决定渲染时间线、贡献日历或两者。

# 编写规范

- **配置项与非显然的实现都要写注释**，说明这个字段/这段代码做什么、设与不设的效果差别。
  现有 partial 顶部的块注释就是范例；沿用这个风格，包括踩过的坑（为什么必须这么写）。
- 注释与文案用中文，代码标识符用英文。
- 新增界面文案时同步改 `i18n/en.yaml` 和 `i18n/zh-cn.yaml`。
- 无障碍与 `prefers-reduced-motion` 是既有承诺：交互元素补 `aria-*`，动画要有降级路径。
- 提交信息用 `ADD: / FIX: / CHANGE: ` 前缀（见 `git log`）。

# 已知陷阱

- **`--minify` 会吃掉 `var(...)` 后面的空格**，所以 `css-vars.html` 注入的变量只能用在
  单值属性（`width` / `max-width` / `flex` / `padding`）上，放进 `grid-template-columns`
  这类多值属性会让整条声明失效。
- **`main.js` 中 `initDailyQuote()` 的调用必须写在该节所有 `const` 声明之后**，
  否则触发暂时性死区 `ReferenceError`，并连带中断后面所有脚本。
- `taxonomy/term.html` 是必需的：缺了它，`/tags/xxx/` 会回退到 `_default/list.html`
  而拿不到 `.Pages`，页面只剩空状态。
- 配色相关的三处必须同名，改一处就要同步全部：`header.html` 的 `data-palette-value` /
  `data-palette-mode` 按钮、`head.html` 首屏恢复脚本与 `main.js` 读写的 `data-palette` 属性
  及 localStorage 键 `site-palette`、`assets/css/themes/*.css` 的 `:root[data-palette="…"]` 选择器。
  历史上这套属性从 `data-code-style` 改名而来，`main.js` 一度漏改导致配色按钮完全失效。
