export async function load({ url, params }) {
	const categoryFilter = url.searchParams.get('category');
	const lang = params.lang || 'en';
	
	const allPostFiles = import.meta.glob('/src/content/blog/**/*.md', { eager: true });
	
	const enPosts = Object.entries(allPostFiles)
		.filter(([path]) => path.includes('/content/blog/en/'))
		.map(([path, post]: [string, any]) => ({
			slug: path.split('/').pop()?.replace('.md', ''),
			title: post.metadata?.title || 'Untitled',
			date: post.metadata?.date || 'Unknown Date',
			category: post.metadata?.category || 'UNCATEGORIZED',
			isTranslated: false
		}));
		
	let finalPosts = enPosts;
	if (lang !== 'en') {
		const langPosts = Object.entries(allPostFiles)
			.filter(([path]) => path.includes(`/content/blog/${lang}/`))
			.map(([path, post]: [string, any]) => ({
				slug: path.split('/').pop()?.replace('.md', ''),
				title: post.metadata?.title || 'Untitled',
				date: post.metadata?.date || 'Unknown Date',
				category: post.metadata?.category || 'UNCATEGORIZED',
				isTranslated: true
			}));
			
		const langSlugs = new Set(langPosts.map(p => p.slug));
		finalPosts = [
			...langPosts,
			...enPosts.filter(p => !langSlugs.has(p.slug))
		];
	} else {
		finalPosts = finalPosts.map(p => ({...p, isTranslated: true}));
	}

	finalPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	if (categoryFilter) {
		finalPosts = finalPosts.filter(post => post.category.toLowerCase() === categoryFilter.toLowerCase());
	}

	return {
		posts: finalPosts,
		currentCategory: categoryFilter
	};
}
