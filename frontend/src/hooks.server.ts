import type { Handle } from '@sveltejs/kit';
import { getPost } from '$lib/server/posts';

export const handle: Handle = ({ event, resolve }) => {
	const match = /^\/blog\/([^/]+)\/?$/.exec(event.url.pathname);
	const lang = match ? getPost(match[1])?.lang : 'en';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('<html lang="en">', `<html lang="${lang === 'uk' ? 'uk' : lang === 'de' ? 'de' : 'en'}">`)
	});
};
