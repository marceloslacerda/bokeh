export class AssertionError extends Error {}

export function assert(condition: boolean | (() => boolean), message?: string): asserts condition {
  if (condition === true || (condition !== false && condition()))
    return

  throw new AssertionError(message ?? "Assertion failed")
}

export function unreachable(msg?: string): never {
  const suffix = msg != null ? `: ${msg}` : ""
  throw new Error(`unreachable code${suffix}`)
}
