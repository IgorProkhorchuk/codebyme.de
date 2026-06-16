<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';
	export let data: any;

	let searchQuery = '';

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			const prefix = $page.params.lang === 'uk' ? '/uk' : '';
			goto(`${prefix}/blog?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}
</script>

<svelte:head>
	<title>CodeByMe.de | Build. Deploy. Document.</title>
</svelte:head>

<section class="hero">
	<h1>Build. Deploy. <span class="highlight">Document.</span></h1>
	
	<form class="search-form" on:submit={handleSearch}>
		<input 
			type="search" 
			placeholder={t('searchPlaceholder', $page.params.lang)} 
			bind:value={searchQuery}
			class="search-input"
		/>
		<button type="submit" class="search-btn">{t('searchButton', $page.params.lang)}</button>
	</form>
</section>

<section class="explore-topics">
	<h2>{t('popularTopics', $page.params.lang)}</h2>
	<div class="tag-cloud">
		{#each data.tags as tag}
			<a href="{$page.params.lang === 'uk' ? '/uk' : ''}/blog?tag={tag}" class="tag-pill">#{tag}</a>
		{/each}
	</div>
</section>

<section class="recent-posts-section">
	<h2>{t('recentPosts', $page.params.lang)}</h2>
	<div class="posts-list">
		{#each data.recentPosts as post}
			<a href="{$page.params.lang === 'uk' ? '/uk' : ''}/blog/{post.slug}" class="post-row">
				<div class="post-row-left">
					<time>{post.date}</time>
					<span class="reading-time">⏱ {post.readingTime} {t('minRead', $page.params.lang)}</span>
					<h3>{post.title}</h3>
				</div>
				<div class="post-row-right">
					{#if post.tags}
						{#each post.tags.slice(0, 3) as tag}
							<span class="small-tag">#{tag}</span>
						{/each}
					{/if}
				</div>
			</a>
		{/each}
	</div>
</section>

<style>
	/* Hero Section */
	.hero {
		text-align: center;
		margin-bottom: 4rem;
	}
	h1 {
		font-size: 3rem;
		color: var(--primary);
		margin-bottom: 2rem;
		letter-spacing: -1px;
	}
	.highlight {
		color: var(--accent);
	}

	.search-form {
		display: flex;
		gap: 0.5rem;
		max-width: 500px;
		margin: 0 auto;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 8px;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.search-input:focus {
		border-color: var(--accent, #4a90e2);
	}

	.search-btn {
		background: var(--accent, #4a90e2);
		color: white;
		border: none;
		padding: 0 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.search-btn:hover {
		filter: brightness(1.1);
	}

	/* Explore Topics */
	.explore-topics {
		margin-bottom: 4rem;
	}
	h2 {
		font-size: 1.5rem;
		color: var(--primary);
		margin-bottom: 1.5rem;
		font-weight: 700;
	}
	.tag-cloud {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.tag-pill {
		background: var(--card-bg, #ffffff);
		border: 1px solid var(--border-color, #eaeaea);
		padding: 0.6rem 1.2rem;
		border-radius: 50px;
		color: #4b5563;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0,0,0,0.02);
	}
	.tag-pill:hover {
		color: var(--accent, #4a90e2);
		border-color: var(--accent, #4a90e2);
		box-shadow: 0 0 10px rgba(74, 144, 226, 0.4); /* Neon glow effect */
		transform: translateY(-2px);
	}

	/* Recent Posts */
	.recent-posts-section {
		margin-bottom: 4rem;
	}
	.posts-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.post-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		background: var(--card-bg, #ffffff);
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 12px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
	}
	.post-row:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0,0,0,0.06);
		border-color: #d1d5db;
	}
	.post-row-left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.post-row-left time {
		font-size: 0.9rem;
		color: #666;
		white-space: nowrap;
	}
	.reading-time {
		font-size: 0.85rem;
		color: #888;
		white-space: nowrap;
	}
	.post-row-left h3 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: #1a1a1a;
	}
	.post-row-right {
		display: flex;
		gap: 0.5rem;
	}
	.small-tag {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
	}

	@media (max-width: 640px) {
		.post-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>
