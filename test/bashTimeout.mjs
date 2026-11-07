// How long a test lets a workflow step run in bash. A step that never ends fails its test instead of stalling the
// suite (Windows' WSL bash can wait forever).
export const BASH_TIMEOUT = 60_000;
