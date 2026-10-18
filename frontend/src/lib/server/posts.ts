import { markdownToText, excerpt, scoreDocument } from '$lib/search';

interface Metadata {
	title?: string; date?: string; updated?: string; category?: string; tags?: string[];
	description?: string; readingTime?: string; lang?: string;
}
const modules = import.meta.glob<{ metadata: Metadata }>('/src/content/blog/**/*.md', { eager: true });
const sources = import.meta.glob<string>('/src/content/blog/**/*.md', { eager: true, query: '?raw', import: 'default' });

const indexed = Object.entries(modules).map(([path, { metadata: meta }]) => {
	const source = sources[path];
	const body = markdownToText(source);
	const prose = markdownToText(source.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' '));
	return {
		slug: path.split('/').pop()!.replace(/\.md$/, ''), title: meta.title || 'Untitled',
		date: String(meta.date || ''), updated: meta.updated ? String(meta.updated) : null,
		category: meta.category || 'UNCATEGORIZED', tags: meta.tags || [],
		readingTime: meta.readingTime || '1 min read', lang: meta.lang || 'en',
		description: meta.description || excerpt(prose, '', 160), body
	};
}).sort((a, b) => b.date.localeCompare(a.date));

export const posts = indexed.map(({ body: _body, ...post }) => post);
export const getPost = (slug: string) => posts.find(post => post.slug === slug);

export function findPosts(query: string, category: string | null, tag: string | null) {
	return indexed.filter(post => (!category || post.category.toLowerCase() === category.toLowerCase()) &&
		(!tag || post.tags.some(value => value.toLowerCase() === tag.toLowerCase())))
		.map(post => ({ post, score: scoreDocument(post, query) }))
		.filter(({ score }) => score >= 0)
		.sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
		.map(({ post: { body, ...post } }) => ({ ...post, excerpt: query ? excerpt(body, query) : post.description }));
}
