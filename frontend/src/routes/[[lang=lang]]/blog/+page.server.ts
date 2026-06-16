import { getPosts } from '$lib/server/posts';

export async function load({ url, params }) {
	const categoryFilter = url.searchParams.get('category');
	const tagFilter = url.searchParams.get('tag');
	const searchFilter = url.searchParams.get('q');
	
	const lang = params.lang || 'en';
	let finalPosts = getPosts(lang);

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
