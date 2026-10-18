export const site = 'https://codebyme.de';
export function escapeXml(value: string): string {
	return value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}
