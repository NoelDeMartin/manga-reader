import path from 'node:path';

import { dontSee, expect, input, localFirstLogin, press, see, solidReset, test, waitSync } from '@aerogel/playwright';

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

    await press(page, '001');

    await see(page, 'One Piece, 001');
    await see(page, 'No pages found for this chapter.');
});

test('Upload chapter pages', async ({ page }) => {
    await solidReset();
    await page.goto('/');
    await localFirstLogin(page);

    await input(page, 'Series name').fill('One Piece');
    await press(page, 'Create');
    await waitSync(page);
    await press(page, 'One Piece');

    await input(page, 'Chapter number').fill('001');
    await press(page, 'Create');
    await waitSync(page);
    await press(page, '001');

    await see(page, 'One Piece, 001');
    await see(page, 'No pages found for this chapter.');

    await page
        .getByLabel('Upload pages')
        .setInputFiles([
            path.join(import.meta.dirname, 'fixtures/001.png'),
            path.join(import.meta.dirname, 'fixtures/002.png'),
        ]);

    await dontSee(page, 'No pages found for this chapter.');
    await expect(page.locator('img')).toBeVisible();
    await expect(page.getByRole('combobox')).toContainText('001.png');

    await page.reload();

    await see(page, 'One Piece, 001');
    await dontSee(page, 'No pages found for this chapter.');
    await expect(page.getByRole('combobox')).toContainText('001.png');
    await expect(page.locator('img')).toBeVisible();
});
