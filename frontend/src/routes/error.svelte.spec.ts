import { page as vitestPage } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ErrorPage from './+error.svelte';

vi.mock('$app/stores', () => {
	return {
		page: {
			subscribe: (fn: any) => {
				fn({
					status: 404,
					error: { message: 'Not Found' }
				});
				return () => {};
			}
		}
	};
});

describe('/+error.svelte', () => {
	it('should render the 404 status code', async () => {
		render(ErrorPage);
		
		const statusText = vitestPage.getByText('404');
		await expect.element(statusText).toBeInTheDocument();
	});

	it('should render the confused cat image', async () => {
		render(ErrorPage);
		
		const image = vitestPage.getByRole('img', { name: 'Confused Cat' });
		await expect.element(image).toBeInTheDocument();
	});

	it('should display the correct 404 message', async () => {
		render(ErrorPage);
		
		const message = vitestPage.getByText(/Упс, мабуть ви забрели не туди/i);
		await expect.element(message).toBeInTheDocument();
	});
});
