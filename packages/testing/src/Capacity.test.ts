import { describe, expect, it } from "vitest"
import {
  availableOf,
  cpusOf,
  decide,
  defaultProfile,
  megabytes,
  memoryLimitOf,
  overridesOf,
  pressureOf,
  profileFor,
  timeoutScale
} from "./Capacity.ts"
import type { Grant, Machine } from "./Capacity.ts"

const calm: Machine = {
  cpus: 8,
  totalMb: 16_000,
  availableMb: 12_000,
  cpuPressure: 0,
  memoryPressure: 0,
  ioPressure: 0
}
const profile = defaultProfile(calm)
const running = (workers: number): Grant => ({ pid: 1, kind: "node", workers, mb: workers * 450 })

describe("the capacity of a machine", () => {
  it("defaults to a worker per CPU, a reserve of memory and half the CPUs for moon", () => {
    expect(profile).toEqual({
      workers: 8,
      perRun: 4,
      workerMb: 450,
      browserMb: 1200,
      reserveMb: 2400,
      maxCpuPressure: 60,
      maxMemoryPressure: 10,
      maxTimeoutScale: 4,
      moonConcurrency: 4
    })
    expect(defaultProfile({ ...calm, cpus: 1, totalMb: 2000 })).toMatchObject({
      workers: 1,
      reserveMb: 1024,
      moonConcurrency: 2
    })
    expect(profileFor(calm, { workers: 3 }).workers).toBe(3)
    expect(profileFor(calm)).toEqual(profile)
  })

  it("reads tuning from CI_GOVERNOR_ variables, ignoring anything that isn't a positive number", () => {
    expect(
      overridesOf({
        CI_GOVERNOR_WORKERS: "6",
        CI_GOVERNOR_PER_RUN: "2",
        CI_GOVERNOR_MOON_CONCURRENCY: "3",
        CI_GOVERNOR_WORKER_MB: "x",
        CI_GOVERNOR_RESERVE_MB: "-1"
      })
    ).toEqual({ workers: 6, perRun: 2, moonConcurrency: 3 })
    expect(overridesOf({})).toEqual({})
  })
})

describe("admitting a test run", () => {
  it("gives a run what it wants while CPUs and memory are free", () => {
    expect(decide(4, "node", calm, [], profile)).toEqual({ _tag: "Admit", workers: 4, mb: 1800 })
    expect(decide(64, "node", calm, [], profile)).toEqual({ _tag: "Admit", workers: 4, mb: 1800 })
    expect(decide(64, "node", calm, [running(5)], profile)).toEqual({ _tag: "Admit", workers: 3, mb: 1350 })
    expect(decide(64, "node", calm, [running(1)], profileFor(calm, { perRun: 8 }))).toEqual({
      _tag: "Admit",
      workers: 7,
      mb: 3150
    })
  })

  it("limits the workers to the memory that is left, and browsers need more", () => {
    const tight = { ...calm, availableMb: 4000 }

    expect(decide(64, "node", tight, [running(1)], profile)).toEqual({ _tag: "Admit", workers: 3, mb: 1350 })
    expect(decide(64, "browser", tight, [running(1)], profile)).toEqual({ _tag: "Admit", workers: 1, mb: 1200 })
  })

  it("waits while every worker is busy, memory is short or the machine is under pressure", () => {
    expect(decide(2, "node", calm, [running(8)], profile)).toEqual({ _tag: "Wait", reason: "all 8 workers are busy" })
    expect(decide(2, "node", { ...calm, availableMb: 2500 }, [running(1)], profile)).toEqual({
      _tag: "Wait",
      reason: "only 2500 MB of memory is free"
    })
    expect(decide(2, "node", { ...calm, memoryPressure: 30 }, [running(1)], profile)).toEqual({
      _tag: "Wait",
      reason: "memory pressure is 30%"
    })
    expect(decide(2, "node", { ...calm, cpuPressure: 90 }, [running(1)], profile)).toEqual({
      _tag: "Wait",
      reason: "CPU pressure is 90%"
    })
  })

  it("always lets one run start with one worker when nothing else is running, so nothing waits forever", () => {
    expect(decide(4, "browser", { ...calm, availableMb: 500, cpuPressure: 99 }, [], profile)).toEqual({
      _tag: "Admit",
      workers: 1,
      mb: 1200
    })
  })

  it("gives tests more time the more the machine stalls on CPU and disk", () => {
    expect(timeoutScale(calm, profile)).toBe(1)
    expect(timeoutScale({ ...calm, cpuPressure: 25, ioPressure: 25 }, profile)).toBe(2)
    expect(timeoutScale({ ...calm, cpuPressure: 100, ioPressure: 100 }, profile)).toBe(4)
  })
})

describe("reading the machine", () => {
  it("reads pressure, memory and CPU limits the way Linux writes them", () => {
    expect(pressureOf("some avg10=12.50 avg60=3.00 avg300=1.00 total=1\nfull avg10=1.00")).toBe(12.5)
    expect(pressureOf("")).toBe(0)
    expect(megabytes(16 * 1024 * 1024 * 1024)).toBe(16_384)
    expect([memoryLimitOf("max\n"), memoryLimitOf(""), memoryLimitOf("1048576\n")]).toEqual([
      undefined,
      undefined,
      1_048_576
    ])
    expect([cpusOf("400000 100000", 8), cpusOf("max 100000", 8), cpusOf("", 8), cpusOf("50000 100000", 8)]).toEqual([
      4, 8, 8, 1
    ])
    expect([availableOf("MemTotal: 1 kB\nMemAvailable:    2097152 kB\n"), availableOf("")]).toEqual([2048, undefined])
  })
})
