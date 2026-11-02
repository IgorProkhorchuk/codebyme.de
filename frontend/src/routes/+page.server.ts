import { posts } from '$lib/server/posts';

export function load() {
	const counts = new Map<string, number>();
	for (const post of posts) for (const tag of post.tags) {
		const name = tag.toLowerCase();
		counts.set(name, (counts.get(name) || 0) + 1);
	}
	return { recentPosts: posts.slice(0, 5), tags: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag) };
}
