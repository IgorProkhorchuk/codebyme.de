import { findPosts } from '$lib/server/posts';
import type { PageServerLoad } from './$types';
import { topics } from '$lib/topics';

export const load: PageServerLoad = ({ url }) => {
	const currentSearch = (url.searchParams.get('q') || '').trim().slice(0, 200);
	const currentCategory = url.searchParams.get('category');
	const currentTag = url.searchParams.get('tag');
	const topicSlug = url.searchParams.get('topic');
	const currentTopic = topics.find(topic => topic.slug === topicSlug) || null;
	return { posts: findPosts(currentSearch, currentCategory, currentTag, topicSlug), currentCategory, currentTag, currentSearch, currentTopic };
};
