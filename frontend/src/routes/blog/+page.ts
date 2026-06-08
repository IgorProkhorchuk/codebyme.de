export async function load({ url }) {
	const categoryFilter = url.searchParams.get('category');
	const tagFilter = url.searchParams.get('tag');
	const searchFilter = url.searchParams.get('q');
	
	const allPostFiles = import.meta.glob('/src/content/blog/en/**/*.md', { eager: true });
	
	let finalPosts = Object.entries(allPostFiles)
		.map(([path, post]: [string, any]) => ({
			slug: path.split('/').pop()?.replace('.md', ''),
			title: post.metadata?.title || 'Untitled',
			date: post.metadata?.date || 'Unknown Date',
			category: post.metadata?.category || 'UNCATEGORIZED',
			tags: post.metadata?.tags || [],
			readingTime: post.metadata?.readingTime || '1 min read'
		}));
		
	finalPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	if (categoryFilter) {
		finalPosts = finalPosts.filter(post => post.category.toLowerCase() === categoryFilter.toLowerCase());
	}
	
	if (tagFilter) {
		finalPosts = finalPosts.filter(post => 
			Array.isArray(post.tags) && post.tags.map((t: string) => t.toLowerCase()).includes(tagFilter.toLowerCase())
		);
	}

	if (searchFilter) {
		const q = searchFilter.toLowerCase();
		finalPosts = finalPosts.filter(post => 
			post.title.toLowerCase().includes(q) || 
			(Array.isArray(post.tags) && post.tags.some((t: string) => t.toLowerCase().includes(q))) ||
			post.category.toLowerCase().includes(q)
		);
	}

	return {
		posts: finalPosts,
		currentCategory: categoryFilter,
		currentTag: tagFilter,
		currentSearch: searchFilter
	};
}
