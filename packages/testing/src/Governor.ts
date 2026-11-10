import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import process, { env, kill, pid, stderr } from "node:process"
import { setTimeout as sleep } from "node:timers/promises"
import {
  availableOf,
  cpusOf,
  decide,
  megabytes,
  memoryLimitOf,
  overridesOf,
  pressureOf,
  profileFor,
  timeoutScale
} from "./Capacity.ts"
import type { Grant, Kind, Machine, Profile } from "./Capacity.ts"
import { hostProbe, readOrNothing } from "./Host.ts"
import type { Probe } from "./Host.ts"

export type { Probe } from "./Host.ts"

export type Environment = Readonly<Record<string, string | undefined>>

export type Admission = {
  readonly workers: number
  readonly timeoutScale: number
  readonly waitedMs: number
  readonly reasons: ReadonlyArray<string>
  readonly machine: Machine
  readonly profile: Profile
}

const cgroupMemory = (probe: Probe): { readonly limit: number; readonly used: number } | undefined => {
  const limit = memoryLimitOf(probe.read("/sys/fs/cgroup/memory.max") ?? "")
  const used = Number(probe.read("/sys/fs/cgroup/memory.current") ?? Number.NaN)
  if (limit === undefined || !Number.isFinite(used)) return undefined

  return { limit, used }
}

const pressure = (probe: Probe, kind: "cpu" | "memory" | "io"): number =>
  pressureOf(probe.read(`/sys/fs/cgroup/${kind}.pressure`) ?? probe.read(`/proc/pressure/${kind}`) ?? "")

const freeOf = (probe: Probe): number => {
  const percent = probe.freePercent()
  if (percent === undefined) return megabytes(probe.freeBytes())

  return Math.round((megabytes(probe.totalBytes()) * percent) / 100)
}

export const machineOf = (probe: Probe = hostProbe): Machine => {
  const cgroup = cgroupMemory(probe)
  const totalMb = cgroup === undefined ? megabytes(probe.totalBytes()) : megabytes(cgroup.limit)
  const hostAvailable = availableOf(probe.read("/proc/meminfo") ?? "") ?? freeOf(probe)
  const availableMb =
    cgroup === undefined ? hostAvailable : Math.min(hostAvailable, megabytes(cgroup.limit - cgroup.used))

  return {
    cpus: cpusOf(probe.read("/sys/fs/cgroup/cpu.max") ?? "", probe.cpus()),
    totalMb,
    availableMb,
    cpuPressure: pressure(probe, "cpu"),
    memoryPressure: pressure(probe, "memory"),
    ioPressure: pressure(probe, "io")
  }
}

export const governorFolder = (environment: Environment = env): string =>
  environment["CI_GOVERNOR_DIR"] ?? new URL("../../../.moon/cache/governor", import.meta.url).pathname

const alive = (owner: number): boolean => {
  try {
    kill(owner, 0)

    return true
  } catch {
    return false
  }
}

const isGrant = (value: unknown): value is Grant => {
  if (typeof value !== "object" || value === null) return false
  if (!("pid" in value) || typeof value.pid !== "number") return false

  return "workers" in value && typeof value.workers === "number"
}

const grantOf = (text: string): Grant | undefined => {
  const parsed: unknown = JSON.parse(text)

  return isGrant(parsed) ? parsed : undefined
}

const grantsIn = (folder: string): ReadonlyArray<Grant> =>
  readdirSync(folder)
    .filter((name) => name.endsWith(".grant"))
    .flatMap((name) => {
      const grant = grantOf(readOrNothing(join(folder, name)) ?? "null")
      if (grant === undefined) return []
      if (alive(grant.pid)) return [grant]
      rmSync(join(folder, name), { force: true })

      return []
    })

const lockStaleMs = 10_000

const takeLock = (lock: string, now: number): boolean => {
  try {
    mkdirSync(lock)

    return true
  } catch {
    const modified = statSync(lock, { throwIfNoEntry: false })?.mtimeMs ?? now
    if (now - modified > lockStaleMs) rmSync(lock, { recursive: true, force: true })

    return false
  }
}

type Attempt =
  | { readonly _tag: "Busy" }
  | { readonly _tag: "Wait"; readonly reason: string }
  | { readonly _tag: "Admit"; readonly workers: number }

const attempt = (
  folder: string,
  want: number,
  kind: Kind,
  profile: Profile,
  machine: Machine,
  now: number
): Attempt => {
  const lock = join(folder, "lock")
  if (!takeLock(lock, now)) return { _tag: "Busy" }
  try {
    const decision = decide(want, kind, machine, grantsIn(folder), profile)
    if (decision._tag === "Wait") return decision
    const grant: Grant = { pid, kind, workers: decision.workers, mb: decision.mb }
    writeFileSync(join(folder, `${pid}.grant`), JSON.stringify(grant))
    process.once("exit", release.bind(undefined, join(folder, `${pid}.grant`)))

    return { _tag: "Admit", workers: decision.workers }
  } finally {
    rmSync(lock, { recursive: true, force: true })
  }
}

export const release = (file: string): void => rmSync(file, { force: true })

const say = (text: string) => stderr.write(`ci-governor: ${text}\n`)

export type Clock = { readonly now: () => number; readonly pause: (ms: number) => Promise<unknown> }

export const realClock: Clock = { now: () => performance.timeOrigin + performance.now(), pause: (ms) => sleep(ms) }

type Waiting = { readonly started: number; readonly reasons: ReadonlyArray<string>; readonly spoke: number }

const pauseMs = (): number => 750 + (pid % 500)

const admitting = async (
  folder: string,
  want: number,
  kind: Kind,
  probe: Probe,
  environment: Environment,
  clock: Clock,
  waiting: Waiting
): Promise<Admission> => {
  const machine = machineOf(probe)
  const profile = profileFor(machine, overridesOf(environment))
  const now = clock.now()
  const result = attempt(folder, want, kind, profile, machine, now)
  if (result._tag === "Admit") {
    return {
      workers: result.workers,
      timeoutScale: timeoutScale(machine, profile),
      waitedMs: Math.round(now - waiting.started),
      reasons: waiting.reasons,
      machine,
      profile
    }
  }
  const reason = result._tag === "Wait" ? result.reason : "another run is being admitted"
  const speak = now - waiting.spoke > 15_000
  if (speak) say(`waiting to start ${kind} tests: ${reason}`)
  await clock.pause(pauseMs())

  return admitting(folder, want, kind, probe, environment, clock, {
    started: waiting.started,
    reasons: waiting.reasons.includes(reason) ? waiting.reasons : [...waiting.reasons, reason],
    spoke: speak ? now : waiting.spoke
  })
}

export const admit = async (
  want: number,
  kind: Kind,
  environment: Environment,
  probe: Probe = hostProbe,
  clock: Clock = realClock
): Promise<Admission> => {
  const folder = governorFolder(environment)
  mkdirSync(folder, { recursive: true })
  const started = clock.now()

  return admitting(folder, want, kind, probe, environment, clock, { started, reasons: [], spoke: started })
}

export const record = (admission: Admission, name: string, environment: Environment = env): void => {
  const folder = environment["CI_REPORTS"]
  if (folder === undefined) return
  mkdirSync(join(folder, "governor"), { recursive: true })
  writeFileSync(join(folder, "governor", `${name}.json`), JSON.stringify(admission))
}
