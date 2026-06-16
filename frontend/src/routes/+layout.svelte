<script lang="ts">
  import { page } from '$app/stores';
  import '../app.css';
  import 'prism-themes/themes/prism-one-dark.css';
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
  import { t } from '$lib/i18n';

  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  // Close menu on navigation
  $: {
    if ($page.url.pathname) {
      menuOpen = false;
    }
  }
</script>

<div class="layout">
  <header>
    <div class="container navbar">
      <a href="/" class="brand">CodeByMe<span class="dot">.de</span></a>
      
      <button class="mobile-menu-btn" on:click={toggleMenu} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          {#if menuOpen}
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          {:else}
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          {/if}
        </svg>
      </button>

      <nav class:open={menuOpen}>
        <a href="{$page.params.lang === 'uk' ? '/uk' : ''}/blog?category=TECH">{t('techBlog', $page.params.lang)}</a>
        <a href="{$page.params.lang === 'uk' ? '/uk' : ''}/blog?category=NON_TECH">{t('lifeBlog', $page.params.lang)}</a>
        <a href="{$page.params.lang === 'uk' ? '/uk' : ''}/labs">{t('labs', $page.params.lang)}</a>
        <LanguageSwitcher />
      </nav>
    </div>
  </header>

  <main class="container">
    <slot />
  </main>

  <footer>
    <div class="container">
      <p>&copy; 2025 CodeByMe.de | Engineering</p>
      <div class="legal-links">
        <a href="{$page.params.lang === 'uk' ? '/uk' : ''}/impressum">{t('impressum', $page.params.lang)}</a>
        <a href="{$page.params.lang === 'uk' ? '/uk' : ''}/datenschutz">{t('datenschutz', $page.params.lang)}</a>
      </div>
    </div>
  </footer>
</div>

<style>
  .layout { display: flex; flex-direction: column; min-height: 100vh; }
  .container { width: 100%; max-width: 1000px; margin: 0 auto; padding: 0 1.5rem; }

  header { background: #ffffff; border-bottom: 1px solid var(--border-color); padding: 1.25rem 0; }
  .navbar { display: flex; justify-content: space-between; align-items: center; }
  
  .brand { font-weight: 800; font-size: 1.25rem; color: var(--primary); }
  .dot { color: var(--accent); }

  nav { display: flex; gap: 1.5rem; align-items: center; }
  nav a { font-size: 0.95rem; font-weight: 600; color: #555; transition: color 0.2s; }
  nav a:hover { color: var(--accent); }

  .mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--primary);
    padding: 0.5rem;
  }

  main { flex: 1; padding-top: 3rem; padding-bottom: 3rem; }

  footer { margin-top: auto; padding: 2rem 0; text-align: center; color: #888; font-size: 0.9rem; border-top: 1px solid var(--border-color); }
  .legal-links { margin-top: 0.5rem; display: flex; justify-content: center; gap: 1rem; }
  .legal-links a { color: #888; transition: color 0.2s; }
  .legal-links a:hover { color: var(--accent); }

  @media (max-width: 640px) {
    .mobile-menu-btn {
      display: block;
    }

    .navbar {
      flex-wrap: wrap;
    }

    nav {
      display: none;
      flex-direction: column;
      width: 100%;
      gap: 1rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border-color);
      margin-top: 1rem;
    }

    nav.open {
      display: flex;
    }

    nav a {
      width: 100%;
      text-align: center;
      padding: 0.5rem;
    }
  }
</style>