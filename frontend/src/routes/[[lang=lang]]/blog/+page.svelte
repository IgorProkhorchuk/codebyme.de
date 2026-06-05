<script lang="ts">
	import { t, locale } from '$lib/i18n';
	export let data;
	
	$: langPrefix = $locale === 'uk' ? '/uk' : '';
</script>

<svelte:head>
	<title>{data.currentCategory ? (data.currentCategory.toUpperCase() === 'TECH' ? $t('blog.tech_title') : $t('blog.life_title')) : $t('blog.all_articles')} - CodeByMe</title>
</svelte:head>

<div class="blog-list-container">
	<header class="page-header">
		<h1>
			{#if data.currentCategory}
				{data.currentCategory.toUpperCase() === 'TECH' ? $t('blog.tech_title') : $t('blog.life_title')}
			{:else}
				{$t('blog.all_articles')}
			{/if}
		</h1>
		<p class="subtitle">{$t('blog.subtitle')}</p>
	</header>

	{#if data.posts.length === 0}
		<div class="empty-state">
			<p>{$t('blog.empty_state')}</p>
		</div>
	{:else}
		<div class="posts-grid">
			{#each data.posts as post}
				<a href="{langPrefix}/blog/{post.slug}" class="post-card">
					<div class="post-meta">
						<span class="category" data-cat={post.category}>{post.category}</span>
						<time>{post.date}</time>
					</div>
					<h2>{post.title}</h2>
					{#if !post.isTranslated}
						<div class="untranslated-badge">English</div>
					{/if}
					<div class="read-more">{$t('blog.read_more')}</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.blog-list-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	.page-header {
		margin-bottom: 3rem;
		text-align: center;
	}

	.page-header h1 {
		font-size: 3rem;
		font-weight: 800;
		color: var(--primary, #1a1a1a);
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
		font-size: 1.1rem;
	}

	.posts-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.post-card {
		display: block;
		background: white;
		border: 1px solid var(--border-color, #eaeaea);
		border-radius: 12px;
		padding: 2rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s ease;
		box-shadow: 0 4px 6px rgba(0,0,0,0.02);
	}

	.post-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 24px rgba(0,0,0,0.08);
		border-color: #d1d5db;
	}

	.post-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: #888;
	}

	.category {
		background: #f0f4f8;
		color: var(--accent, #4a90e2);
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.8rem;
		letter-spacing: 0.05em;
	}

	.post-card h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a1a;
		margin-bottom: 1.5rem;
		line-height: 1.3;
	}

	.read-more {
		color: var(--accent, #4a90e2);
		font-weight: 600;
		font-size: 0.95rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #f9fafb;
		border-radius: 12px;
		color: #6b7280;
	}
</style>