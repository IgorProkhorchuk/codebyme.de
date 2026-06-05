import { derived, writable } from 'svelte/store';
import en from './translations/en';
import uk from './translations/uk';

export const locale = writable<'en' | 'uk'>('en');

const translations = { en, uk };

export const t = derived(locale, ($locale) => (key: keyof typeof en) => {
	return translations[$locale][key] || key;
});
