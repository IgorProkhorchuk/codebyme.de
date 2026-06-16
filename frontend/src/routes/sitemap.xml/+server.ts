import { getAllPostsRaw } from '$lib/server/posts';

export const prerender = true;

const site = 'https://codebyme.de';
const langs = ['en', 'uk'];

export async function GET() {
	const postsBySlugRaw = getAllPostsRaw();
	const postsBySlug: Record<string, string> = {};
	
	for (const [slug, versions] of Object.entries(postsBySlugRaw)) {
		for (const post of Object.values(versions)) {
			if (!postsBySlug[slug] || (post.metadata?.date && post.metadata.date > postsBySlug[slug])) {
				postsBySlug[slug] = post.metadata?.date || '';
			}
		}
	}
	
	const posts = Object.entries(postsBySlug).map(([slug, date]) => ({ slug, date }));

	const pages = [
		'',
		'/blog',
		'/labs',
		'/impressum',
		'/datenschutz'
	];

	let urls = '';

	for (const lang of langs) {
		const prefix = lang === 'en' ? '' : `/${lang}`;
		for (const page of pages) {
			urls += `
				<url>
					<loc>${site}${prefix}${page}</loc>
					<changefreq>daily</changefreq>
					<priority>0.7</priority>
				</url>
			`;
		}
	}

	for (const lang of langs) {
		const prefix = lang === 'en' ? '' : `/${lang}`;
		for (const post of posts) {
			urls += `
				<url>
					<loc>${site}${prefix}/blog/${post.slug}</loc>
					<lastmod>${post.date}</lastmod>
					<changefreq>weekly</changefreq>
					<priority>0.8</priority>
				</url>
			`;
		}
	}

	const sitemap = `
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="https://www.w3.org/1999/xhtml"
			xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
		>
			${urls}
		</urlset>
	`.trim();

	return new Response(sitemap, {
		headers: {
			'Cache-Control': 'max-age=0, s-maxage=3600',
			'Content-Type': 'application/xml'
		}
	});
}
