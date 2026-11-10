import { describe, expect, it } from "vitest"
import { breaches, defaultLimits, describeSummary, sampleOf, summarize } from "./Pressure.ts"

const line = (at: number, availableKb: number, cpu = 0, memory = 0, io = 0) =>
  `${at}|${availableKb}|some avg10=${cpu} avg60=0|some avg10=${memory} avg60=0|some avg10=${io} avg60=0`

describe("pressure samples", () => {
  it("reads a sample line and skips anything that isn't one", () => {
    expect(sampleOf(line(10, 2_097_152, 12.5, 1, 3))).toEqual({
      at: 10,
      availableMb: 2048,
      cpu: 12.5,
      memory: 1,
      io: 3
    })
    expect(sampleOf("10|1024")).toEqual({ at: 10, availableMb: 1, cpu: 0, memory: 0, io: 0 })
    expect([sampleOf(""), sampleOf("x|1"), sampleOf("10|0"), sampleOf("10")]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined
    ])
  })

  it("sums up a run: how full memory got, the worst pressure, the waiting and the timeouts", () => {
    const text = [line(100, 8_388_608, 10), line(102, 1_638_400, 40, 5, 20), "junk", line(110, 4_194_304)].join("\n")
    const log = "ok\nError: Test timed out in 20000ms.\nTimed out 10000ms waiting for expect(locator)\n"
    const summary = summarize(text, 16_000, [1500, 2500], log)

    expect(summary).toEqual({
      samples: 3,
      seconds: 10,
      totalMb: 16_000,
      peakUsedPercent: 90,
      lowestAvailableMb: 1600,
      worstCpuPressure: 40,
      worstMemoryPressure: 5,
      worstIoPressure: 20,
      admissions: 2,
      waitedSeconds: 4,
      timeouts: 2
    })
    expect(describeSummary(summary)).toContain("memory: peaked at 90% used, lowest free 1600 MB")
  })

  it("has nothing to say about an empty run", () => {
    expect(summarize("", 0, [], "")).toMatchObject({ samples: 0, seconds: 0, peakUsedPercent: 0, timeouts: 0 })
  })

  it("names every limit a run crossed", () => {
    const calm = summarize(line(1, 8_388_608), 16_000, [], "")
    const rough = { ...calm, peakUsedPercent: 97, worstMemoryPressure: 40, timeouts: 3 }

    expect(breaches(calm)).toEqual([])
    expect(breaches(rough, defaultLimits)).toEqual([
      "memory peaked at 97% (limit 90%)",
      "memory pressure reached 40% (limit 25%)",
      "3 tests timed out (limit 0)"
    ])
  })
})
