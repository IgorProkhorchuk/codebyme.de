import { posts } from '$lib/server/posts';
import { site, escapeXml } from '$lib/seo';

export const prerender = true;
export function GET() {
	const urls = [
		...['/', '/blog'].map(path => `<url><loc>${site}${path}</loc></url>`),
		...posts.map(post => `<url><loc>${site}/blog/${escapeXml(post.slug)}</loc>${post.updated && /^\d{4}-\d{2}-\d{2}$/.test(post.updated) ? `<lastmod>${post.updated}</lastmod>` : ''}</url>`)
	];
	return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'max-age=0, s-maxage=3600' }
	});
}
