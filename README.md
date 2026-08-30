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
