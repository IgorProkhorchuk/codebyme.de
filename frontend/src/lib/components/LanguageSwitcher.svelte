<script lang="ts">
	import { page } from '$app/stores';

	$: currentLang = $page.params.lang || 'en';
	
	function getUrlForLang(newLang: string): any {
		const path = $page.url.pathname;
		const search = $page.url.search;
		const isEn = newLang === 'en';
		
		let newPath: any = path;
		if (currentLang === 'en' && !isEn) {
			newPath = `/${newLang}${path === '/' ? '' : path}`;
		} else if (currentLang === 'uk' && isEn) {
			newPath = path.replace('/uk', '') || '/';
		}
		
		return newPath + search;
	}
</script>

<div class="lang-switcher">
	<a href={getUrlForLang('en')} class:active={currentLang === 'en'}>EN</a>
	<span class="separator">|</span>
	<a href={getUrlForLang('uk')} class:active={currentLang === 'uk'}>UK</a>
</div>

<style>
	.lang-switcher {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.9rem;
		font-weight: 600;
		margin-left: 1rem;
	}

	.lang-switcher a {
		color: var(--text-color, #666);
		text-decoration: none;
		transition: color 0.2s;
	}

	.lang-switcher a:hover {
		color: var(--primary, #1a1a1a);
	}

	.lang-switcher a.active {
		color: var(--accent, #4a90e2);
		font-weight: 700;
	}

	.separator {
		color: #ccc;
		font-weight: 400;
	}
</style>
