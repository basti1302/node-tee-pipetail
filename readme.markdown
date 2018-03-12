Duplex Stream
=============

A minimal replacement for unix TEE(1), that forwards the exit code of the original process.

**TL;DR:** Like `TEE(1)`, but with `set -o pipefail` / `exit ${PIPESTATUS[0]}`, only cross platform and written in Node.js.

## Problem

Let's say

```
run-tests
```

runs your project's tests and exits with `0` if everything is peachy, or `1`, if a test fails. Also, the test runner probably writes output to the `stdout` and maybe `stderr`.

Now, let's say you want to have that output in a file (for example to generate and publish a project report). Of course, the command

```
run-tests > test-output.log
```

will do just that, but now you won't see the output in the shell anymore, which is annoying while working on the project.

With the command

```
run-tests | tee test-output.log
```

you'll get the output on the console and in `test-output.log`. But now we have introduced a new problem: when there is a test failure (so `run-tests` would exit with `1`), `run-tests | tee test-output.log` as a whole will still exit with `0` (because the exit code of `tee` is always `0`), so **a test failure will no longer break your build**, like it's supposed to do. Bummer.


## Solution

Run

```
npm install tee-pipefail
```

to install `tee-pipefail`, then replace

```
run-tests | tee test-output.log
```

with

```
tee-pipefail run-tests test-output.log
```

`tee-pipefail` is meant to be a replacement for this specific use case of `TEE(1)`. In contrast to `tee` you do not pipe a command's output into it but provide the command as an argument instead. Thus, `tee-pipefail` takes at least two arguments: the command to execute and the file path of the output file. You can provide additional arguments before the file argument, which will be passed to the given command. `tee-pipefail` will create a file at the given path, overwriting any existing file. It will them write all output of the given command (stdout and stderr) to this file while still printing it to stdout/stderr respectively. When the command terminates, `tee-pipefail` will also terminate **with the same exit code as the executed command**.

## Usage

```
usage: tee-pipefail <command> [args...] <file>
```

* `<command>` is a an exutable command
* `<args>` is a list of zero or more arguments that will be given to `<command>`
* `<file>` is the name of the file into which the output of command will be duplicated

**Example:**

* `tee-pipefail mocha test.js mocha-out.log`: Will run `mocha test.js` and copy all output to `mocha-out.log` as well as the console.
