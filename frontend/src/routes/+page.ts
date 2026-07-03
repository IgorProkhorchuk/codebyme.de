export async function load() {
	const allPostFiles = import.meta.glob('/src/content/blog/**/*.md', { eager: true });
	
	const finalPosts = Object.entries(allPostFiles)
		.map(([path, post]: [string, any]) => ({
			slug: path.split('/').pop()?.replace('.md', ''),
			title: post.metadata?.title || 'Untitled',
			date: post.metadata?.date || 'Unknown Date',
			category: post.metadata?.category || 'UNCATEGORIZED',
			tags: post.metadata?.tags || [],
			readingTime: post.metadata?.readingTime || '1 min read'
		}));
		
	finalPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const recentPosts = finalPosts.slice(0, 5);

	// Collect tags frequencies
	const tagCounts: Record<string, number> = {};
	finalPosts.forEach(post => {
		if (Array.isArray(post.tags)) {
			post.tags.forEach((tag: string) => {
				const lowerTag = tag.toLowerCase();
				tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
			});
		}
	});

	// Get top 5 tags by frequency
	const topTags = Object.entries(tagCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([tag]) => tag);

	return {
		recentPosts,
		tags: topTags
	};
}
