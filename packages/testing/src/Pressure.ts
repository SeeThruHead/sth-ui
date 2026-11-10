import { pressureOf } from "./Capacity.ts"

export type Sample = {
  readonly at: number
  readonly availableMb: number
  readonly cpu: number
  readonly memory: number
  readonly io: number
}

export type Summary = {
  readonly samples: number
  readonly seconds: number
  readonly totalMb: number
  readonly peakUsedPercent: number
  readonly lowestAvailableMb: number
  readonly worstCpuPressure: number
  readonly worstMemoryPressure: number
  readonly worstIoPressure: number
  readonly admissions: number
  readonly waitedSeconds: number
  readonly timeouts: number
}

export type Limits = {
  readonly peakUsedPercent: number
  readonly worstMemoryPressure: number
  readonly timeouts: number
}

export const defaultLimits: Limits = { peakUsedPercent: 90, worstMemoryPressure: 25, timeouts: 0 }

export const sampleOf = (line: string): Sample | undefined => {
  const [at, available, ...rest] = line.split("|")
  const [cpu, memory, io] = rest
  if (at === undefined || available === undefined) return undefined
  const seconds = Number(at)
  const kilobytes = Number(available)
  if (!Number.isFinite(seconds) || !Number.isFinite(kilobytes) || kilobytes <= 0) return undefined

  return {
    at: seconds,
    availableMb: Math.round(kilobytes / 1024),
    cpu: pressureOf(cpu ?? ""),
    memory: pressureOf(memory ?? ""),
    io: pressureOf(io ?? "")
  }
}

const worst = (samples: ReadonlyArray<Sample>, pick: (sample: Sample) => number): number =>
  samples.reduce((most, sample) => Math.max(most, pick(sample)), 0)

export const summarize = (text: string, totalMb: number, waits: ReadonlyArray<number>, log: string): Summary => {
  const samples = text.split("\n").flatMap((line) => {
    const sample = sampleOf(line)

    return sample === undefined ? [] : [sample]
  })
  const lowest = samples.reduce((least, sample) => Math.min(least, sample.availableMb), totalMb)
  const first = samples[0]?.at ?? 0
  const last = samples.at(-1)?.at ?? first

  return {
    samples: samples.length,
    seconds: last - first,
    totalMb,
    peakUsedPercent: totalMb === 0 ? 0 : Math.round(((totalMb - lowest) / totalMb) * 100),
    lowestAvailableMb: lowest,
    worstCpuPressure: worst(samples, (sample) => sample.cpu),
    worstMemoryPressure: worst(samples, (sample) => sample.memory),
    worstIoPressure: worst(samples, (sample) => sample.io),
    admissions: waits.length,
    waitedSeconds: Math.round(waits.reduce((sum, wait) => sum + wait, 0) / 1000),
    timeouts: log.split("\n").filter((line) => /Test timed out in \d+ms|Timed out \d+ms waiting/.test(line)).length
  }
}

export const breaches = (summary: Summary, limits: Limits = defaultLimits): ReadonlyArray<string> => [
  ...(summary.peakUsedPercent > limits.peakUsedPercent
    ? [`memory peaked at ${summary.peakUsedPercent}% (limit ${limits.peakUsedPercent}%)`]
    : []),
  ...(summary.worstMemoryPressure > limits.worstMemoryPressure
    ? [`memory pressure reached ${summary.worstMemoryPressure}% (limit ${limits.worstMemoryPressure}%)`]
    : []),
  ...(summary.timeouts > limits.timeouts ? [`${summary.timeouts} tests timed out (limit ${limits.timeouts})`] : [])
]

export const describeSummary = (summary: Summary): string =>
  [
    `machine: ${summary.totalMb} MB, sampled ${summary.samples} times over ${summary.seconds}s`,
    `memory: peaked at ${summary.peakUsedPercent}% used, lowest free ${summary.lowestAvailableMb} MB`,
    `pressure (worst 10s average): CPU ${summary.worstCpuPressure}%, memory ${summary.worstMemoryPressure}%, IO ${summary.worstIoPressure}%`,
    `admission: ${summary.admissions} test runs, ${summary.waitedSeconds}s spent waiting for room`,
    `timeouts: ${summary.timeouts}`
  ].join("\n")
