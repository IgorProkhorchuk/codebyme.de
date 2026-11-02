import { posts } from '$lib/server/posts';
import { site, escapeXml as xml } from '$lib/seo';

export const prerender = true;
export function GET() {
	const items = posts.map(post => {
		const link = `${site}/blog/${xml(post.slug)}`;
		const date = new Date(post.date);
		return `<item><title>${xml(post.title)}</title><description>${xml(post.description)}</description><link>${link}</link><guid isPermaLink="true">${link}</guid>${Number.isNaN(date.getTime()) ? '' : `<pubDate>${date.toUTCString()}</pubDate>`}<category>${xml(post.category)}</category></item>`;
	});
	return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>CodeByMe</title><description>Practical Linux, networking and software development guides.</description><link>${site}</link><atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>${items.join('')}</channel></rss>`, {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'max-age=0, s-maxage=3600' }
	});
}
