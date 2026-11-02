import { error } from '@sveltejs/kit';

export async function load({ params, data }) {
	try {
		const post = await import(`../../../content/blog/${params.slug}.md`);
		return {
			content: post.default,
			meta: data.meta
		};
	} catch (e) {
		console.error(e);
		error(404, `Could not find ${params.slug}`);
	}
}
