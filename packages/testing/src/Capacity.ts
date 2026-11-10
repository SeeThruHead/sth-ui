export type Kind = "node" | "browser"

export type Machine = {
  readonly cpus: number
  readonly totalMb: number
  readonly availableMb: number
  readonly cpuPressure: number
  readonly memoryPressure: number
  readonly ioPressure: number
}

export type Profile = {
  readonly workers: number
  readonly perRun: number
  readonly workerMb: number
  readonly browserMb: number
  readonly reserveMb: number
  readonly maxCpuPressure: number
  readonly maxMemoryPressure: number
  readonly maxTimeoutScale: number
  readonly moonConcurrency: number
}

export type Grant = { readonly pid: number; readonly kind: Kind; readonly workers: number; readonly mb: number }

export type Decision =
  | { readonly _tag: "Admit"; readonly workers: number; readonly mb: number }
  | { readonly _tag: "Wait"; readonly reason: string }

export type Overrides = Readonly<Partial<Record<keyof Profile, number>>>

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value))

export const defaultProfile = (machine: Machine): Profile => ({
  workers: Math.max(1, machine.cpus),
  perRun: Math.max(1, Math.floor(machine.cpus / 2)),
  workerMb: 450,
  browserMb: 1200,
  reserveMb: Math.max(1024, Math.round(machine.totalMb * 0.15)),
  maxCpuPressure: 60,
  maxMemoryPressure: 10,
  maxTimeoutScale: 4,
  moonConcurrency: Math.max(2, Math.floor(machine.cpus / 2))
})

export const profileFor = (machine: Machine, overrides: Overrides = {}): Profile => ({
  ...defaultProfile(machine),
  ...overrides
})

const perWorker = (profile: Profile, kind: Kind): number => (kind === "browser" ? profile.browserMb : profile.workerMb)

const pressureReason = (machine: Machine, profile: Profile): string | undefined => {
  if (machine.memoryPressure > profile.maxMemoryPressure) return `memory pressure is ${machine.memoryPressure}%`
  if (machine.cpuPressure > profile.maxCpuPressure) return `CPU pressure is ${machine.cpuPressure}%`

  return undefined
}

const fits = (want: number, kind: Kind, machine: Machine, grants: ReadonlyArray<Grant>, profile: Profile): Decision => {
  const each = perWorker(profile, kind)
  const freeWorkers = profile.workers - grants.reduce((sum, grant) => sum + grant.workers, 0)
  if (freeWorkers < 1) return { _tag: "Wait", reason: `all ${profile.workers} workers are busy` }
  const pressure = pressureReason(machine, profile)
  if (pressure !== undefined) return { _tag: "Wait", reason: pressure }
  const byMemory = Math.floor((machine.availableMb - profile.reserveMb) / each)
  if (byMemory < 1) return { _tag: "Wait", reason: `only ${machine.availableMb} MB of memory is free` }
  const workers = Math.max(1, Math.min(want, profile.perRun, freeWorkers, byMemory))

  return { _tag: "Admit", workers, mb: workers * each }
}

export const decide = (
  want: number,
  kind: Kind,
  machine: Machine,
  grants: ReadonlyArray<Grant>,
  profile: Profile
): Decision => {
  const decision = fits(want, kind, machine, grants, profile)
  if (decision._tag === "Wait" && grants.length === 0) {
    return { _tag: "Admit", workers: 1, mb: perWorker(profile, kind) }
  }

  return decision
}

export const timeoutScale = (machine: Machine, profile: Profile): number =>
  clamp(1 + (machine.cpuPressure + machine.ioPressure) / 50, 1, profile.maxTimeoutScale)

export const pressureOf = (text: string): number => {
  const found = /some avg10=([\d.]+)/.exec(text)

  return found?.[1] === undefined ? 0 : Number(found[1])
}

export const megabytes = (bytes: number): number => Math.round(bytes / 1024 / 1024)

export const memoryLimitOf = (text: string): number | undefined => {
  const trimmed = text.trim()
  if (trimmed === "max" || trimmed === "") return undefined

  return Number(trimmed)
}

export const cpusOf = (text: string, fallback: number): number => {
  const [quota, period] = text.trim().split(/\s+/)
  if (quota === undefined || quota === "max" || period === undefined) return fallback

  return Math.max(1, Math.floor(Number(quota) / Number(period)))
}

export const availableOf = (meminfo: string): number | undefined => {
  const found = /MemAvailable:\s+(\d+) kB/.exec(meminfo)

  return found?.[1] === undefined ? undefined : Math.round(Number(found[1]) / 1024)
}

export const overridesOf = (environment: Readonly<Record<string, string | undefined>>): Overrides => {
  const keys: ReadonlyArray<readonly [keyof Profile, string]> = [
    ["workers", "CI_GOVERNOR_WORKERS"],
    ["perRun", "CI_GOVERNOR_PER_RUN"],
    ["workerMb", "CI_GOVERNOR_WORKER_MB"],
    ["browserMb", "CI_GOVERNOR_BROWSER_MB"],
    ["reserveMb", "CI_GOVERNOR_RESERVE_MB"],
    ["maxCpuPressure", "CI_GOVERNOR_MAX_CPU_PRESSURE"],
    ["maxMemoryPressure", "CI_GOVERNOR_MAX_MEMORY_PRESSURE"],
    ["maxTimeoutScale", "CI_GOVERNOR_MAX_TIMEOUT_SCALE"],
    ["moonConcurrency", "CI_GOVERNOR_MOON_CONCURRENCY"]
  ]

  return Object.fromEntries(
    keys.flatMap(([key, name]) => {
      const value = Number(environment[name])

      return environment[name] !== undefined && Number.isFinite(value) && value > 0 ? [[key, value]] : []
    })
  )
}
