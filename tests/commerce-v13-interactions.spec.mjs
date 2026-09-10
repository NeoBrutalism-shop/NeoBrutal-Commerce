import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const expectedPatternIds=['tactile-press','latched-selection','processing-feedback','result-feedback'];
const waitForLab=async page=>{
  await expect(page.locator('html')).toHaveAttribute('data-interaction-lab-ready','true');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-version','1.3.0');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-patterns','4');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-exceptions','1');
};

for(const project of ['all']){
  test(`v1.3 Motion Lab is manifest-backed accessible and viewport-tight`,async({page})=>{
    const httpFailures=[];const runtimeFailures=[];
    page.on('response',response=>{if(response.status()>=400)httpFailures.push(`${response.status()} ${response.url()}`)});
    page.on('pageerror',error=>runtimeFailures.push(error.message));
    page.on('console',message=>{if(message.type()==='error')runtimeFailures.push(message.text())});
    await page.goto('/demo/v13.html',{waitUntil:'networkidle'});
    await waitForLab(page);

    const renderedIds=await page.locator('[data-interaction-pattern]').evaluateAll(nodes=>nodes.map(node=>node.dataset.interactionPattern));
    expect(renderedIds).toEqual(expectedPatternIds);
    await expect(page.locator('[data-interaction-exception="drag-lift"]')).toHaveCount(1);
    await expect(page.locator('[data-interaction-exception="drag-lift"]')).toContainText('NOT A PRODUCTION PATTERN');
    const contract=await page.evaluate(()=>fetch('../storefront/interactions.json').then(response=>response.json()));
    expect(contract.schema).toBe('neobrutal-commerce/interactions@1');
    expect(contract.interactionVersion).toBe('1.3.0');
    expect(contract.commerceVersion).toBe('1.0.0');
    expect(contract.patterns.map(pattern=>pattern.id)).toEqual(renderedIds);
    expect(contract.exceptions.map(exception=>exception.id)).toEqual(['drag-lift']);
    expect(contract.exceptions[0].productionPattern).toBe(false);
    await expect(page.locator('[data-token-role]')).toHaveCount(7);

    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(axe.violations,'Motion Lab WCAG A/AA violations').toEqual([]);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow,'Motion Lab horizontal overflow').toBeLessThanOrEqual(1);
    expect(httpFailures,'Motion Lab HTTP failures').toEqual([]);
    expect(runtimeFailures,'Motion Lab runtime/console failures').toEqual([]);
  });
}

test('v1.3 Motion Lab reuses production latched media selection for pointer and keyboard',async({page})=>{
  await page.goto('/demo/v13.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  const code=page.getByRole('tab',{name:'CODE'});
  const files=page.getByRole('tab',{name:'FILES'});
  await code.click();
  await expect(code).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#motion-panel-code')).toBeVisible();
  await expect(page.locator('#motion-panel-preview')).toBeHidden();
  await code.focus();
  await page.keyboard.press('ArrowRight');
  await expect(files).toBeFocused();
  await expect(files).toHaveAttribute('aria-selected','true');
  await expect(page.locator('#motion-panel-files')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(code).toBeFocused();
  await expect(code).toHaveAttribute('aria-selected','true');
});

test('v1.3 Motion Lab reuses production subscription result state and consequence text',async({page})=>{
  await page.goto('/demo/v13.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  const shell=page.locator('[data-commerce-component="subscription-management"]');
  const cancel=page.locator('[data-subscription-cancel]');
  const resume=page.locator('[data-subscription-resume]');
  await expect(shell).toHaveAttribute('data-subscription-state','active');
  await cancel.click();
  await expect(shell).toHaveAttribute('data-subscription-state','cancel_at_period_end');
  await expect(page.locator('[data-subscription-badge]')).toHaveAttribute('data-state','cancel_at_period_end');
  await expect(page.locator('[data-subscription-note]')).toContainText('Access continues through 08 Sep 2027');
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(shell).toHaveAttribute('data-subscription-state','active');
  await expect(page.locator('[data-subscription-note]')).toContainText('Renewal resumed');
  await expect(page.locator('[data-ownership-timeline] li')).toHaveCount(2);
});

test('v1.3 Motion Lab theme and preview override remain explicit and reversible',async({page})=>{
  await page.goto('/demo/v13.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  const theme=page.locator('[data-theme-toggle]');
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const preview=page.locator('#motionPreviewToggle');
  await preview.click();
  await expect(preview).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('html')).toHaveAttribute('data-motion-preview','reduced');
  await expect(page.locator('#motionPreviewStatus')).toContainText('Operating-system preference remains authoritative');
  await preview.click();
  await expect(preview).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('html')).not.toHaveAttribute('data-motion-preview');
});

test('v1.3 actual reduced-motion preference removes tactile and processing animation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/demo/v13.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  await expect(page.locator('[data-system-motion]')).toHaveAttribute('data-system-motion','reduce');
  const tactile=await page.locator('#pressDemo').evaluate(node=>getComputedStyle(node).transitionDuration.split(',').map(value=>Number.parseFloat(value)||0));
  expect(Math.max(...tactile),'tactile transition must collapse under actual reduced motion').toBeLessThanOrEqual(.01);
  const skeleton=await page.locator('.nbc-skeleton span').first().evaluate(node=>({name:getComputedStyle(node).animationName,duration:getComputedStyle(node).animationDuration}));
  expect(skeleton.name).toBe('none');
});

test('v1.3 forced colors removes decorative depth and keeps keyboard focus visible',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='chromium','Forced-colors emulation is release-gated in Chromium.');
  await page.emulateMedia({forcedColors:'active'});
  await page.goto('/demo/v13.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  const button=page.locator('#pressDemo');
  await button.focus();
  const styles=await button.evaluate(node=>({shadow:getComputedStyle(node).boxShadow,outline:getComputedStyle(node).outlineStyle,width:Number.parseFloat(getComputedStyle(node).outlineWidth)||0}));
  expect(styles.shadow).toBe('none');
  expect(styles.outline).not.toBe('none');
  expect(styles.width).toBeGreaterThanOrEqual(2);
});

test('capture v1.3 Motion Lab review surfaces',async({page},testInfo)=>{
  test.skip(!new Set(['chromium','mobile-chromium']).has(testInfo.project.name),'Canonical Motion Lab review surfaces use Chromium desktop/mobile.');
  await page.goto('/demo/v13.html',{waitUntil:'networkidle'});
  await waitForLab(page);
  await page.screenshot({path:testInfo.outputPath(`commerce-v13-motion-lab-${testInfo.project.name}.png`),fullPage:true});
  if(testInfo.project.name==='chromium'){
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.reload({waitUntil:'networkidle'});
    await waitForLab(page);
    await page.screenshot({path:testInfo.outputPath('commerce-v13-motion-lab-reduced-chromium.png'),fullPage:true});
  }
});
