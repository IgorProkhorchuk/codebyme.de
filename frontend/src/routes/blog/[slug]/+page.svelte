<script lang="ts">
  import { page } from '$app/stores';
  
  // Gets the 'slug' from the URL (e.g., exploring-java-25)
  $: slug = $page.params.slug;
</script>

<svelte:head>
  <title>Reading Article... | CodeByMe.de</title>
</svelte:head>

<div class="article-container">
  <a href="/blog" class="back-link">&larr; Back to Blog</a>
  
  <article>
    <h1>Article Placeholder</h1>
    <div class="debug-info">
      Loading content for slug: <strong>{slug}</strong>
    </div>
    <p>
      (This is where the markdown content from Spring Boot will be rendered later.)
    </p>
  </article>
</div>

<style>
  .article-container { max-width: 750px; margin: 0 auto; }
  .back-link { display: inline-block; margin-bottom: 2rem; color: #666; font-size: 0.9rem; }
  .back-link:hover { color: var(--accent); }
  
  h1 { font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem; }
  .debug-info { 
    background: #eef2f5; 
    padding: 1rem; 
    border-radius: 4px; 
    font-family: monospace; 
    margin-bottom: 2rem; 
    border-left: 4px solid var(--accent);
  }
</style>