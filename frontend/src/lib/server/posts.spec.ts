import { describe, expect, it } from 'vitest';
import { posts, findPosts } from './posts';

describe('article index', () => {
	it('finds a command in the real NAT article and excludes complete bodies from results', () => {
		const result = findPosts('masquerade', null, null);
		expect(result.some(post => post.slug === 'nat-linux-iptables-nftables')).toBe(true);
		expect(result.every(post => !('body' in post))).toBe(true);
		expect(result.find(post => post.slug === 'nat-linux-iptables-nftables')?.excerpt.toLowerCase()).toContain('masquerade');
	});
	it('combines full text with category and tag filters', () => {
		expect(findPosts('masquerade', 'tech', 'NAT').some(post => post.slug === 'nat-linux-iptables-nftables')).toBe(true);
		expect(findPosts('masquerade', 'NON_TECH', null)).toEqual([]);
		expect(findPosts('masquerade', null, 'nonexistent')).toEqual([]);
	});
	it('includes every article once and supplies valid SEO metadata', () => {
		expect(new Set(posts.map(post => post.slug)).size).toBe(posts.length);
		expect(posts.every(post => post.description && ['en', 'uk', 'de'].includes(post.lang) && !Number.isNaN(Date.parse(post.date)))).toBe(true);
		expect(findPosts('', null, null)).toHaveLength(posts.length);
	});
	it('browses curated topics and keeps search and tag filters within the topic', () => {
		const networking = findPosts('', null, null, 'networking');
		expect(networking.map(post => post.slug)).toEqual(expect.arrayContaining(['nat-linux-iptables-nftables', 'ipv4-subnetting-guide']));
		expect(networking.some(post => post.slug === 'bash_scripting')).toBe(false);
		expect(findPosts('masquerade', null, null, 'networking').map(post => post.slug)).toContain('nat-linux-iptables-nftables');
		expect(findPosts('masquerade', null, null, 'git')).toEqual([]);
		expect(findPosts('', null, 'java', 'networking')).toEqual([]);
		expect(findPosts('', null, null, 'unknown-topic')).toEqual([]);
	});
});
