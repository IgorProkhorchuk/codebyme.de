import { findPosts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const currentSearch = (url.searchParams.get('q') || '').trim().slice(0, 200);
	const currentCategory = url.searchParams.get('category');
	const currentTag = url.searchParams.get('tag');
	return { posts: findPosts(currentSearch, currentCategory, currentTag), currentCategory, currentTag, currentSearch };
};
