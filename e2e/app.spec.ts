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

    await see(page, 'One Piece');
    await see(page, 'Chapter 001');
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

    await see(page, 'One Piece');
    await see(page, 'Chapter 001');
    await see(page, 'No pages found for this chapter.');

    await page
        .getByRole('banner')
        .getByLabel('Upload pages')
        .setInputFiles([
            path.join(import.meta.dirname, 'fixtures/001.png'),
            path.join(import.meta.dirname, 'fixtures/002.png'),
        ]);

    await dontSee(page, 'No pages found for this chapter.');
    await expect(page.getByRole('img', { name: 'Page 1 of 2' })).toBeVisible();
    await see(page, '1 / 2');

    // Page navigation
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByRole('img', { name: 'Page 2 of 2' })).toBeVisible();
    await see(page, '2 / 2');

    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByRole('img', { name: 'Page 1 of 2' })).toBeVisible();
    await see(page, '1 / 2');

    // Reader settings & persistence
    await page.getByRole('button', { name: 'Reader settings' }).click();
    await page.getByRole('button', { name: 'Left to right' }).click();
    await page.getByRole('button', { name: 'Light' }).click();
    await page.getByRole('button', { name: 'Close reader settings' }).click();
    await see(page, 'LTR');

    await page.reload();

    await see(page, 'One Piece');
    await see(page, 'Chapter 001');
    await dontSee(page, 'No pages found for this chapter.');
    await see(page, '1 / 2');
    await see(page, 'LTR');
    await expect(page.getByRole('img', { name: 'Page 1 of 2' })).toBeVisible();

    await page.getByRole('button', { name: 'Reader settings' }).click();
    await expect(page.getByRole('button', { name: 'Left to right' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Vertical' }).click();
    await expect(page.getByRole('img', { name: 'Page 2 of 2' })).toBeVisible();
});
