import { page } from 'vitest/browser';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';
import { locale } from '$lib/i18n';

describe('/[[lang=lang]]/+page.svelte', () => {
	beforeEach(() => {
		// Reset to English before each test
		locale.set('en');
	});

	it('should render english text by default', async () => {
		render(Page);
		
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		// "Build. Deploy. Document." is split in HTML, check for part of it
		await expect.element(page.getByText('Build. Deploy.')).toBeInTheDocument();
		await expect.element(page.getByText('Tech Blog')).toBeInTheDocument();
		await expect.element(page.getByText('Life Blog')).toBeInTheDocument();
	});

	it('should render ukrainian text when locale is changed', async () => {
		locale.set('uk');
		render(Page);
		
		await expect.element(page.getByText('Будуй. Деплой.')).toBeInTheDocument();
		await expect.element(page.getByText('Технічний Блог')).toBeInTheDocument();
		await expect.element(page.getByText('Особистий Блог')).toBeInTheDocument();
	});
});
