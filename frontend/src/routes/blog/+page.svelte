<script lang="ts">
  // MOCK DATA - simulating what Spring Boot will eventually send
  const posts = [
    {
      id: 1,
      title: "Exploring Java 25: Virtual Threads Revisited",
      slug: "exploring-java-25",
      excerpt: "Java 25 introduces refined handling for pinned threads. Here is how it impacts high-throughput backend services...",
      tags: ["Java", "Backend"],
      date: "2025-11-15",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Hardening AlmaLinux 9.5 with SELinux",
      slug: "hardening-almalinux-selinux",
      excerpt: "Stop disabling SELinux! Learn how to configure policies correctly for Docker and Apache reverse proxies.",
      tags: ["Linux", "DevOps"],
      date: "2025-10-02",
      readTime: "12 min read"
    },
    {
      id: 3,
      title: "SvelteKit Adapter Node vs. Static",
      slug: "sveltekit-adapter-comparison",
      excerpt: "Why I chose the Node adapter for CodeByMe.de instead of static generation, and the trade-offs involved.",
      tags: ["Frontend", "Svelte"],
      date: "2025-09-20",
      readTime: "8 min read"
    }
  ];

  let searchTerm = "";
</script>

<svelte:head>
  <title>Blog | CodeByMe.de</title>
</svelte:head>

<section class="blog-header">
  <h1>Engineering Log</h1>
  <p>Thoughts on code, infrastructure, and the tools that power them.</p>
  
  <div class="search-wrapper">
    <input 
      type="text" 
      placeholder="Search articles..." 
      bind:value={searchTerm}
    />
    <span class="search-icon">🔍</span>
  </div>
</section>

<div class="posts-grid">
  {#each posts as post}
    <article class="post-card">
      <div class="meta">
        <span class="date">{post.date}</span>
        <span class="dot">•</span>
        <span class="read-time">{post.readTime}</span>
      </div>
      
      <h2>
        <a href="/blog/{post.slug}">{post.title}</a>
      </h2>
      
      <p class="excerpt">{post.excerpt}</p>
      
      <div class="tags">
        {#each post.tags as tag}
          <span class="tag">#{tag}</span>
        {/each}
      </div>
    </article>
  {/each}
</div>

<style>
  /* Header Area */
  .blog-header { margin-bottom: 3rem; border-bottom: 1px solid var(--border-color); padding-bottom: 2rem; }
  h1 { font-size: 2.25rem; color: var(--primary); margin-bottom: 0.5rem; }
  .blog-header p { color: #666; font-size: 1.1rem; margin-bottom: 1.5rem; }

  /* Search Bar Styling */
  .search-wrapper { position: relative; max-width: 400px; }
  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
    font-family: inherit;
  }
  input:focus { outline: 2px solid var(--accent); border-color: transparent; }
  .search-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: #999; font-size: 0.9rem; }

  /* Grid Layout */
  .posts-grid {
    display: grid;
    grid-template-columns: 1fr; /* Single column usually reads better for blogs */
    gap: 2rem;
  }

  /* Post Card */
  .post-card {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    transition: transform 0.2s, border-color 0.2s;
  }
  .post-card:hover { transform: translateY(-2px); border-color: var(--accent); }

  /* Typography inside Card */
  .meta { font-size: 0.85rem; color: #888; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .dot { margin: 0 0.3rem; }
  
  h2 { margin-bottom: 0.75rem; font-size: 1.5rem; }
  h2 a { color: var(--primary); text-decoration: none; }
  h2 a:hover { color: var(--accent); }

  .excerpt { color: #555; margin-bottom: 1.5rem; line-height: 1.7; }

  /* Tags */
  .tags { display: flex; gap: 0.5rem; }
  .tag { 
    font-size: 0.8rem; 
    background: #f1f3f5; 
    color: #555; 
    padding: 0.25rem 0.6rem; 
    border-radius: 4px; 
    font-weight: 600; 
  }
</style>