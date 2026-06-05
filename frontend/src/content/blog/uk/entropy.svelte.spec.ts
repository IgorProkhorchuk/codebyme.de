import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import EntropyPost from './entropy.md';

describe('Markdown Math Compilation', () => {
	it('should compile mathematical formulas into KaTeX HTML elements', async () => {
		const { container } = render(EntropyPost);
		
		// KaTeX should render the math block into a span with the class 'katex-display' or 'katex'
		const katexElements = container.querySelectorAll('.katex');
		expect(katexElements.length).toBeGreaterThan(0);
		
		// Specifically check for one of the formulas to ensure proper text parsing
		// Look for the H_{pass} formula rendering
		const textContent = container.innerText;
		expect(textContent).toContain('pass'); // Part of H_pass
	});
});
