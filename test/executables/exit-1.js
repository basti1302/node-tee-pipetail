#!/usr/bin/env node
'use strict';

console.log('first output');
console.error('FIRST ERROR');
console.log('second output');
console.error('SECOND ERROR');
console.log('third output');
console.error('THIRD ERROR');
process.exit(1);

