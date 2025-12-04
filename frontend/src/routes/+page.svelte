<svelte:head>
  <title>CodeByMe.de | Developer Portfolio</title>
</svelte:head>

<section class="hero">
  <h1>Build. Deploy. <span class="highlight">Document.</span></h1>
  <p class="intro">
    A digital workspace for Java architecture, Linux operations, and developer utilities.
  </p>
</section>

<div class="grid">
  <a href="/blog" class="card">
    <div class="card-icon">✍️</div>
    <h3>Tech Blog</h3>
    <p>Architecture notes on Spring Boot 4.0, Java 25, and SvelteKit.</p>
  </a>

  <a href="/tutorials" class="card">
    <div class="card-icon">🐧</div>
    <h3>Linux Guides</h3>
    <p>Reference manuals for RHEL/AlmaLinux, SELinux, and Docker.</p>
  </a>

  <a href="/tools/pdf" class="card tool-highlight">
    <div class="card-icon">📄</div>
    <h3>PDF Generator</h3>
    <p>Create DIN 5008 compliant envelopes and documents.</p>
    <div class="link-text">Open Tool &rarr;</div>
  </a>

  <div class="card disabled">
    <div class="status">Beta</div>
    <div class="card-icon">💻</div>
    <h3>Linux Labs</h3>
    <p>Interactive ephemeral terminals for practicing CLI commands.</p>
  </div>
</div>

<style>
  /* Hero Section */
  .hero { text-align: center; margin-bottom: 4rem; }
  h1 { font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem; letter-spacing: -1px; }
  .highlight { color: var(--accent); }
  .intro { color: #666; font-size: 1.15rem; max-width: 600px; margin: 0 auto; }

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
    transition: transform 0.2s ease, box-shadow 0.2s ease;
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

  .card-icon { font-size: 2rem; margin-bottom: 1rem; }
  h3 { margin-bottom: 0.5rem; color: var(--primary); }
  p { color: #666; font-size: 0.95rem; margin-bottom: 1.5rem; flex-grow: 1; }

  /* Tool Specifics */
  .tool-highlight { border-top: 4px solid var(--primary); }
  .link-text { font-weight: 600; color: var(--accent); font-size: 0.9rem; }

  /* Disabled/Beta State */
  .card.disabled { background: #f1f3f5; cursor: not-allowed; opacity: 0.8; box-shadow: none; border: 1px dashed #ccc; }
  .status {
    position: absolute; top: 1rem; right: 1rem;
    background: #e9ecef; color: #666;
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    padding: 0.2rem 0.5rem; border-radius: 4px;
  }
</style>