import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/posts';

export async function load({ params }) {
	try {
		const lang = params.lang || 'en';
		return await getPostBySlug(params.slug, lang);
	} catch (e) {
		console.error(e);
		error(404, `Could not find ${params.slug}`);
	}
}
