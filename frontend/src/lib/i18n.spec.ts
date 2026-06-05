import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { locale, t } from './i18n';

describe('i18n store', () => {
	it('should default to english', () => {
		expect(get(locale)).toBe('en');
	});

	it('should return correct english translation', () => {
		locale.set('en');
		const translator = get(t);
		expect(translator('home.tech_blog.title')).toBe('Tech Blog');
	});

	it('should switch language and return ukrainian translation', () => {
		locale.set('uk');
		const translator = get(t);
		expect(translator('home.tech_blog.title')).toBe('Технічний Блог');
	});

	it('should fallback to key if translation is missing', () => {
		locale.set('en');
		const translator = get(t);
		// @ts-ignore - testing invalid key
		expect(translator('non.existent.key')).toBe('non.existent.key');
	});
});
