<script lang="ts">
	export let title: string;
	export let description: string;
	export let path = '/';
	export let article = false;
	export let noindex = false;
	export let published: string | undefined = undefined;
	$: canonical = new URL(path, 'https://codebyme.de').href;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
	<meta property="og:site_name" content="CodeByMe" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content={article ? 'article' : 'website'} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if article && published}<meta property="article:published_time" content={published} />{/if}
</svelte:head>
