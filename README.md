# CodeByMe.de

built with SvelteKit, TypeScript and mdsvex. Articles live in Git as Markdown;

## Development

Node.js 22 LTS

## Articles and search

Add Markdown files directly to `frontend/src/content/blog/`. The filename is the permanent article slug; keep existing slugs stable for links and Giscus discussions.

```yaml
---
title: "My article"
description: "A concise summary for search engines and article listings."
date: "2026-10-18"
lang: en
category: TECH
tags: [linux, networking]
---
```

Use `lang: uk`, `en` or `de` for the actual article language. This sets the HTML language, without introducing translations or language-specific routes. Add `updated: "YYYY-MM-DD"` only when the article has materially changed; sitemap `lastmod` uses that field. Without a description, a short text excerpt is generated.