import { error } from '@sveltejs/kit';
import { getPost } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const meta = getPost(params.slug);
	if (!meta) error(404, 'Article not found');
	return { meta };
};
