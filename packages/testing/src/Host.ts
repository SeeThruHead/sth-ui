import { execFileSync } from "node:child_process"
import { availableParallelism, freemem, totalmem } from "node:os"
import process from "node:process"

export type Probe = {
  readonly read: (path: string) => string | undefined
  readonly cpus: () => number
  readonly totalBytes: () => number
  readonly freeBytes: () => number
  readonly freePercent: () => number | undefined
}

export const readOrNothing = (path: string): string | undefined => {
  try {
    return readFileSync(path, "utf8")
  } catch {
    return undefined
  }
}

import { readFileSync } from "node:fs"

const memoryLevel = (): string => execFileSync("sysctl", ["-n", "kern.memorystatus_level"], { encoding: "utf8" })

export const macFreePercent = (platform: string = process.platform, level: () => string = memoryLevel) => {
  if (platform !== "darwin") return undefined
  const percent = Number(level())

  return Number.isFinite(percent) ? percent : undefined
}

export const hostProbe: Probe = {
  read: readOrNothing,
  cpus: availableParallelism,
  totalBytes: totalmem,
  freeBytes: freemem,
  freePercent: () => macFreePercent()
}
