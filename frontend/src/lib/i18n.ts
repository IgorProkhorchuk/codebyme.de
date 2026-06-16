export const dictionary = {
	en: {
		searchPlaceholder: 'Search articles...',
		searchButton: 'Search',
		popularTopics: 'Popular Topics',
		recentPosts: 'Recent Posts',
		techBlog: 'Tech Blog',
		lifeBlog: 'Life Blog',
		labs: 'Labs',
		minRead: 'min read',
		impressum: 'Impressum',
		datenschutz: 'Datenschutzerklärung'
	},
	uk: {
		searchPlaceholder: 'Пошук статей...',
		searchButton: 'Пошук',
		popularTopics: 'Популярні теми',
		recentPosts: 'Останні публікації',
		techBlog: 'Tech Blog',
		lifeBlog: 'Life Blog',
		labs: 'Labs',
		minRead: 'хв читання',
		impressum: 'Impressum',
		datenschutz: 'Datenschutzerklärung'
	}
};

export type LangCode = keyof typeof dictionary;

export function t(key: keyof typeof dictionary.en, lang: string | undefined): string {
	const validLang = (lang === 'uk' ? 'uk' : 'en') as LangCode;
	return dictionary[validLang][key];
}
