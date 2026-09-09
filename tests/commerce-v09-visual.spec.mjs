import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {test,expect} from '@playwright/test';

const baseline=JSON.parse(fs.readFileSync(new URL('./visual-baselines-v09.json',import.meta.url),'utf8'));
const packageManifest=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const canonicalSurfaceIds=['home','product','checkout','account','ownership'];

function pngSize(buffer){
  if(buffer.length<24||buffer.toString('hex',0,8)!=='89504e470d0a1a0a')throw new Error('Expected Playwright screenshot to be a PNG');
  return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
}

test('v0.9 RC canonical visual fingerprints remain stable',async({page},testInfo)=>{
  expect(packageManifest.version).toBe('0.9.0-rc.1');
  expect(baseline.version).toBe(packageManifest.version);
  expect(baseline.surfaces.map(surface=>surface.id)).toEqual(canonicalSurfaceIds);
  test.skip(process.platform!==baseline.platform,`Canonical v0.9 RC fingerprints are ${baseline.platform} CI baselines.`);
  const expectedProject=baseline.projects[testInfo.project.name];
  test.skip(!expectedProject,`${testInfo.project.name} is behavioral/accessibility coverage, not a canonical pixel surface.`);

  for(const surface of baseline.surfaces){
    const expected=expectedProject[surface.id];
    expect(expected,`Missing ${testInfo.project.name}/${surface.id} v0.9 RC visual baseline`).toBeTruthy();
    await page.goto(surface.route,{waitUntil:'networkidle'});
    const screenshot=await page.screenshot({
      path:testInfo.outputPath(`commerce-v09-lock-${surface.id}-${testInfo.project.name}.png`),
      fullPage:true
    });
    const actualSize=pngSize(screenshot);
    const actualHash=createHash('sha256').update(screenshot).digest('hex');
    expect(actualSize,`${testInfo.project.name}/${surface.id} dimensions drifted from reviewed v0.9 RC baseline`).toEqual({width:expected.width,height:expected.height});
    expect(actualHash,`${testInfo.project.name}/${surface.id} pixels drifted from reviewed v0.9 RC baseline`).toBe(expected.sha256);
  }
});
