# CodeByMe.de

A personal blog built with SvelteKit, TypeScript and mdsvex. Articles live in Git as Markdown; the blog needs neither Spring nor PostgreSQL. `backend/` is an experimental foundation for future interactive Linux Labs. `/labs` currently shows a preparation notice.

## Development

Use Node.js 22 LTS (20.19+ also supported by Vite 7).

```sh
cd frontend
npm ci
npm run dev
```

Before deploying:

```sh
npm run check
npm run test:unit -- --run --project server
npm run build
npm run preview
```

With preview running, `node scripts/verify-preview.mjs` checks all sitemap URLs, metadata, article languages, search, RSS and Labs against the local build (default port 4173; pass another local origin as the argument if needed).

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

Search at `/blog?q=...` covers titles, tags, categories, article bodies and code examples. All query words must match; title and tag matches rank higher. Category and tag filters also apply. The index is built from Markdown on the SvelteKit server; complete article bodies are not sent to the browser as a search index. Content changes require rebuilding and deploying. No external search service or database is needed.

SEO metadata uses `https://codebyme.de` as the canonical domain. Sitemap and RSS are generated during the build, and `robots.txt` advertises the sitemap. Search/filter pages, error pages and the temporary Labs page are excluded from indexing. RSS is available at `/rss.xml`.

## Blog deployment

The normal GitLab pipeline validates types, runs server unit tests and builds SvelteKit before building/pushing the frontend container and deploying it over SSH. It does not build Java or require database credentials.

The existing registry and SSH CI variables are still required: `CI_REGISTRY_USER`, `CI_REGISTRY_PASSWORD`, `CI_REGISTRY`, `CI_REGISTRY_IMAGE` (GitLab provides these), plus `SSH_PRIVATE_KEY`, `SERVER_USER`, `SERVER_IP`. Production Compose image paths are populated from `CI_PROJECT_NAMESPACE` and `CI_PROJECT_NAME` as before.

The first deployment of this configuration explicitly stops and removes the previous backend and PostgreSQL containers, preventing their old `restart: always` policy from starting them after a server reboot. Their named database volume and the server's existing `.env` remain intact; no volume removal command is used. The frontend keeps port `127.0.0.1:8082`, so the existing reverse proxy continues to work.

Local container build:

```sh
docker compose up -d --build
```

Production, after substituting the registry variables in `docker-compose.prod.yml`:

```sh
docker compose -p codebyme pull frontend
docker compose -p codebyme --profile labs rm -sf backend db
docker compose -p codebyme up -d --no-deps frontend
```

## Optional Labs backend

Spring and PostgreSQL are behind the Compose `labs` profile. Normal `docker compose up` starts only the blog. Before experimenting with Labs, set `DB_NAME`, `DB_USER`, `DB_PASS` in a local/server `.env`; no password is supplied by default. Use the original credentials when reusing an existing database volume.

The backend Dockerfile expects a prebuilt Java 25 JAR:

```sh
cd backend
./gradlew :app:bootJar
cd ..
docker compose --profile labs up -d --build
```

On Windows, use `gradlew.bat`. Setting `RUN_LABS_PIPELINE=true` in GitLab enables the optional Java tests, JAR build and backend image publishing. It does not enable Labs on production: the regular deploy remains blog-only. Starting the experimental backend is a separate, deliberate server operation.
