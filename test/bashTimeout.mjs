// How tests run workflow steps in bash.
// A step that never ends fails its test instead of stalling the suite.
export const BASH_TIMEOUT = 60_000;
// Windows has no POSIX bash: WSL's runs the step inside Linux without the test's environment, and can hang. CI runs
// these tests on Linux.
export const BASH_SKIP =
  process.platform === 'win32' && "runs a workflow step in bash; Windows has none that gets the test's environment";
