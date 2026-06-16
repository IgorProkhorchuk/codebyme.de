import { describe, it, expect } from 'vitest';
import { getPosts } from './posts';

const mockPostsBySlug = {
	'post-1': {
		en: { metadata: { title: 'English Post 1', date: '2025-01-01', category: 'TECH', tags: ['git'], readingTime: '1 min read' } },
		uk: { metadata: { title: 'Ukrainian Post 1', date: '2025-01-01', category: 'TECH', tags: ['git'], readingTime: '1 min read' } }
	},
	'post-2': {
		uk: { metadata: { title: 'Ukrainian Only', date: '2025-01-02', category: 'DEV', tags: ['test'], readingTime: '2 min read' } }
	},
	'post-3': {
		en: { metadata: { title: 'English Only', date: '2025-01-03', category: 'OPS', tags: ['docker'], readingTime: '3 min read' } }
	}
};

describe('Posts Service', () => {
	it('getPosts(en) should return English posts or fallbacks', () => {
		const posts = getPosts('en', mockPostsBySlug);
		expect(posts.length).toBe(3);
		
		const post1 = posts.find(p => p.slug === 'post-1');
		expect(post1?.title).toBe('English Post 1');

		const post2 = posts.find(p => p.slug === 'post-2');
		expect(post2?.title).toBe('Ukrainian Only');

		const post3 = posts.find(p => p.slug === 'post-3');
		expect(post3?.title).toBe('English Only');
	});

	it('getPosts(uk) should return Ukrainian posts or fallbacks', () => {
		const posts = getPosts('uk', mockPostsBySlug);
		expect(posts.length).toBe(3);
		
		const post1 = posts.find(p => p.slug === 'post-1');
		expect(post1?.title).toBe('Ukrainian Post 1');

		const post2 = posts.find(p => p.slug === 'post-2');
		expect(post2?.title).toBe('Ukrainian Only');

		const post3 = posts.find(p => p.slug === 'post-3');
		expect(post3?.title).toBe('English Only');
	});

	it('getPosts should sort by date descending', () => {
		const posts = getPosts('en', mockPostsBySlug);
		expect(posts[0].slug).toBe('post-3');
		expect(posts[1].slug).toBe('post-2');
		expect(posts[2].slug).toBe('post-1');
	});
});
