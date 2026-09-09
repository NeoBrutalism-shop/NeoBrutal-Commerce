import fs from 'node:fs';

const coreFile='scripts/promote-v10-core.mjs';
let core=fs.readFileSync(coreFile,'utf8');
const from='v1.0 visual candidate missing: ${marker}';
const to='v1.0 visual candidate missing: \\${marker}';
if(!core.includes(from))throw new Error('v1.0 core interpolation marker not found');
core=core.replace(from,to);
fs.writeFileSync(coreFile,core);

const testFile='tests/reference-adapter-v05.test.mjs';
let testSource=fs.readFileSync(testFile,'utf8');
const oldRegex='/v0\\.9\\.0-rc\\.1/';
const newRegex='/v1\\.0\\.0/';
if(!testSource.includes(oldRegex))throw new Error('escaped v0.9 download expectation not found');
testSource=testSource.replace(oldRegex,newRegex);
fs.writeFileSync(testFile,testSource);

fs.rmSync('scripts/fix-v10-core.mjs');
console.log('v1.0 core interpolation and escaped download expectation patched.');
