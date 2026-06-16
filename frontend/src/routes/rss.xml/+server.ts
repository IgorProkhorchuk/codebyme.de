import { getAllPostsMultiLang } from '$lib/server/posts';

export const prerender = true;

const siteName = 'CodeByMe';
const siteUrl = 'https://codebyme.de';
const siteDescription = 'Build. Deploy. Document. Thoughts, experiments, and stories from the field.';

export async function GET() {
	const posts = getAllPostsMultiLang();

	const xml = `
		<?xml version="1.0" encoding="UTF-8" ?>
		<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
			<channel>
				<title>${siteName}</title>
				<description>${siteDescription}</description>
				<link>${siteUrl}</link>
				<atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
				${posts.map(post => {
					const prefix = post.lang === 'en' ? '' : `/${post.lang}`;
					return `
					<item>
						<title><![CDATA[${post.title}]]></title>
						<link>${siteUrl}${prefix}/blog/${post.slug}</link>
						<guid isPermaLink="true">${siteUrl}${prefix}/blog/${post.slug}</guid>
						<pubDate>${new Date(post.date).toUTCString()}</pubDate>
						<category>${post.category}</category>
					</item>
					`;
				}).join('')}
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
