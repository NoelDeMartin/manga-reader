import path from 'node:path';

import { dontSee, expect, input, localFirstLogin, press, see, solidReset, test, waitSync } from '@aerogel/playwright';
import type { Browser, Page } from '@playwright/test';

async function uploadPages(page: Page): Promise<void> {
    await page
        .getByLabel('Upload pages')
        .setInputFiles([
            path.join(import.meta.dirname, 'fixtures/001.png'),
            path.join(import.meta.dirname, 'fixtures/002.png'),
        ]);
}

async function seePages(page: Page): Promise<void> {
    await see(page, 'One Piece, 001');
    await dontSee(page, 'No pages found for this chapter.');
    await expect(page.getByRole('combobox')).toContainText('001.png');
    await expect(page.locator('img')).toBeVisible();
    await expect
        .poll(() => page.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
}

async function seePagesInOtherDevice(browser: Browser): Promise<void> {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');
    await localFirstLogin(page);
    await press(page, 'One Piece');
    await press(page, '001');
    await seePages(page);
    await context.close();
}

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

test.describe('Chapter pages sharing the same POD', () => {
    test.describe.configure({ mode: 'default' });

    test('Upload chapter pages', async ({ page, browser }) => {
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

        await uploadPages(page);
        await seePages(page);
        await waitSync(page);

        await page.reload();

        await seePages(page);
        await seePagesInOtherDevice(browser);
    });

    test('Upload chapter pages before logging in', async ({ page, browser }) => {
        await solidReset();
        await page.goto('/');

        await input(page, 'Series name').fill('One Piece');
        await press(page, 'Create');
        await press(page, 'One Piece');

        await input(page, 'Chapter number').fill('001');
        await press(page, 'Create');
        await press(page, '001');

        await see(page, 'One Piece, 001');
        await see(page, 'No pages found for this chapter.');

        await uploadPages(page);
        await seePages(page);

        await page.reload();

        await seePages(page);

        await localFirstLogin(page);
        await page.reload();

        await seePages(page);
        await seePagesInOtherDevice(browser);
    });
});
