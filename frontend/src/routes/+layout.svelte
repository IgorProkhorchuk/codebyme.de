<script>
  import '../app.css';
</script>

<div class="layout">
  <header>
    <div class="container navbar">
      <a href="/" class="brand">CodeByMe<span class="dot">.de</span></a>
      
      <nav>
        <a href="/blog">Blog</a>
        <a href="/tutorials">Tutorials</a>
        <a href="/tools">Tools</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <slot />
  </main>

  <footer>
    <div class="container">
      <p>&copy; 2025 CodeByMe.de | Engineering & Linux</p>
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

  nav { display: flex; gap: 1.5rem; }
  nav a { font-size: 0.95rem; font-weight: 600; color: #555; transition: color 0.2s; }
  nav a:hover { color: var(--accent); }

  main { flex: 1; padding-top: 3rem; padding-bottom: 3rem; }

  footer { margin-top: auto; padding: 2rem 0; text-align: center; color: #888; font-size: 0.9rem; border-top: 1px solid var(--border-color); }
</style>