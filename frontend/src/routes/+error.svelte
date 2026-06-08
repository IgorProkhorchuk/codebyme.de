<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} - Error</title>
</svelte:head>

<div class="error-container">
  <div class="status-code">{$page.status}</div>
  
  <div class="image-wrapper">
    <img src="/404-cat.png" alt="Lost cat illustration" />
  </div>

  <h1>{#if $page.status === 404}Page Not Found{:else}Something went wrong{/if}</h1>
  
  <p class="message">
    {#if $page.status === 404}
      The page you are looking for doesn't exist or has been moved.
    {:else}
      An unexpected error occurred. {$page.error?.message || ''}
    {/if}
  </p>

  <a href="/" class="btn">Return Home</a>
</div>

<style>
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem 0;
    position: relative;
    max-width: 600px;
    margin: 0 auto;
  }

  .status-code {
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(8rem, 20vw, 18rem);
    font-weight: 900;
    color: var(--border-color, #e0e0e0);
    z-index: -1;
    opacity: 0.4;
    user-select: none;
  }

  .image-wrapper {
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
  }

  .image-wrapper img {
    max-width: 320px;
    width: 100%;
    height: auto;
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease;
  }

  .image-wrapper img:hover {
    transform: translateY(-5px);
  }

  h1 {
    font-size: 2.5rem;
    color: var(--primary, #1a1a1a);
    margin-bottom: 1rem;
    font-weight: 800;
    z-index: 1;
  }

  .message {
    font-size: 1.1rem;
    color: #666;
    line-height: 1.6;
    margin-bottom: 2.5rem;
    z-index: 1;
  }

  .btn {
    display: inline-block;
    background-color: var(--accent, #4a90e2);
    color: white;
    padding: 1rem 2.5rem;
    border-radius: 50px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    z-index: 1;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    filter: brightness(1.05);
  }
</style>
