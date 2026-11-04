import { posts } from '$lib/server/posts';
import { topics, matchesTopic } from '$lib/topics';

export function load() {
	const cheatsheets = [
		['Bash', 'bash_scripting'], ['AWK', 'awk-cheatsheet'], ['grep', 'grep-cheatsheet'],
		['sed', 'sed-cheatsheet'], ['ripgrep', 'ripgrep-cheatsheet'], ['JVM tools', 'jvm-tools-cheatsheet']
	].filter(([, slug]) => posts.some(post => post.slug === slug)).map(([title, slug]) => ({ title, slug }));
	return {
		recentPosts: posts.slice(0, 5), cheatsheets,
		topics: topics.map(topic => ({ slug: topic.slug, title: topic.title, description: topic.description,
			count: posts.filter(post => matchesTopic(post.tags, topic)).length }))
	};
}
