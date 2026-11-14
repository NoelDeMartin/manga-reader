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

test('Manage chapters', async ({ page }) => {
    await page.goto('/');

    await input(page, 'Series name').fill('One Piece');
    await press(page, 'Create');

    await press(page, 'One Piece');

    await see(page, 'One Piece');
    await see(page, 'No chapters yet');

    await input(page, 'Chapter number').fill('001');
    await press(page, 'Create');

    await see(page, '001');
    await dontSee(page, 'No chapters yet');

    await input(page, 'Chapter number').fill('002');
    await press(page, 'Create');

    await see(page, '001');
    await see(page, '002');

    await page.reload();

    await see(page, '001');
    await see(page, '002');
});
