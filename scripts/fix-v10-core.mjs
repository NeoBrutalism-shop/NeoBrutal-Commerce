import fs from 'node:fs';

const file='scripts/promote-v10-core.mjs';
let source=fs.readFileSync(file,'utf8');
const from='v1.0 visual candidate missing: ${marker}';
const to='v1.0 visual candidate missing: \\${marker}';
if(!source.includes(from))throw new Error('v1.0 core interpolation marker not found');
source=source.replace(from,to);
fs.writeFileSync(file,source);
fs.rmSync('scripts/fix-v10-core.mjs');
console.log('v1.0 core interpolation patched.');
