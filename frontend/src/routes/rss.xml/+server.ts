export const prerender = true;

const siteName = 'CodeByMe';
const siteUrl = 'https://codebyme.de';
const siteDescription = 'Build. Deploy. Document. Thoughts, experiments, and stories from the field.';

export async function GET() {
	const allPostFiles = import.meta.glob('/src/content/blog/**/*.md', { eager: true });
	
	const posts = Object.entries(allPostFiles).map(([path, post]: [string, any]) => ({
		slug: path.split('/').pop()?.replace('.md', ''),
		title: post.metadata?.title,
		date: post.metadata?.date,
		category: post.metadata?.category || 'TECH'
	}));

	// Sort posts by date, descending
	posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const xml = `
		<?xml version="1.0" encoding="UTF-8" ?>
		<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
			<channel>
				<title>${siteName}</title>
				<description>${siteDescription}</description>
				<link>${siteUrl}</link>
				<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
				${posts.map(post => `
					<item>
						<title><![CDATA[${post.title}]]></title>
						<link>${siteUrl}/blog/${post.slug}</link>
						<guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
						<pubDate>${new Date(post.date).toUTCString()}</pubDate>
						<category>${post.category}</category>
					</item>
				`).join('')}
			</channel>
		</rss>
	`.trim();

	return new Response(xml, {
		headers: {
			'Cache-Control': 'max-age=0, s-maxage=3600',
			'Content-Type': 'application/xml'
		}
	});
}
