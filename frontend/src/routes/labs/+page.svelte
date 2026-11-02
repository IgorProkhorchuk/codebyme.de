<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="Linux Labs - CodeByMe" description="Interactive Linux labs are under preparation. Come back soon to test them." path="/labs" noindex />

<section class="labs">
	<span class="status">WORK IN PROGRESS</span>
	<h1>Linux labs are under preparation.</h1>
	<p>Come back soon to test them. We’re preparing hands-on Linux troubleshooting challenges where you can learn by solving real problems.</p>
	<div class="terminal" aria-hidden="true"><span>$</span> ./start-lab<br /><span>Preparing your next challenge…</span><span class="cursor">▍</span></div>
	<a href="/blog">Explore the articles →</a>
</section>

<style>
	.labs { max-width: 740px; margin: 3rem auto; padding: 2rem 1rem; }
	.status { color: var(--accent, #ea580c); font-size: .8rem; font-weight: 700; letter-spacing: .12em; }
	h1 { font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.15; margin: 1rem 0; }
	p { color: #64748b; font-size: 1.15rem; line-height: 1.8; }
	.terminal { background: #1e293b; color: #f8fafc; padding: 1.5rem; margin: 2rem 0; border-radius: 12px; font-family: monospace; line-height: 2; overflow-wrap: anywhere; }
	.terminal span { color: #fb923c; } .cursor { margin-left: .4rem; }
	a { color: var(--accent, #ea580c); font-weight: 600; }
</style>
