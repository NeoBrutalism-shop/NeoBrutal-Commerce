import fs from 'node:fs';

const coreFile='scripts/promote-v10-core.mjs';
let core=fs.readFileSync(coreFile,'utf8');
const from='v1.0 visual candidate missing: ${marker}';
const to='v1.0 visual candidate missing: \\${marker}';
if(!core.includes(from))throw new Error('v1.0 core interpolation marker not found');
core=core.replace(from,to);

const workflowStart=core.indexOf("let quality=read('.github/workflows/quality.yml');");
const workflowEndMarker="write('.github/workflows/browser-qa.yml',browser);";
const workflowEnd=core.indexOf(workflowEndMarker,workflowStart);
if(workflowStart<0||workflowEnd<0)throw new Error('workflow mutation block not found in v1.0 core');
core=core.slice(0,workflowStart)+core.slice(workflowEnd+workflowEndMarker.length);

const deleteFrom="['scripts/promote-v10.mjs','scripts/fix-promoter.mjs','scripts/promote-v10-core.mjs','.github/workflows/v10-promote.yml']";
const deleteTo="['scripts/promote-v10.mjs','scripts/fix-promoter.mjs','scripts/promote-v10-core.mjs']";
if(!core.includes(deleteFrom))throw new Error('temporary workflow deletion marker not found');
core=core.replace(deleteFrom,deleteTo);
fs.writeFileSync(coreFile,core);

const testFile='tests/reference-adapter-v05.test.mjs';
let testSource=fs.readFileSync(testFile,'utf8');
const oldRegex='/v0\\.9\\.0-rc\\.1/';
const newRegex='/v1\\.0\\.0/';
if(!testSource.includes(oldRegex))throw new Error('escaped v0.9 download expectation not found');
testSource=testSource.replace(oldRegex,newRegex);
fs.writeFileSync(testFile,testSource);

fs.rmSync('scripts/fix-v10-core.mjs');
console.log('v1.0 promotion patched for code-only bot commit; workflow writes deferred to GitHub connection.');
