import { error } from '@sveltejs/kit';

export async function load({ params }) {
	try {
		const lang = params.lang || 'en';
		const slug = params.slug;
		
		const allPosts = import.meta.glob('/src/content/blog/**/*.md');
		let resolver = allPosts[`/src/content/blog/${lang}/${slug}.md`];
		
		if (!resolver) {
			resolver = allPosts[`/src/content/blog/en/${slug}.md`];
		}
		if (!resolver) {
			resolver = allPosts[`/src/content/blog/uk/${slug}.md`];
		}

		if (!resolver) {
			error(404, `Could not find ${slug}`);
		}
		
		const post: any = await resolver();

		return {
			content: post.default,
			meta: post.metadata
		};
	} catch (e) {
		console.error(e);
		error(404, `Could not find ${params.slug}`);
	}
}
