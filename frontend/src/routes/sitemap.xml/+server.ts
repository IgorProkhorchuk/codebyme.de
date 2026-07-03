export const prerender = true;

const site = 'https://codebyme.de';

export async function GET() {
	const allPostFiles = import.meta.glob('/src/content/blog/**/*.md', { eager: true });
	
	const posts = Object.entries(allPostFiles).map(([path, post]: [string, any]) => ({
		slug: path.split('/').pop()?.replace('.md', ''),
		date: post.metadata?.date
	}));

	// Also add static pages
	const pages = [
		'',
		'/blog',
		'/labs',
		'/impressum',
		'/datenschutz'
	];

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
			${pages.map(page => `
				<url>
					<loc>${site}${page}</loc>
					<changefreq>daily</changefreq>
					<priority>0.7</priority>
				</url>
			`).join('')}
			${posts.map(post => `
				<url>
					<loc>${site}/blog/${post.slug}</loc>
					<lastmod>${post.date}</lastmod>
					<changefreq>weekly</changefreq>
					<priority>0.8</priority>
				</url>
			`).join('')}
		</urlset>
	`.trim();

	return new Response(sitemap, {
		headers: {
			'Cache-Control': 'max-age=0, s-maxage=3600',
			'Content-Type': 'application/xml'
		}
	});
}
