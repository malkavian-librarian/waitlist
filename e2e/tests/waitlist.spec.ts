import { test, expect } from '@playwright/test';

test('a party can be added to the waitlist', async ({ page }) => {
  const name = `E2E Add ${Date.now()}`;
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Waitlist/ })).toBeVisible();
  await page.getByPlaceholder('Party name').fill(name);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Waiting List' })).toBeVisible();
});

test('a waiting party can be seated at a table', async ({ page }) => {
  const name = `E2E Seat ${Date.now()}`;
  await page.goto('/');
  await page.getByPlaceholder('Party name').fill(name);
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const card = page
    .locator('div', { hasText: name })
    .filter({ has: page.getByRole('button', { name: 'Seat' }) })
    .last();
  await card.getByRole('button', { name: 'Seat' }).click();
  await card.getByPlaceholder('Table number').fill('5');
  await card.locator('form button[type="submit"]').click();
  const seated = page.locator('section', { hasText: 'Seated' });
  await expect(seated.getByText(name)).toBeVisible();
  await expect(seated.getByText('Table 5')).toBeVisible();
});

test('a reservation can be created for today', async ({ page }) => {
  const name = `E2E Res ${Date.now()}`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Reservations', exact: true }).click();
  await page.getByRole('button', { name: 'New Reservation' }).click();
  await page.getByPlaceholder('Party name').fill(name);
  await page.getByRole('button', { name: 'Add Reservation' }).click();
  await expect(page.getByText(name)).toBeVisible();
});
