<script lang="ts">
  import { onMount } from 'svelte';

  export let repo = 'IgorProkhorchuk/codebyme.de';
  export let repoId = 'R_kgDOQK8eLA';
  export let category = 'Announcements';
  export let categoryId = 'DIC_kwDOQK8eLM4DI4aJ';
  export let mapping = 'pathname';
  export let strict = '1';
  export let reactionsEnabled = '1';
  export let emitMetadata = '0';
  export let inputPosition = 'bottom';
  export let theme = 'light';
  export let lang = 'en';

  let giscusContainer: HTMLDivElement;

  onMount(() => {
    if (!repo || !repoId || !categoryId || !giscusContainer) return;

    const container = giscusContainer;
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

    container.appendChild(script);

    return () => container.replaceChildren();
  });
</script>

{#if repo && repoId && categoryId}
<div class="giscus-wrapper">
  <h3>Comments</h3>
  <div bind:this={giscusContainer} class="giscus"></div>
</div>
{/if}

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

</style>
