<script lang="ts">
	import { goto } from '$app/navigation';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';
	export let data: PageData;
	let searchQuery = '';

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) goto(`/blog?q=${encodeURIComponent(searchQuery.trim())}`);
	}
</script>

<Seo title="CodeByMe.de | Build. Deploy. Document." description="Practical guides to Linux, networking, containers and software development. Explore articles, commands and lessons from real projects." />

<section class="hero">
	<h1>Build. Deploy. <span class="highlight">Document.</span></h1>
	<form class="search-form" action="/blog" method="GET" on:submit={handleSearch}>
		<input type="search" name="q" aria-label="Search article titles and full text" placeholder="Search articles..." maxlength="200" bind:value={searchQuery} />
		<button type="submit">Search</button>
	</form>
</section>

<section class="topics-section" aria-labelledby="topics-heading">
	<h2 id="topics-heading">Explore topics</h2>
	<div class="topics-grid">
		{#each data.topics as topic}
			<a class="topic-card" href="/blog?topic={topic.slug}">
				<h3>{topic.title}</h3>
				<p>{topic.description}</p>
				<div class="topic-footer"><span>{topic.count} {topic.count === 1 ? 'article' : 'articles'}</span><span aria-hidden="true">→</span></div>
			</a>
		{/each}
	</div>
</section>

<section class="cheatsheets-section" aria-labelledby="cheatsheets-heading">
	<h2 id="cheatsheets-heading">Cheatsheets</h2>
	<div class="cheatsheet-links">
		{#each data.cheatsheets as sheet}
			<a href="/blog/{sheet.slug}">{sheet.title} <span aria-hidden="true">↗</span></a>
		{/each}
	</div>
</section>

<section class="recent-posts-section" aria-labelledby="latest-heading">
	<div class="section-heading">
		<h2 id="latest-heading">Latest articles</h2>
		<a href="/blog">View all articles <span aria-hidden="true">→</span></a>
	</div>
	<div class="posts-list">
		{#each data.recentPosts as post}
			<a href="/blog/{post.slug}" class="post-row">
				<div class="post-summary"><h3>{post.title}</h3><p>{post.description}</p></div>
				<div class="post-meta"><time datetime={post.date}>{post.date}</time><span>{post.readingTime}</span></div>
			</a>
		{/each}
	</div>
</section>

<style>
	.hero { text-align: center; margin-bottom: 3rem; }
	h1 { font-size: clamp(2rem, 5vw, 3rem); color: var(--primary); margin-bottom: 1.25rem; letter-spacing: -1px; }
	.highlight { color: var(--accent); }
	.search-form { display: flex; gap: 0.5rem; max-width: 500px; margin: 0 auto; }
	.search-form input { flex: 1; min-width: 0; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; font: inherit; background: white; }
	.search-form button { background: var(--accent); color: white; border: none; padding: 0 1.25rem; border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; }
	.search-form button:hover { filter: brightness(0.95); }
	a:focus-visible, input:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
	h2 { font-size: 1.5rem; color: var(--primary); margin-bottom: 1.25rem; font-weight: 700; }
	h3 { font-size: 1.1rem; font-weight: 600; color: var(--primary); }
	.topics-section, .cheatsheets-section { margin-bottom: 3rem; }
	.topics-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
	.topic-card { display: flex; flex-direction: column; padding: 1.3rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; transition: border-color 0.2s, box-shadow 0.2s; }
	.topic-card:hover { border-color: var(--accent); box-shadow: var(--shadow); }
	.topic-card p { margin: 0.4rem 0 1.2rem; color: #66717e; font-size: 0.9rem; }
	.topic-footer { display: flex; justify-content: space-between; gap: 1rem; margin-top: auto; color: #66717e; font-size: 0.85rem; }
	.topic-footer > :last-child { color: var(--accent); }
	.cheatsheet-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
	.cheatsheet-links a { display: inline-flex; align-items: center; gap: 1rem; padding: 0.6rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); font-weight: 600; font-size: 0.95rem; }
	.cheatsheet-links a:hover { border-color: var(--accent); color: var(--accent); }
	.cheatsheet-links span { color: #66717e; }
	.section-heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem 1rem; margin-bottom: 1.25rem; }
	.section-heading h2 { margin: 0; }
	.section-heading a { font-size: 0.9rem; color: var(--primary); font-weight: 600; }
	.section-heading a:hover { color: var(--accent); }
	.posts-list { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
	.post-row { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.25rem 1.5rem; }
	.post-row + .post-row { border-top: 1px solid var(--border-color); }
	.post-row:hover { background: #f1f3f5; }
	.post-row:focus-visible { outline-offset: -4px; }
	.post-summary { min-width: 0; }
	.post-summary p { font-size: 0.9rem; color: #66717e; margin-top: 0.35rem; overflow-wrap: anywhere; }
	.post-meta { display: flex; flex-direction: column; gap: 0.3rem; flex-shrink: 0; text-align: right; color: #66717e; font-size: 0.8rem; }
	@media (max-width: 800px) { .topics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 500px) {
		.topics-grid { grid-template-columns: 1fr; }
		.post-row { flex-direction: column; align-items: flex-start; gap: 0.75rem; padding: 1.1rem; }
		.post-meta { flex-direction: row; gap: 1rem; text-align: left; }
	}
</style>
