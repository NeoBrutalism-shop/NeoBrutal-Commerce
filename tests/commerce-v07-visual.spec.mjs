import fs from 'node:fs';
import {test,expect} from '@playwright/test';

const baseline=JSON.parse(fs.readFileSync(new URL('./visual-baselines-v07.json',import.meta.url),'utf8'));

test('v0.7 visual provenance remains recorded after v0.8 promotion',()=>{
  expect(baseline.version).toBe('0.7.0');
  expect(baseline.platform).toBe('linux');
  expect(baseline.surfaces.map(surface=>surface.id)).toEqual(['home','product','checkout','account','ownership']);
  expect(Object.keys(baseline.projects).sort()).toEqual(['chromium','mobile-chromium']);
});
