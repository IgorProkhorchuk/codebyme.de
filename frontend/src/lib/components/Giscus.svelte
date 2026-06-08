<script lang="ts">
  import { onMount } from 'svelte';

  // These values should be replaced with the ones from https://giscus.app/
  export let repo = 'IgorProkhorchuk/codebyme';
  export let repoId = 'R_kgDOMuL5oQ'; // Placeholder - get real one from giscus.app
  export let category = 'Announcements';
  export let categoryId = 'DIC_kwDOMuL5oc4Cka1r'; // Placeholder
  export let mapping = 'pathname';
  export let strict = '0';
  export let reactionsEnabled = '1';
  export let emitMetadata = '0';
  export let inputPosition = 'bottom';
  export let theme = 'light';
  export let lang = 'en';

  let giscusContainer: HTMLDivElement;

  onMount(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-strict', strict);
    script.setAttribute('data-reactions-enabled', reactionsEnabled);
    script.setAttribute('data-emit-metadata', emitMetadata);
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', lang);
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    if (giscusContainer) {
      giscusContainer.appendChild(script);
    }
  });
</script>

<div class="giscus-wrapper">
  <h3>Comments</h3>
  <p class="giscus-notice">
    Please ensure Giscus is configured with your correct Repository ID and Category ID at <a href="https://giscus.app/" target="_blank" rel="noopener">giscus.app</a> to enable comments.
  </p>
  <div bind:this={giscusContainer} class="giscus"></div>
</div>

<style>
  .giscus-wrapper {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color, #eaeaea);
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--primary, #1a1a1a);
  }

  .giscus-notice {
    font-size: 0.9rem;
    color: #666;
    background: #f9fafb;
    padding: 1rem;
    border-radius: 8px;
    border: 1px dashed #ccc;
    margin-bottom: 2rem;
  }
</style>
