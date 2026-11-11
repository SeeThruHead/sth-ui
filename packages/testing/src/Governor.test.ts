import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { env, pid, ppid } from "node:process"
import { MutableRef } from "effect"
import { describe, expect, it } from "vitest"
import { admit, governorFolder, machineOf, realClock, record, release } from "./Governor.ts"
import { hostProbe, macFreePercent } from "./Host.ts"
import type { Admission, Clock, Probe } from "./Governor.ts"
import { governed, governedBy } from "./Suites.ts"
import { fromJson, toJson } from "./json.ts"

const gib = 1024 * 1024 * 1024

const probe = (files: Readonly<Record<string, string>> = {}): Probe => ({
  read: (path) => files[path],
  cpus: () => 8,
  totalBytes: () => 16 * gib,
  freeBytes: () => 12 * gib,
  freePercent: () => undefined
})

const folder = () => mkdtempSync(join(tmpdir(), "ci-governor-"))

const clockFrom = (start: number, onPause: () => void = () => undefined): Clock => {
  const now = MutableRef.make(start)

  return {
    now: () => MutableRef.get(now),
    pause: (ms) => {
      MutableRef.update(now, (current) => current + ms + 16_000)
      onPause()

      return Promise.resolve()
    }
  }
}

const grant = (dir: string, owner: number, workers: number) =>
  writeFileSync(join(dir, `${owner}.grant`), toJson({ pid: owner, kind: "node", workers, mb: workers * 450 }))

describe("reading the machine", () => {
  it("uses the container's cgroup limits and pressure when there are some", () => {
    const machine = machineOf(
      probe({
        "/sys/fs/cgroup/memory.max": String(8 * gib),
        "/sys/fs/cgroup/memory.current": String(2 * gib),
        "/sys/fs/cgroup/cpu.max": "400000 100000",
        "/sys/fs/cgroup/cpu.pressure": "some avg10=20.00 avg60=0 avg300=0 total=0",
        "/proc/pressure/memory": "some avg10=5.00 avg60=0 avg300=0 total=0",
        "/proc/meminfo": "MemAvailable: 20971520 kB"
      })
    )

    expect(machine).toEqual({
      cpus: 4,
      totalMb: 8192,
      availableMb: 6144,
      cpuPressure: 20,
      memoryPressure: 5,
      ioPressure: 0
    })
  })

  it("falls back to the operating system's figures without cgroups or pressure files", () => {
    expect(machineOf(probe())).toEqual({
      cpus: 8,
      totalMb: 16_384,
      availableMb: 12_288,
      cpuPressure: 0,
      memoryPressure: 0,
      ioPressure: 0
    })
    expect(hostProbe.read("/no/such/file")).toBeUndefined()
    expect(machineOf().cpus).toBeGreaterThan(0)
    expect(machineOf({ ...probe(), freePercent: () => 25 }).availableMb).toBe(4096)
    expect([
      macFreePercent("linux"),
      macFreePercent("darwin", () => "37\n"),
      macFreePercent("darwin", () => "x")
    ]).toEqual([undefined, 37, undefined])
    expect(hostProbe.cpus()).toBeGreaterThan(0)
  })

  it("keeps its grants in the moon cache unless told where", () => {
    expect(governorFolder({ CI_GOVERNOR_DIR: "/x" })).toBe("/x")
    expect(governorFolder({})).toMatch(/\.moon\/cache\/governor$/)
    expect(governorFolder()).toBe(governorFolder(env))
  })
})

describe("admitting test runs across processes", () => {
  it("grants workers to a run and records the grant under its process", async () => {
    const dir = folder()
    const admission = await admit(4, "node", { CI_GOVERNOR_DIR: dir }, probe(), clockFrom(1000))

    expect([admission.workers, admission.timeoutScale, admission.waitedMs, admission.reasons]).toEqual([4, 1, 0, []])
    expect(fromJson(readFileSync(join(dir, `${pid}.grant`), "utf8"))).toMatchObject({ pid, workers: 4 })
    rmSync(dir, { recursive: true })
  })

  it("waits while another live run holds every worker, and starts once it finishes", async () => {
    const dir = folder()
    grant(dir, ppid, 8)
    const clock = clockFrom(1000, () => rmSync(join(dir, `${ppid}.grant`)))
    const admission = await admit(4, "node", { CI_GOVERNOR_DIR: dir }, probe(), clock)

    expect(admission.reasons).toEqual(["all 8 workers are busy"])
    expect(admission.waitedMs).toBeGreaterThan(16_000)
    rmSync(dir, { recursive: true })
  })

  it("drops grants of runs that died and anything that isn't a grant", async () => {
    const dir = folder()
    grant(dir, 2_147_483_000, 8)
    writeFileSync(join(dir, "9.grant"), toJson({ hello: "there" }))
    writeFileSync(join(dir, "10.grant"), "5")
    mkdirSync(join(dir, "11.grant"))
    writeFileSync(join(dir, "note.txt"), "ignored")
    const admission = await admit(
      2,
      "node",
      { CI_GOVERNOR_DIR: dir, CI_GOVERNOR_WORKERS: "2" },
      probe(),
      clockFrom(1000)
    )

    expect(admission.workers).toBe(2)
    expect(existsSync(join(dir, "2147483000.grant"))).toBe(false)
    rmSync(dir, { recursive: true })
  })

  it("waits for another run being admitted, and breaks a lock left behind for over ten seconds", async () => {
    const dir = folder()
    mkdirSync(join(dir, "lock"))
    const busy = await admit(
      1,
      "node",
      { CI_GOVERNOR_DIR: dir },
      probe(),
      clockFrom(performance.timeOrigin + performance.now())
    )
    mkdirSync(join(dir, "lock"))
    utimesSync(join(dir, "lock"), 1, 1)
    const stale = await admit(
      1,
      "node",
      { CI_GOVERNOR_DIR: dir },
      probe(),
      clockFrom(performance.timeOrigin + performance.now())
    )

    expect(busy.reasons).toEqual(["another run is being admitted"])
    expect(stale.reasons).toEqual(["another run is being admitted"])
    expect(readdirSync(dir)).not.toContain("lock")
    rmSync(dir, { recursive: true })
  })
})

describe("the real clock and machine", () => {
  it("tells the time, pauses, and admits a run on this machine when nothing else holds the folder", async () => {
    const dir = folder()
    const before = realClock.now()
    await realClock.pause(1)
    const admission = await admit(1, "node", { CI_GOVERNOR_DIR: dir })

    expect(realClock.now()).toBeGreaterThan(before)
    expect(admission.workers).toBe(1)
    rmSync(dir, { recursive: true })
  })

  it("waits while the lock's place holds something that isn't a lock, until it is cleared", async () => {
    const dir = folder()
    symlinkSync(join(dir, "nowhere"), join(dir, "lock"))
    const admission = await admit(
      1,
      "node",
      { CI_GOVERNOR_DIR: dir },
      probe(),
      clockFrom(1000, () => rmSync(join(dir, "lock")))
    )

    expect(admission.reasons).toEqual(["another run is being admitted"])
    rmSync(dir, { recursive: true })
  })
})

describe("recording an admission", () => {
  const admission: Admission = {
    workers: 2,
    timeoutScale: 1.5,
    waitedMs: 3,
    reasons: [],
    machine: machineOf(probe()),
    profile: {
      workers: 8,
      perRun: 4,
      workerMb: 1,
      browserMb: 1,
      reserveMb: 1,
      maxCpuPressure: 1,
      maxMemoryPressure: 1,
      maxTimeoutScale: 4,
      moonConcurrency: 4
    }
  }

  it("writes it among the CI reports, and nowhere outside CI", () => {
    const dir = folder()
    record(admission, "budget.test.server", { CI_REPORTS: dir })
    record(admission, "budget.test.server", {})
    record(admission, "nothing.outside.ci")

    expect(fromJson(readFileSync(join(dir, "governor", "budget.test.server.json"), "utf8"))).toMatchObject({
      workers: 2
    })
    release(join(dir, "governor", "budget.test.server.json"))
    expect(existsSync(join(dir, "governor", "budget.test.server.json"))).toBe(false)
    rmSync(dir, { recursive: true })
  })

  it("sizes a suite's workers and stretches its timeouts by what was granted", () => {
    expect(governedBy({ test: { testTimeout: 20_000 } }, admission).test).toMatchObject({
      maxWorkers: 2,
      testTimeout: 30_000,
      hookTimeout: 15_000
    })
    expect(governedBy({}, admission).test).toMatchObject({ testTimeout: 7500 })
  })

  it("asks for a browser suite's or a fixed suite's workers, records it, and can be turned off", async () => {
    const dir = folder()
    const asked = MutableRef.make<ReadonlyArray<readonly [number, string]>>([])
    const admitting = (want: number, kind: string) => {
      MutableRef.update(asked, (calls) => [...calls, [want, kind] as const])

      return Promise.resolve(admission)
    }
    const environment = { CI_REPORTS: dir, MOON_PROJECT_ID: "budget", MOON_TASK_ID: "test-components" }

    await governed({ test: { name: "components", browser: { enabled: true } } }, environment, admitting)
    await governed({ test: { maxWorkers: 1 } }, {}, admitting)
    const off = await governed({ test: { name: "x" } }, { CI_GOVERNOR: "off" }, admitting)

    expect(MutableRef.get(asked)).toEqual([
      [Number.POSITIVE_INFINITY, "browser"],
      [1, "node"]
    ])
    expect(readdirSync(join(dir, "governor"))).toEqual(["budget.test-components.components.json"])
    expect(off).toEqual({ test: { name: "x" } })
    rmSync(dir, { recursive: true })
  })
})
