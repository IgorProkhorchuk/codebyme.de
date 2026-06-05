import { page } from 'vitest/browser';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';
import { locale } from '$lib/i18n';
import uk from '$lib/translations/uk';
import en from '$lib/translations/en';

describe('/[[lang=lang]]/+page.svelte', () => {
	beforeEach(() => {
		// Reset to English before each test
		locale.set('en');
	});

	it('should render english text by default', async () => {
		render(Page);
		
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: en['home.tech_blog.title'], exact: true })).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: en['home.life_blog.title'], exact: true })).toBeInTheDocument();
	});

	it('should render ukrainian text when locale is changed', async () => {
		locale.set('uk');
		render(Page);
		
		await expect.element(page.getByRole('heading', { name: uk['home.tech_blog.title'], exact: true })).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: uk['home.life_blog.title'], exact: true })).toBeInTheDocument();
	});
});
