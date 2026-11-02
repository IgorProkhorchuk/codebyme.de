export function markdownToText(markdown: string): string {
	const source = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
	// Keep code literal: wildcards, redirections and placeholders are searchable too.
	return source.split(/(^```[^\n]*\n[\s\S]*?^```[ \t]*\r?$|^~~~[^\n]*\n[\s\S]*?^~~~[ \t]*\r?$|`[^`\n]+`)/gm)
		.map(part => {
			if (/^(?:```|~~~)/.test(part)) return part.replace(/^[^\n]*\n/, '').replace(/\r?\n(?:```|~~~)[ \t]*\r?$/, '');
			if (part.startsWith('`') && part.endsWith('`')) return part.slice(1, -1);
			return part.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
				.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<\/?[a-z][^<>\n]*>/gi, ' ')
				.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
				.replace(/^\s{0,3}[#>]+\s*/gm, '').replace(/[*`~]/g, '');
		}).join(' ').replace(/\s+/g, ' ').trim();
}

const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[’ʼ]/g, "'");
export const searchTerms = (query: string) => [...new Set(normalize(query).trim().split(/\s+/).filter(Boolean))];

export interface SearchDocument {
	title: string; tags: string[]; category: string; description: string; body: string;
}

export function scoreDocument(post: SearchDocument, query: string): number {
	const fields = [[post.title, 12], [post.tags.join(' '), 8], [post.category, 4],
		[post.description, 3], [post.body, 1]] as const;
	let score = 0;
	for (const term of searchTerms(query)) {
		const matches = fields.filter(([value]) => normalize(value).includes(term));
		if (!matches.length) return -1;
		score += matches.reduce((sum, [, weight]) => sum + weight, 0);
	}
	return score;
}

export function excerpt(text: string, query = '', limit = 230): string {
	const normalized = normalize(text);
	const positions = searchTerms(query).map(term => normalized.indexOf(term)).filter(i => i >= 0);
	const first = positions.length ? Math.min(...positions) : 0;
	let start = Math.max(0, first - 65);
	if (start > 0) {
		const boundary = text.indexOf(' ', start);
		if (boundary >= 0 && boundary < first) start = boundary + 1;
	}
	const fragment = text.slice(start, start + limit);
	return `${start ? '…' : ''}${fragment}${start + limit < text.length ? '…' : ''}`;
}
