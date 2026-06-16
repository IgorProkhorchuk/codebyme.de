import { getPosts } from '$lib/server/posts';

export async function load({ params }) {
	const lang = params.lang || 'en';
	const finalPosts = getPosts(lang);

	const recentPosts = finalPosts.slice(0, 5);

	const tagCounts: Record<string, number> = {};
	finalPosts.forEach(post => {
		if (Array.isArray(post.tags)) {
			post.tags.forEach((tag: string) => {
				const lowerTag = tag.toLowerCase();
				tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
			});
		}
	});

	const topTags = Object.entries(tagCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([tag]) => tag);

	return {
		recentPosts,
		tags: topTags
	};
}
