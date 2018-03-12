#!/usr/bin/env node
'use strict';

var i;
var arg;
for (var i = 0; i < 99; i++) {
  arg = process.argv[i]
  if (!arg) {
    break;
  }
  console.log(arg);
}

