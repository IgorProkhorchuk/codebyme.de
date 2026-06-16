<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';
	import Giscus from '$lib/components/Giscus.svelte';
	
	export let data: {
		content: any;
		meta: {
			title: string;
			date: string;
			category: string;
			readingTime: string;
		};
	};

	onMount(() => {
		// Render Mermaid diagrams using mermaid.ink (just like GitHub does)
		const mermaidBlocks = document.querySelectorAll('.language-mermaid');
		mermaidBlocks.forEach((block: Element) => {
			const code = block.textContent || '';
			const base64 = btoa(unescape(encodeURIComponent(code)));
			
			block.innerHTML = `<img src="https://mermaid.ink/svg/${base64}" alt="Mermaid diagram" style="max-width: 100%; height: auto; margin: 0 auto; display: block; border-radius: 8px; padding: 1rem; background: white;" />`;
			(block as HTMLElement).style.display = 'block';
			
			const pre = block.parentElement;
			if (pre) {
				pre.style.background = 'transparent';
				pre.style.padding = '0';
				pre.style.boxShadow = 'none';
			}
		});

		// Copy Buttons
		const preElements = document.querySelectorAll('.markdown-content pre');
		preElements.forEach((pre) => {
			if (pre.querySelector('.language-mermaid')) return; // skip mermaid blocks

			const btn = document.createElement('button');
			btn.className = 'copy-btn';
			btn.title = 'Copy to clipboard';
			btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
			
			btn.addEventListener('click', async () => {
				const code = pre.querySelector('code')?.innerText || '';
				await navigator.clipboard.writeText(code);
				btn.classList.add('copied');
				btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
				
				setTimeout(() => {
					btn.classList.remove('copied');
					btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
				}, 2000);
			});

			pre.appendChild(btn);
		});
	});
</script>

<svelte:head>
	<title>{data.meta.title} - CodeByMe</title>
</svelte:head>

<article class="post-container">
		<header class="post-header">
			<h1>{data.meta.title}</h1>
			<div class="meta">
				<time>{data.meta.date}</time>
				<span class="reading-time">⏱ {data.meta.readingTime || 1} {t('minRead', $page.params.lang)}</span>
				<span class="divider">•</span>
				<span class="category">{data.meta.category}</span>
			</div>
		</header>
		
		<div class="markdown-content">
			<svelte:component this={data.content} />
		</div>

		<Giscus />
</article>

<style>
	.post-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	.post-header {
		margin-bottom: 3rem;
		border-bottom: 1px solid var(--border-color, #eaeaea);
		padding-bottom: 1.5rem;
	}

	.post-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--primary, #1a1a1a);
		margin-bottom: 1rem;
		line-height: 1.2;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #666;
		font-size: 0.95rem;
	}

	.meta time {
		color: #666;
	}

	.reading-time {
		color: #888;
	}

	.divider {
		font-size: 0.95rem;
	}

	.category {
		background: #f0f4f8;
		color: var(--accent, #4a90e2);
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.85rem;
	}

	/* Markdown Content Styling */
	.markdown-content :global(h1) { font-size: 2.25rem; font-weight: bold; margin: 2rem 0 1rem; color: #1a1a1a; }
	.markdown-content :global(h2) { font-size: 1.8rem; font-weight: 600; margin: 1.8rem 0 1rem; color: #222; }
	.markdown-content :global(h3) { font-size: 1.4rem; font-weight: 600; margin: 1.5rem 0 0.8rem; color: #333; }
	.markdown-content :global(p) { line-height: 1.7; margin-bottom: 1.2rem; color: #3b4252; font-size: 1.05rem; }
	.markdown-content :global(a) { color: var(--accent, #4a90e2); text-decoration: underline; }
	
	.markdown-content :global(pre) { 
		background: #1e1e1e; 
		color: #d4d4d4; 
		padding: 1.2rem; 
		border-radius: 8px; 
		overflow-x: auto; 
		margin: 1.5rem 0; 
		box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		position: relative;
	}
	
	.markdown-content :global(.copy-btn) {
		position: absolute;
		top: 8px;
		right: 8px;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: #a3a3a3;
		padding: 6px;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		opacity: 0;
	}
	.markdown-content :global(pre:hover .copy-btn) {
		opacity: 1;
	}
	.markdown-content :global(.copy-btn:hover) {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}
	.markdown-content :global(.copy-btn.copied) {
		opacity: 1;
		background: rgba(74, 222, 128, 0.1);
	}
	.markdown-content :global(code) { 
		font-family: 'Fira Code', 'Consolas', monospace; 
		font-size: 0.9rem;
	}
	.markdown-content :global(p > code) {
		background: #f4f4f5;
		color: #e83e8c;
		padding: 0.2em 0.4em;
		border-radius: 4px;
	}

	.markdown-content :global(ul) { list-style-type: disc; margin: 0 0 1.5rem 1.5rem; }
	.markdown-content :global(ol) { list-style-type: decimal; margin: 0 0 1.5rem 1.5rem; }
	.markdown-content :global(li) { margin-bottom: 0.5rem; color: #3b4252; line-height: 1.6; }
	
	.markdown-content :global(blockquote) {
		border-left: 4px solid var(--accent, #4a90e2);
		padding-left: 1rem;
		margin: 1.5rem 0;
		color: #555;
		font-style: italic;
		background: #f8fafc;
		padding: 1rem;
		border-radius: 0 8px 8px 0;
	}
	
	.markdown-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		margin: 2rem auto;
		display: block;
		box-shadow: 0 10px 20px rgba(0,0,0,0.05);
	}
</style>