import assert from 'node:assert/strict';

// Start `npm run preview` first. Override with an explicit local origin if needed.
const origin = process.argv[2] || 'http://127.0.0.1:4173';
async function page(path, status = 200) {
	const response = await fetch(new URL(path, origin));
	assert.equal(response.status, status, path);
	return response.text();
}

const home = await page('/');
assert.match(home, /rel="canonical" href="https:\/\/codebyme.de\/"/);
assert.match(home, /name="description"/);
const article = await page('/blog/nat-linux-iptables-nftables');
assert.match(article, /<html lang="uk">/);
assert.match(article, /property="og:type" content="article"/);
assert.match(article, /rel="canonical" href="https:\/\/codebyme.de\/blog\/nat-linux-iptables-nftables"/);
assert.match(await page('/blog/bash_scripting'), /<html lang="en">/);
const results = await page('/blog?q=masquerade');
assert.match(results, /1 article found/);
assert.match(results, /name="robots" content="noindex, follow"/);
assert.match(await page('/blog?q=masquerade&category=NON_TECH'), /0 articles found/);
const labs = await page('/labs');
assert.match(labs, /Linux labs are under preparation/);
assert.match(labs, /name="robots" content="noindex, follow"/);
assert.match(await page('/blog/no-such-article', 404), /noindex, follow/);
const sitemap = await page('/sitemap.xml');
assert.match(sitemap, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
assert.ok(!sitemap.includes('/labs'));
assert.ok(!sitemap.includes('undefined'));
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
for (const path of urls) await page(path);
const rss = await page('/rss.xml');
assert.ok(!rss.includes('Invalid Date'));
assert.equal((rss.match(/<item>/g) || []).length, urls.length - 2);
assert.match(await page('/robots.txt'), /Sitemap: https:\/\/codebyme.de\/sitemap.xml/);
console.log(`PASS: ${urls.length} sitemap URLs, SSR languages, SEO metadata, search/filter results, Labs 200, genuine 404, robots and RSS.`);
