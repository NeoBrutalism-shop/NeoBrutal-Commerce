import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('system showcase keeps route cards readable in dark mode',async({page})=>{
  await page.goto('/components/',{waitUntil:'networkidle'});
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const route=page.locator('.store-section--pink .store-route').first();
  await expect(route).toBeVisible();
  const contrast=await new AxeBuilder({page}).include('.store-section--pink').withRules(['color-contrast']).analyze();
  expect(contrast.violations,'dark system-showcase route cards must pass color contrast').toEqual([]);
  const colors=await route.evaluate(element=>({
    foreground:getComputedStyle(element).color,
    background:getComputedStyle(element).backgroundColor,
    code:getComputedStyle(element.querySelector('code')).color,
    helper:getComputedStyle(element.querySelector('span')).color
  }));
  expect(colors.foreground).not.toBe(colors.background);
  expect(colors.code).not.toBe(colors.background);
  expect(colors.helper).not.toBe(colors.background);
});

test('component explorer keeps primary and helper copy visually separated',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await page.getByRole('tab',{name:/Blocks/}).click();

  const helper=page.locator('.cx-block-preview strong + small').first();
  await expect(helper).toBeVisible();
  const helperLayout=await helper.evaluate(small=>{
    const strong=small.previousElementSibling;
    const primaryRect=strong.getBoundingClientRect();
    const helperRect=small.getBoundingClientRect();
    return {
      display:getComputedStyle(small).display,
      marginTop:parseFloat(getComputedStyle(small).marginTop)||0,
      separated:helperRect.top>=primaryRect.bottom
    };
  });
  expect(helperLayout.display).toBe('block');
  expect(helperLayout.marginTop).toBeGreaterThan(0);
  expect(helperLayout.separated).toBe(true);

  const miniLabel=page.locator('.cx-block-preview .cx-mini-row > span').first();
  await expect(miniLabel).toBeVisible();
  const miniLayout=await miniLabel.evaluate(label=>({
    display:getComputedStyle(label).display,
    rowGap:parseFloat(getComputedStyle(label).rowGap)||0
  }));
  expect(miniLayout.display).toBe('grid');
  expect(miniLayout.rowGap).toBeGreaterThan(0);
});

test('component explorer remains WCAG A/AA clean in dark mode',async({page})=>{
  await page.goto('/components.html',{waitUntil:'networkidle'});
  await page.locator('#themeToggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(results.violations,'dark component explorer WCAG A/AA violations').toEqual([]);
});
