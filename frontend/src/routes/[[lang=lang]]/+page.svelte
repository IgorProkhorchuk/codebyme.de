<script>
	import { t, locale } from '$lib/i18n';
	
	$: langPrefix = $locale === 'uk' ? '/uk' : '';
</script>

<svelte:head>
	<title>CodeByMe.de | Not another tech blog</title>
</svelte:head>

<section class="hero">
	<h1>{$t('home.hero.title_start')}<span class="highlight">{$t('home.hero.title_highlight')}</span></h1>
	<p class="intro">{$t('home.hero.intro')}</p>
</section>

<div class="grid">
	<a href="{langPrefix}/blog?category=tech" class="card">
		<div class="card-icon">💻</div>
		<h3>{$t('home.tech_blog.title')}</h3>
		<p>{$t('home.tech_blog.desc')}</p>
	</a>

	<a href="{langPrefix}/blog?category=non_tech" class="card">
		<div class="card-icon">☕</div>
		<h3>{$t('home.life_blog.title')}</h3>
		<p>{$t('home.life_blog.desc')}</p>
	</a>

	<div class="card disabled">
		<div class="status">{$t('home.labs.beta')}</div>
		<div class="card-icon">🐧</div>
		<h3>{$t('home.labs.title')}</h3>
		<p>{$t('home.labs.desc')}</p>
	</div>
</div>

<style>
	/* Hero Section */
	.hero {
		text-align: center;
		margin-bottom: 4rem;
	}
	h1 {
		font-size: 2.5rem;
		color: var(--primary);
		margin-bottom: 1rem;
		letter-spacing: -1px;
	}
	.highlight {
		color: var(--accent);
	}
	.intro {
		color: #666;
		font-size: 1.15rem;
		max-width: 600px;
		margin: 0 auto;
	}

	/* Grid Layout */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	/* Card Styles */
	.card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: var(--shadow);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}

	.card:not(.disabled):hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		border-color: var(--accent);
	}

	.card-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
	}
	h3 {
		margin-bottom: 0.5rem;
		color: var(--primary);
	}
	p {
		color: #666;
		font-size: 0.95rem;
		margin-bottom: 1.5rem;
		flex-grow: 1;
	}

	/* Disabled/Beta State */
	.card.disabled {
		background: #f1f3f5;
		cursor: not-allowed;
		opacity: 0.8;
		box-shadow: none;
		border: 1px dashed #ccc;
	}
	.status {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: #e9ecef;
		color: #666;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}
</style>
