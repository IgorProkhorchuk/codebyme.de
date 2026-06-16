export interface Post {
	slug: string;
	title: string;
	date: string;
	category: string;
	tags: string[];
	readingTime: string;
	lang?: string;
}

export function getAllPostsRaw(): Record<string, Record<string, any>> {
	const allPostFiles = import.meta.glob('/src/content/blog/**/*.md', { eager: true });
	const postsBySlug: Record<string, Record<string, any>> = {};
	
	for (const [path, post] of Object.entries(allPostFiles)) {
		const parts = path.split('/');
		const fileLang = parts[parts.length - 2];
		const slug = parts[parts.length - 1].replace('.md', '');
		
		if (!postsBySlug[slug]) {
			postsBySlug[slug] = {};
		}
		postsBySlug[slug][fileLang] = post;
	}
	return postsBySlug;
}

export function getPosts(lang: string = 'en', postsBySlug: Record<string, Record<string, any>> = getAllPostsRaw()): Post[] {
	const finalPosts = Object.entries(postsBySlug).map(([slug, versions]) => {
		const post: any = versions[lang] || versions['en'] || Object.values(versions)[0];
		return {
			slug,
			title: post.metadata?.title || 'Untitled',
			date: post.metadata?.date || 'Unknown Date',
			category: post.metadata?.category || 'UNCATEGORIZED',
			tags: post.metadata?.tags || [],
			readingTime: post.metadata?.readingTime || 1
		};
	});
	return finalPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string, lang: string = 'en'): Promise<{ content: any, meta: any }> {
	const allPosts = import.meta.glob('/src/content/blog/**/*.md');
	let resolver = allPosts[`/src/content/blog/${lang}/${slug}.md`];
	
	if (!resolver) {
		resolver = allPosts[`/src/content/blog/en/${slug}.md`];
	}
	if (!resolver) {
		resolver = allPosts[`/src/content/blog/uk/${slug}.md`];
	}

	if (!resolver) {
		throw new Error(`Post not found: ${slug}`);
	}

	const post: any = await resolver();
	return {
		content: post.default,
		meta: post.metadata
	};
}

export function getAllPostsMultiLang(): Post[] {
	const allPostFiles = import.meta.glob('/src/content/blog/**/*.md', { eager: true });
	const posts = Object.entries(allPostFiles).map(([path, post]: [string, any]) => {
		const parts = path.split('/');
		const fileLang = parts[parts.length - 2];
		const slug = parts[parts.length - 1].replace('.md', '');
		return {
			slug,
			lang: fileLang,
			title: post.metadata?.title || 'Untitled',
			date: post.metadata?.date || 'Unknown Date',
			category: post.metadata?.category || 'UNCATEGORIZED',
			tags: post.metadata?.tags || [],
			readingTime: post.metadata?.readingTime || 1
		};
	});
	return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
