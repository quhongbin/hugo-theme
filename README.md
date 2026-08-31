# Mountain Glass

Mountain Glass is a responsive Hugo theme inspired by the visual language of
`myweb-vue3-ts`: a scenic full-screen background, translucent cards, a compact
profile panel, tag navigation, and animated article cards. It uses Hugo
templates and a small amount of vanilla JavaScript, with no runtime framework
or external icon dependency.

## Features

- Chinese and English interface translations
- Responsive desktop, tablet, and mobile layouts
- Home, section, taxonomy, term, article, about, and 404 pages
- Language switcher, RSS metadata, Open Graph metadata, and canonical links
- Tag cloud, category list, pagination, article table of contents, and reading progress
- Hugo Pipes minification and fingerprinting for CSS and JavaScript
- Accessible navigation and reduced-motion support

## Install as a sibling theme

If the site and theme are sibling directories:

```text
Blogs/
├── hugo_endpoint/
└── hugo_theme/
```

add these values to the site configuration:

```yaml
themesDir: ../
theme: hugo_theme
```

## Recommended parameters

```yaml
params:
  mainSections:
    - posts
  avatar: images/avatar.webp
  favicon: images/avatar.webp
  since: 2023
  icp: ""
  social:
    - name: GitHub
      icon: github
      url: https://github.com/your-name
    - name: Email
      icon: email
      url: mailto:hello@example.com
```

Language-specific values such as `author`, `description`, `tagline`,
`homeTitle`, `homeSubtitle`, and `profileRole` can be placed inside each
language's `params` block.

## Content

For a multilingual site using separate content directories:

```text
content/
├── zh-cn/
│   ├── posts/
│   └── about/
└── en/
    ├── posts/
    └── about/
```

Use the same `translationKey` in corresponding Chinese and English files so
the language switcher can link between them.

```yaml
---
title: "Hello Hugo"
date: 2026-08-22
translationKey: hello-hugo
tags: [Hugo]
categories: [Web]
description: "A short post description."
---
```

Run the included example from the theme directory:

```sh
hugo server --source exampleSite --themesDir ../.. --theme hugo_theme
```

## Layouts 模板说明

本主题的页面由 Hugo 的「基础模板 + 区块」机制组合而成：
`layouts/_default/baseof.html` 定义整页骨架（`<html>/<head>/<body>`、背景、页眉、页脚、脚本），
正文区域用 `{{ block "main" . }}{{ end }}` 留出空位；各个页面模板（`index.html`、
`_default/list.html`、`_default/single.html`、`_default/taxonomy.html`、`taxonomy/term.html`、`404.html`）
通过 `{{ define "main" }}…{{ end }}` 往这个空位里填内容。模板里大量调用的 `{{ partial "xxx.html" . }}`
会把当前页面上下文 `.` 传进对应的 partial 文件。

下面逐个文件说明：**它是做什么用的 / 具体渲染哪部分 / 里面的 `{{ *** }}` 参数从哪来**。

### 基础与页面模板（`layouts/` 根目录与 `_default/`）

#### `layouts/_default/baseof.html` — 整页骨架
- **作用**：所有页面的外壳。输出 `<html>`、`<head>`（含 `head.html` partial）、
  `.site-background` 全屏背景、页眉（`header.html`）、`<main>` 主内容区、页脚（`footer.html`），
  并在末尾注入经过 minify + fingerprint 的 `js/main.js`。
- **渲染部分**：除了 `{{ block "main" . }}` 由具体页面模板填充外，其余结构（背景、导航、页脚、脚本）都由它统一输出。
- **参数来源**：
  - `site.Language.Locale` / `site.Language.Direction`：当前语言的区域与文字方向（`config` 的 `languages` 配置）。
  - `site.Params.splash`：首屏开关/配置；`{{ if .IsHome }}` 仅在首页根据它决定是否给 `<body>` 加 `has-splash` 类并渲染 `splash.html`。
  - `.IsHome`、`.Kind`：当前页是否为首页、页面类型（决定 `<body>` 的 `page-kind-*` 类名）。
  - `resources.Get "js/main.js" | minify | fingerprint`：经 Hugo Pipes 处理的脚本资源，取其 `RelPermalink` 与 `Data.Integrity`（内容哈希）。

#### `layouts/index.html` — 首页
- **作用**：站点首页内容区。
- **渲染部分**：`<main>` 内的 hero 欢迎区（站名/标语）、「最新文章」标题栏、文章卡片列表、分页。
- **参数来源**：
  - `site.Params.homeTitle` / `site.Params.homeSubtitle` / `site.Params.description` / `site.Title`：hero 区文案（依次回退）。
  - `site.Params.mainSections`（默认 `["posts"]`）+ `site.RegularPages`：`where … "Section" "in" …` 取出要展示的常规页面。
  - `.Paginate $pages`：对上述页面做分页，结果交给 `article-card.html`、`pagination.html`。
  - `site.GetPage "/posts"`：取 `/posts` 页用于「查看全部」链接。
  - `i18n "welcome" "latestWriting" "recentPosts" "viewAll"` 等：文案来自 `i18n/*.yaml`。
  - 列表/空状态/分页分别交给 `article-card.html`、`empty-state.html`、`pagination.html` partial（传入 `.` 页面上下文）。

#### `layouts/_default/list.html` — 章节列表页
- **作用**：渲染「区块页」（section，如 `/posts/`）。注意：单个分类/标签下的文章列表由 `taxonomy/term.html` 负责，本文件不承接 term 页。
- **渲染部分**：侧边栏 + 带标题/简介的页头 + 当前页 `.Pages` 渲染成文章卡片列表 + 分页。
- **参数来源**：
  - `.Kind`：`i18n .Kind`（首页外一般映射到 `i18n "section"`/`i18n "term"`）作为页眉小标题。
  - `.Title` / `.Description` / `.Content`：当前列表页的标题、描述、导语（来自内容 front matter 或 `_index.md`）。
  - `.Pages` + `.Paginate`：子页面列表与分页。
  - 卡片/空状态/分页交给 `article-card.html`、`empty-state.html`、`pagination.html`。

#### `layouts/_default/single.html` — 单篇文章 / 独立页
- **作用**：渲染单篇内容（文章、about 页等）。
- **渲染部分**：左侧文章主体（阅读进度条、返回链接、标题、日期/阅读时长/字数、标签、导语、封面图、正文、分类）+ 右侧目录（TOC）侧栏。
- **参数来源**：
  - `.Parent.RelPermalink`：父级（区块）链接，用于「返回列表」。
  - `.Title` / `.Date` / `.ReadingTime` / `.WordCount` / `.LinkTitle`：页面自带变量（front matter 与 Hugo 自动计算）。
  - `.GetTerms "tags"` / `.GetTerms "categories"`：该页关联的分类/标签词项，取其 `RelPermalink`、`LinkTitle`。
  - `.Description` / `.Params.image`：front matter 中的 `description`、`image`。
  - `.Content`：渲染后的正文（Markdown 转 HTML）。
  - `.Params.toc` + `.TableOfContents`：是否显示目录及 Hugo 自动生成的目录 HTML（仅当 TOC 含 `<li>` 且未用 `toc: false` 关闭时显示）。

#### `layouts/_default/taxonomy.html` — 分类 / 标签总览页
- **作用**：渲染 `/tags/`、`/categories/` 这种「所有词条的总览页」。
- **渲染部分**：侧边栏 + 页头 + 各词条的统计与「自适应栅格」（交给 `term-grid.html`）。
- **参数来源**：
  - `.Data.Singular`：`i18n .Data.Singular`（映射 `i18n "tag"`/`i18n "category"`）作为页眉小标题。
  - `.Title` / `.Description` / `.Content`：总览页标题与导语。
  - `.Data.Terms`：该分类法下的所有词条（含 `.Page` 与 `.Count`），经 `partial "term-grid.html" (dict "Terms" .Data.Terms)` 传入栅格 partial；`len .` 用于「共 N 项」计数（`i18n "termTotal"`）。
  - 无词条时输出 `empty-state.html`。

#### `layouts/taxonomy/term.html` — 单个分类 / 标签的文章列表页
- **作用**：渲染某个词条下的全部文章（如 `/tags/emacs/`、`/categories/tech/`）。对所有分类法通用（不需为每个单数名各写一份）。
- **渲染部分**：侧边栏 + 页头（小标题取分类法单数名）+ 该词条下的文章卡片列表 + 分页。结构与 `list.html` 一致。
- **参数来源**：
  - `.Data.Singular`：`i18n .Data.Singular`（映射 `i18n "tag"`/`i18n "category"`）作为页眉小标题；`.Title` 为词条名（如 `Emacs`）。
  - `.Pages` + `.Paginate`：该词条关联的文章列表与分页（这是 term 页能显示文章的关键变量）。
  - 卡片/空状态/分页交给 `article-card.html`、`empty-state.html`、`pagination.html`。
- **背景**：主题早期缺少此文件，term 页在本 Hugo 版本下回退到 `_default/list.html` 仍取不到文章，导致子路由只剩空状态；补上 `taxonomy/term.html` 后修复。

#### `layouts/404.html` — 404 页面
- **作用**：找不到页面时的内容区。
- **渲染部分**：`<main>` 内的 404 提示卡片与「返回首页」按钮。
- **参数来源**：纯静态文案，来自 `i18n "pageNotFound" "pageNotFoundDescription" "returnHome"`；`site.Home.RelPermalink` 作为首页链接。

### 局部模板（`layouts/partials/`）

#### `layouts/partials/head.html` — `<head>` 元信息
- **作用**：输出文档头部的字符集、视口、主题色、标题、SEO/Open Graph 描述、canonical、RSS、
  `hreflang` 多语言备用链接、站点样式表与 favicon，并在 `<head>` 内联一小段主题初始化脚本。
- **参数来源**：
  - `.IsHome` / `.Title` / `site.Title`：拼接 `<title>`（首页只用站名，其余用 `标题 · 站名`）。
  - `.Description` / `.Summary` / `site.Params.description`：`<meta description>` 与 OG 描述（依次回退并 `plainify`）。
  - `.Permalink` / `.RelPermalink`：canonical、OG url、RSS 链接。
  - `.OutputFormats.Get "RSS"`：RSS 输出格式（存在才输出 `<link rel="alternate">`）。
  - `.AllTranslations`：遍历页面各语言版本，输出 `hreflang` 备用链接。
  - `.Params.image`：OG 图片（`absURL`）。
  - `site.Params.author` / `site.Params.favicon`：作者与图标（front matter/配置）。
  - `resources.Get "css/main.css" | minify | fingerprint`：经 Hugo Pipes 处理的样式资源。

#### `layouts/partials/header.html` — 顶部导航
- **作用**：站点页眉：品牌（头像+站名+标语）、移动端菜单按钮、主导航菜单、社交图标、主题切换、语言切换。
- **参数来源**：
  - `site.Home.RelPermalink` / `site.Title`：品牌链接与站名。
  - `site.Params.avatar`（默认 `images/avatar.webp`）/ `site.Params.tagline` / `site.Params.description`：头像与标语。
  - `site.Menus.main`：配置中定义的 `main` 菜单；`.IsMenuCurrent` / `.HasMenuCurrent` 判断当前项高亮。
  - `site.Params.social`：社交链接列表（`name`/`icon`/`url`），图标经 `icon.html` 渲染；`mailto:` 链接不加新窗口。
  - `hugo.IsMultilingual`：多语言站点才渲染 `language-switcher.html`。
  - 主题切换为静态 SVG；`i18n` 提供无障碍标签文案。

#### `layouts/partials/footer.html` — 页脚
- **作用**：站点页脚：版权行与备案号、RSS 链接。
- **参数来源**：
  - `site.Params.since`（默认 `now.Year`）/ `now.Year` / `site.Params.author`：版权年份区间与作者。
  - `site.Params.icp`：工信部备案号（有才显示，链接到 `beian.miit.gov.cn`）。
  - `.OutputFormats.Get "RSS"`：RSS 链接（配 `icon.html` 的 `rss` 图标）。

#### `layouts/partials/sidebar.html` — 侧边栏
- **作用**：列表/总览页左侧栏：个人资料卡（头像、角色、站名、简介、社交）+ 标签云 + 分类列表。
- **参数来源**：
  - `site.Params.avatar` / `site.Params.profileRole` / `site.Params.author` / `site.Params.description`：资料卡内容。
  - `site.Params.social`：资料卡内社交图标。
  - `site.Taxonomies.tags` / `site.Taxonomies.categories`：全站标签/分类词条；用 `.ByCount` 排序，`first 12` / `first 8` 限制数量，取 `.Page.RelPermalink`、`.Page.LinkTitle`、`.Count`（词条计数）。

#### `layouts/partials/article-card.html` — 文章卡片
- **作用**：列表/首页中单篇文章的卡片（封面、日期、阅读时长、标题、摘要、标签、阅读更多）。
- **参数来源**：调用时传入的页面上下文 `.`（来自 `list.html`/`index.html` 的 `range $paginator.Pages`）：
  - `.Params.image`：封面图（`relURL`；无图则不渲染封面）。
  - `.RelPermalink` / `.LinkTitle`：文章链接与标题。
  - `.Date` / `.ReadingTime`：日期与阅读时长（`.Date.IsZero` 判断有无日期）。
  - `.Summary | plainify | truncate 180`：摘要（纯文本截断 180 字）。
  - `.GetTerms "tags"` + `first 3`：最多 3 个标签。

#### `layouts/partials/splash.html` — 首屏
- **作用**：首页专属的一整屏开场（标题、副标题、每日一言、向下滚动提示），背景透出 `.site-background` 大图。
- **参数来源**：
  - `site.Params.splash`：`title`/`subtitle`/`blur`（均带回退：`title`→`site.Title`，`subtitle`→`site.Params.tagline`，`blur`→14）。
  - 内部调用 `daily-quote.html` 渲染每日一言；`i18n "scrollToExplore"` 提供滚动提示文案。

#### `layouts/partials/daily-quote.html` — 每日一言
- **作用**：输出「每日一言」区块，把配置通过 `data-*` 属性传给前端 `assets/js/main.js`，由其请求接口、缓存、打字机与随机入场动画。
- **参数来源**：全部来自 `site.Params.dailyQuote`：
  - `enable`（默认开启）、`cacheDaily`（默认开启）、`sources`、`fallbacks`、`timeout`（默认 6000）、`typeSpeed`（默认 70）。
  - 这些字段经 `jsonify` 写入 `data-*` 属性；标签文案来自 `i18n "dailyQuote" "quoteLoading"`。

#### `layouts/partials/empty-state.html` — 空状态
- **作用**：列表/总览/首页在没有内容时显示的占位提示。
- **参数来源**：无外部参数，纯静态文案取自 `i18n "nothingHere" "nothingHereDescription"`。

#### `layouts/partials/pagination.html` — 分页
- **作用**：上一页 / 页码 / 下一页导航。
- **参数来源**：调用时传入的 `.`（页面上下文），使用 `.Paginator`：
  - `.TotalPages`：总页数（≤1 不渲染）。
  - `.Prev` / `.Next`：上一/下一页对象（`URL`、无则禁用箭头）。
  - `.Pagers`：所有页码页对象（`.URL`、`.PageNumber`）；`$.Paginator.PageNumber` 高亮当前页。

#### `layouts/partials/language-switcher.html` — 语言切换
- **作用**：多语言站点的语言选择下拉（`<details>`）。
- **参数来源**：
  - `.AllTranslations`：遍历当前页各语言版本，`RelPermalink` 为切换链接，`Language.Locale` 为 `lang` 属性，`Language.Label` 为显示名；当前语言加 `aria-current`。
  - `site.Language.Label`：当前语言标签；`i18n "selectLanguage"` 为无障碍标签。

#### `layouts/partials/term-grid.html` — 词条自适应栅格
- **作用**：把分类/标签词条渲染成「宽度随标题视觉宽度自适应」的栅格（字多的占更多列）。
- **参数来源**：调用方以 `dict "Terms" .Data.Terms` 传入，故内部用 `.Terms`：
  - `range .ByCount`：按计数排序的词条；`.Page.LinkTitle` 为名称、`.Count` 为计数、`.Page.RelPermalink` 为链接。
  - 通过计算 CJK/全角字符（`findRE` 匹配 `\p{Han}` 等）占 2 单位、其余 1 单位，得到 `$visualWidth`，再映射成 12 栅格下的 `--term-span` 与窄屏 `--term-span-sm`。

#### `layouts/partials/icon.html` — 内联 SVG 图标
- **作用**：按名称输出内联 SVG 图标（无外部图标依赖），支持 `github`/`bilibili`/`email`/`rss` 及默认 link 图标。
- **参数来源**：调用方以 `dict "name" .icon` 传入，内部用 `.name`（默认 `link`）；`svg` 的 `viewBox` 固定为 `0 0 24 24`，路径 `d` 为内嵌硬编码。

### 参数来源速查

| 来源 | 在模板中以什么形式出现 | 说明 |
| --- | --- | --- |
| 站点配置（`config` 的 `params`/`title`/`menus`/`taxonomies`） | `site.Params.*`、`site.Title`、`site.Menus.main`、`site.Taxonomies.*` | 站点级、跨页面共享 |
| 当前渲染页面（Page 对象） | `.Title`、`.Content`、`.Summary`、`.Date`、`.ReadingTime`、`.WordCount`、`.Params.*`、`.RelPermalink`、`.Pages`、`.Kind`、`.IsHome`、`.GetTerms`、`i18n` | 由 Hugo 根据 URL 自动选定并传入 |
| 内容 front matter | `.Params.image`、`.Params.toc`、`.Description`、`.Date` 等 | 写在 `content/**` 的 Markdown 头信息里 |
| partial 调用参数 | `dict "name" …` / `dict "Terms" …` | 调用方显式传入，partial 内用 `.name` / `.Terms` 取 |
| `i18n/*.yaml` | `i18n "key"` | 按当前语言返回翻译文案 |
| Hugo Pipes 资源 | `resources.Get "css/main.css" \| minify \| fingerprint` | 经处理后得到 `RelPermalink`/`Data.Integrity` |
