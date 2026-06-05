import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const lang = params.lang || 'en';
	
	try {
		const post = await import(`../../../../content/blog/${lang}/${params.slug}.md`);
		return {
			content: post.default,
			meta: post.metadata,
			isTranslated: true
		};
	} catch (e) {
		if (lang !== 'en') {
			try {
				const fallbackPost = await import(`../../../../content/blog/en/${params.slug}.md`);
				return {
					content: fallbackPost.default,
					meta: fallbackPost.metadata,
					isTranslated: false
				};
			} catch (fallbackError) {
				error(404, `Could not find ${params.slug}`);
			}
		}
		error(404, `Could not find ${params.slug}`);
	}
}
