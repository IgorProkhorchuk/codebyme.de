<script lang="ts">
	import { goto } from '$app/navigation';
	export let data;

	let searchQuery = data.currentSearch || '';

	function handleSearch(e: Event) {
		e.preventDefault();
		const url = new URL(window.location.href);
		if (searchQuery.trim()) {
			url.searchParams.set('q', searchQuery.trim());
		} else {
			url.searchParams.delete('q');
		}
		goto(url.toString(), { keepFocus: true });
	}
</script>

<svelte:head>
	<title>{data.currentCategory ? (data.currentCategory.toUpperCase() === 'TECH' ? 'Tech Blog' : 'Life Blog') : 'All Articles'} - CodeByMe</title>
</svelte:head>

<div class="blog-list-container">
	<header class="page-header">
		<h1>
			{#if data.currentSearch}
				Search: {data.currentSearch}
			{:else if data.currentTag}
				Tag: #{data.currentTag}
			{:else if data.currentCategory}
				{data.currentCategory.toUpperCase() === 'TECH' ? 'Tech Blog' : 'Life Blog'}
			{:else}
				All Articles
			{/if}
		</h1>
		
		<form class="search-form" on:submit={handleSearch}>
			<input 
				type="search" 
				placeholder="Search articles..." 
				bind:value={searchQuery}
				class="search-input"
			/>
			<button type="submit" class="search-btn">Search</button>
		</form>
	</header>

	{#if data.posts.length === 0}
		<div class="empty-state">
			<p>No articles found.</p>
		</div>
	{:else}
		<div class="posts-grid">
			{#each data.posts as post}
				<a href="/blog/{post.slug}" class="post-card">
					<div class="post-meta">
						<span class="category" data-cat={post.category}>{post.category}</span>
						<time>{post.date}</time>
						<span class="reading-time">⏱ {post.readingTime}</span>
					</div>
					<h2>{post.title}</h2>
					{#if post.tags && post.tags.length > 0}
						<div class="tags">
							{#each post.tags as tag}
								<span class="tag">#{tag}</span>
							{/each}
						</div>
					{/if}
					<div class="read-more">Read more</div>
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
		margin-bottom: 2rem;
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

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.tag {
		font-size: 0.8rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
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

	.reading-time {
		color: #888;
		font-size: 0.85rem;
		margin-left: auto;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #f9fafb;
		border-radius: 12px;
		color: #6b7280;
	}
</style>