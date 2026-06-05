<script>
  import { page } from '$app/stores';
  import { t, locale } from '$lib/i18n';
  import '../app.css';
  import 'prism-themes/themes/prism-one-dark.css';

  export let data;

  $: locale.set(data.lang);
  $: langPrefix = $locale === 'uk' ? '/uk' : '';

  function switchLang(newLang) {
      const path = $page.url.pathname;
      let newPath = path;
      if (newLang === 'uk') {
          if (!path.startsWith('/uk')) {
              newPath = '/uk' + (path === '/' ? '' : path);
          }
      } else {
          if (path.startsWith('/uk')) {
              newPath = path.substring(3) || '/';
          }
      }
      // Preserve query params
      return newPath + $page.url.search;
  }
</script>

<div class="layout">
  <header>
    <div class="container navbar">
      <a href="{langPrefix}/" class="brand">CodeByMe<span class="dot">.de</span></a>
      
      <nav>
        <a href="{langPrefix}/blog?category=TECH">{$t('nav.tech_blog')}</a>
        <a href="{langPrefix}/blog?category=NON_TECH">{$t('nav.life_blog')}</a>
        <a href="{langPrefix}/labs">{$t('nav.sysadmin_labs')}</a>
        
        <div class="lang-switcher">
          <a href={switchLang('en')} class:active={$locale === 'en'}>EN</a>
          <span>|</span>
          <a href={switchLang('uk')} class:active={$locale === 'uk'}>UK</a>
        </div>
      </nav>
    </div>
  </header>

  <main class="container">
    <slot />
  </main>

  <footer>
    <div class="container">
      <p>&copy; 2025 CodeByMe.de | Engineering</p>
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

  .lang-switcher { display: flex; gap: 0.5rem; align-items: center; margin-left: 1rem; border-left: 1px solid #ddd; padding-left: 1.5rem; }
  .lang-switcher a { font-size: 0.85rem; font-weight: 600; color: #999; }
  .lang-switcher a.active { color: var(--primary); font-weight: 800; }
  .lang-switcher span { color: #ddd; font-size: 0.85rem; }

  main { flex: 1; padding-top: 3rem; padding-bottom: 3rem; }

  footer { margin-top: auto; padding: 2rem 0; text-align: center; color: #888; font-size: 0.9rem; border-top: 1px solid var(--border-color); }
</style>