'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var t = require('tap');
var child_process = require('child_process');

rimraf.sync('test/tmp');
mkdirp.sync('test/tmp');

t.test('with missing command and file arguments', function(t) {
  runTeePipefailInvalid(
    t,
    [],
    1,
    ['Missing command and file argument.',
     'usage: node tee-pipefail']
  );
});

t.test('with missing file argument argument', function(t) {
  runTeePipefailInvalid(
    t,
    ['test/executables/exit-0.js'],
    1,
    ['Missing file argument.',
     'usage: node tee-pipefail']
  );
});

t.test('with non-existing executable', function(t) {
  runTeePipefailInvalid(
    t,
    ['test/executables/does-not-exist.js', 'test/tmp/nope'],
    127,
    ['test/executables/does-not-exist.js: No such file or directory',
     'Command failed: test/executables/does-not-exist.js']
  );
});

// test with an executable that exits with exit code 0
t.test('with exit code 0', function(t) {
  runTeePipefailValid(
    t,
    'test/executables/exit-0.js',
    'test/tmp/output.0',
    0
  );
});

// test with an executable that exits with exit code 1
t.test('with exit code 1', function(t) {
  runTeePipefailValid(
    t,
    'test/executables/exit-1.js',
    'test/tmp/output.1',
    1
  );
});

// test with arguments for executable with exit code 0
t.test('with arguments and exit code 0', function(t) {
  runTeePipefailWithArgs(
    t,
    'test/executables/echo-args-0.js',
    ['aaa', 'bbb', 'ccc'],
    'test/tmp/output.args.0',
    0
  );
});

// test with arguments for executable with exit code 1
t.test('with arguments and exit code 1', function(t) {
  runTeePipefailWithArgs(
    t,
    'test/executables/echo-args-1.js',
    ['aaa', 'bbb', 'ccc'],
    'test/tmp/output.args.1',
    1
  );
});

function runTeePipefailInvalid(
    t, args, expectedExitCode, expectedErrorMessages) {
  var childOutput = [];
  var childProcessHandle = child_process.fork(
    'index.js',
    args,
    { silent: true }
  );

  childProcessHandle.stdout.on('data', function(data) {
    childOutput.push(data.toString());
  });
  childProcessHandle.stderr.on('data', function(data) {
    childOutput.push(data.toString());
  });

  childProcessHandle.on('exit', function(code) {
    // check exit code
    t.equal(code, expectedExitCode, 'exit code');

    // check for error message
    expectedErrorMessages.forEach(function(message) {
      arrayContains(t, childOutput, message);
    });
    t.end()
  });
}

function runTeePipefailValid(t, executable, outputFile, expectedExitCode) {
  var childOutput = [];
  var childProcessHandle = child_process.fork(
    'index.js',
    [executable, outputFile],
    { silent: true }
  );

  childProcessHandle.stdout.on('data', function(data) {
    childOutput.push(data.toString());
  });
  childProcessHandle.stderr.on('data', function(data) {
    childOutput.push(data.toString());
  });

  childProcessHandle.on('exit', function(code) {
    // check exit code
    t.equal(code, expectedExitCode, 'exit code');

    // check that everything has been printed to stdout/stderr
    arrayContains(t, childOutput, 'first output');
    arrayContains(t, childOutput, 'second output');
    arrayContains(t, childOutput, 'third output');
    arrayContains(t, childOutput, 'FIRST ERROR');
    arrayContains(t, childOutput, 'SECOND ERROR');
    arrayContains(t, childOutput, 'THIRD ERROR');

    // check that everything has been written to the file
    var fileContent = fs.readFileSync(outputFile, 'utf8');
    stringContains(t, fileContent, 'first output');
    stringContains(t, fileContent, 'second output');
    stringContains(t, fileContent, 'third output');
    stringContains(t, fileContent, 'FIRST ERROR');
    stringContains(t, fileContent, 'SECOND ERROR');
    stringContains(t, fileContent, 'THIRD ERROR');

    t.end()
  });
}

function runTeePipefailWithArgs(
  t, executable, args, outputFile, expectedExitCode) {
  var argsForChild = [executable].concat(args);
  argsForChild.push(outputFile);

  var childOutput = [];
  var childProcessHandle = child_process.fork(
    'index.js',
    argsForChild,
    { silent: true }
  );

  childProcessHandle.stdout.on('data', function(data) {
    childOutput.push(data.toString());
  });
  childProcessHandle.stderr.on('data', function(data) {
    childOutput.push(data.toString());
  });

  childProcessHandle.on('exit', function(code) {
    // check exit code
    t.equal(code, expectedExitCode, 'exit code');

    // // check that everything has been printed to stdout/stderr
    arrayContains(t, childOutput, executable);
    args.forEach(function(arg) {
      arrayContains(t, childOutput, arg);
    });

    // check that everything has been written to the file
    var fileContent = fs.readFileSync(outputFile, 'utf8');
    stringContains(t, fileContent, executable);
    args.forEach(function(arg) {
      stringContains(t, fileContent, arg);
    });

    t.end()
  });
}

function arrayContains(t, output, expected) {
  var found = false;
  var i;
  for (i in output) {
    var chunk = output[i];
    if (chunk.indexOf(expected) >= 0) {
      found = true;
      break;
    }
  }
  t.ok(found, 'output: ' + expected);
}

function stringContains(t, string, expected) {
  t.ok(string.indexOf(expected) >= 0, 'output: ' + expected);
}

