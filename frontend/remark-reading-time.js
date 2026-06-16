import readingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
	return function (tree, file) {
		const textOnPage = toString(tree);
		const readingTimeStats = readingTime(textOnPage);
		
		// mdsvex adds frontmatter to file.data.fm
		if (!file.data.fm) {
			file.data.fm = {};
		}
		
		file.data.fm.readingTime = readingTimeStats.text;
	};
}
