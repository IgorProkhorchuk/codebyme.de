import { describe, expect, it } from 'vitest';
import { markdownToText, scoreDocument, excerpt, searchTerms } from './search';
import { escapeXml } from './seo';

const post = { title: 'Linux networking', category: 'TECH', tags: ['linux'], description: 'Packet routing', body: 'З’єднання через NAT. nft add rule ip nat postrouting masquerade' };

describe('full-text search', () => {
	it('finds commands and Ukrainian words in the article body', () => {
		expect(scoreDocument(post, 'masquerade')).toBeGreaterThan(0);
		expect(scoreDocument(post, "з'єднання NAT")).toBeGreaterThan(0);
	});
	it('requires every query term, across different fields', () => {
		expect(scoreDocument(post, 'linux masquerade')).toBeGreaterThan(0);
		expect(scoreDocument(post, 'linux nonexistent')).toBe(-1);
		expect(searchTerms('  NAT nat  ')).toEqual(['nat']);
	});
	it('ranks title matches above body-only matches', () => {
		expect(scoreDocument({ ...post, title: 'NAT masquerade' }, 'masquerade')).toBeGreaterThan(scoreDocument(post, 'masquerade'));
	});
	it('removes frontmatter and markup while retaining code and link text', () => {
		const text = markdownToText('---\ntitle: Hidden\n---\n# NAT\n[Guide](https://example.org)\n```sh\nnft masquerade\n```\n<script>bad()</script>');
		expect(text).toBe('NAT Guide nft masquerade');
		expect(text).not.toContain('Hidden');
	});
	it('shows the matching passage in a long article', () => {
		const text = 'Introduction. '.repeat(100) + 'masquerade is useful. ' + 'More text. '.repeat(50);
		expect(excerpt(text, 'masquerade')).toContain('masquerade');
		expect(excerpt(text, 'masquerade').length).toBeLessThanOrEqual(232);
	});
	it('preserves shell operators, wildcards and placeholders in code', () => {
		const text = markdownToText('Use `*.log` files.\n```sh\ncat <input> | tee *.log\n```');
		expect(text).toContain('*.log');
		expect(text).toContain('cat <input> | tee *.log');
	});
	it('treats HTML-like queries as text and escapes XML metadata', () => {
		expect(scoreDocument(post, '<script>')).toBe(-1);
		expect(escapeXml('A & B < "C" >')).toBe('A &amp; B &lt; &quot;C&quot; &gt;');
	});
});
