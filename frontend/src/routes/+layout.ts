import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params }) => {
	const lang = params.lang || 'en';
	
	return {
		lang
	};
};
