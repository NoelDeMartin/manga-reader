import { dontSee, input, press, see, test } from '@aerogel/playwright';

test('Manage series', async ({ page }) => {
    await page.goto('/');

    await see(page, 'No series yet');

    await input(page, 'Series name').fill('One Piece');
    await press(page, 'Create');

    await see(page, 'One Piece');
    await dontSee(page, 'No series yet');

    await input(page, 'Series name').fill('Naruto');
    await press(page, 'Create');

    await see(page, 'One Piece');
    await see(page, 'Naruto');
});
