#!/usr/bin/env node
'use strict';

var child_process = require('child_process');
var fs = require('fs');

function printUsage() {
  console.error('usage: node tee-pipefail <command> [args...] <file>');
  console.error('where <command> is a an exutable command and <file> is the name of the file into which the output of command will be duplicated. <args> is the list of zero or more arguments that will be given to <command>.');
}

var command = process.argv[2];

if (!command) {
  printUsage();
  console.error('Missing command and file argument.');
  process.exit(1);
}
if (!process.argv[3]) {
  printUsage();
  console.error('Missing file argument.');
  process.exit(1);
}

var argIdx = 3;
var argument;
var args = [];
while (true) {
  argument = process.argv[argIdx++];
  if (!argument) {
    break;
  }
  args.push(argument);
}

// last argument is the target file
var filePath = args[args.length - 1];
args.pop();

var writeStream = fs.createWriteStream(filePath);

// add arguments space separated to command, as child_process.exec expects them
args.forEach(function(arg) {
  command += ' ' + arg;
});

var childProcess = child_process.exec(command, (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
});

childProcess.stdout.on('data', function(data) {
  process.stdout.write(data);
  writeStream.write(data);
});

childProcess.stderr.on('data', function(data) {
  process.stderr.write(data);
  writeStream.write(data);
});

childProcess.on('close', function(code) {
  process.exit(code);
});

