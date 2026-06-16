import { test, expect } from '@playwright/test';

test.describe('Routing and Rendering', () => {
	test('Home page renders successfully', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('Blog list page renders successfully', async ({ page }) => {
		const response = await page.goto('/blog');
		expect(response?.status()).toBe(200);
		
		// Check that posts exist
		const postCards = page.locator('.post-card');
		const count = await postCards.count();
		expect(count).toBeGreaterThan(0);
	});

	test('All recent posts can be opened successfully', async ({ page }) => {
		await page.goto('/');
		const postLinks = await page.locator('.recent-posts-section a.post-row').all();
		expect(postLinks.length).toBeGreaterThan(0);

		// Collect URLs to visit
		const urls = [];
		for (const link of postLinks) {
			const href = await link.getAttribute('href');
			if (href) urls.push(href);
		}

		// Visit each URL and ensure 200 OK
		for (const url of urls) {
			const response = await page.goto(url);
			expect(response?.status()).toBe(200);
			// verify content loaded
			await expect(page.locator('.markdown-content')).toBeVisible();
		}
	});
});
