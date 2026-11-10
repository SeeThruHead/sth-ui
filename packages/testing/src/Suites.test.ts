import { describe, expect, it } from "vitest"
import { defaultProfile } from "./Capacity.ts"
import {
  componentCoverage,
  domainLayout,
  fullCoverage,
  logicSuite,
  packageSuite,
  pureSuite,
  select,
  serverSuite,
  warned
} from "./Suites.ts"

const layout = domainLayout((path) => !path.endsWith("Repo.ts"), "fixtures/app")

describe("domainLayout", () => {
  it("lists the pure domain modules and their tests, leaving out tests and server-only files", () => {
    expect(layout).toEqual({
      pureModules: ["src/domains/plan/Money.ts", "src/domains/plan/Plan.ts"],
      pureTests: ["src/domains/plan/Money.test.ts", "src/domains/plan/Plan.test.ts"]
    })
  })

  it("reads the domains under the folder it runs in", () => {
    expect(domainLayout(() => true)).toEqual({ pureModules: [], pureTests: [] })
  })
})

describe("suites", () => {
  it("runs the pure domain tests and covers the pure modules", () => {
    expect(pureSuite(layout).test?.include).toContain("src/domains/plan/Plan.test.ts")
    expect(pureSuite(layout).test?.coverage).toMatchObject({
      include: ["src/kernel/**", "src/domains/plan/Money.ts", "src/domains/plan/Plan.ts", "src/client/lib/**"],
      reportsDirectory: "coverage/pure"
    })
  })

  it("leaves the pure tests and modules out of the server suite", () => {
    const server = serverSuite(layout).test
    expect(server?.exclude).toEqual(["src/domains/plan/Money.test.ts", "src/domains/plan/Plan.test.ts"])
    expect(server?.coverage).toMatchObject({
      exclude: expect.arrayContaining(["src/domains/plan/Plan.ts", "src/app/server.ts"])
    })
  })

  it("takes extra server settings", () => {
    expect(serverSuite(layout, { passWithNoTests: true }).test?.passWithNoTests).toBe(true)
  })

  it("covers the usual client logic unless told otherwise", () => {
    expect(logicSuite().test?.coverage).toMatchObject({ include: expect.arrayContaining(["tools/attribution.ts"]) })
    expect(logicSuite(["src/client/app/**/update.ts"]).test?.coverage).toMatchObject({
      include: ["src/client/app/**/update.ts"]
    })
  })

  it("covers components and page views", () => {
    expect(componentCoverage).toMatchObject({ reportsDirectory: "coverage/components" })
  })

  it("measures coverage without failing on it, and warns below the bar", () => {
    expect(fullCoverage(["src/**"])).toMatchObject({ enabled: true, reporter: ["text-summary", "json-summary"] })
    expect(fullCoverage(["src/**"])).not.toHaveProperty("thresholds")
    expect(warned({ test: { name: "x" } }).test?.reporters).toEqual([
      "default",
      expect.objectContaining({ onFinishedReportCoverage: expect.any(Function) })
    ])
    expect(warned({ test: { name: "x", reporters: "dot" } }).test?.reporters).toHaveLength(2)
  })
})

const quiet = { CI_GOVERNOR: "off" }

const machine = { cpus: 4, totalMb: 8000, availableMb: 4000, cpuPressure: 0, memoryPressure: 0, ioPressure: 0 }

const admitThree = async () => ({
  workers: 3,
  timeoutScale: 1,
  waitedMs: 0,
  reasons: [],
  machine,
  profile: defaultProfile(machine)
})

describe("packageSuite", () => {
  it("runs a package's tests in src and covers src by default", async () => {
    expect((await packageSuite({ name: "kernel" }, quiet)).test).toMatchObject({
      name: "kernel",
      include: ["src/**/*.test.ts"],
      coverage: { include: ["src/**"] }
    })
    expect((await packageSuite({ name: "kernel" }, quiet)).test?.sequence).toBeUndefined()
    expect((await packageSuite({ name: "kernel" }, undefined, admitThree)).test?.maxWorkers).toBe(3)
  })

  it("takes its own tests, coverage and one-at-a-time running", async () => {
    expect(
      (
        await packageSuite(
          {
            name: "lint",
            include: ["*.test.ts"],
            covered: ["layout.ts"],
            uncovered: ["x.ts"],
            sequential: true
          },
          quiet
        )
      ).test
    ).toMatchObject({
      include: ["*.test.ts"],
      coverage: { include: ["layout.ts"], exclude: expect.arrayContaining(["x.ts"]) },
      sequence: { concurrent: false }
    })
  })
})

describe("select", () => {
  const suites = { pure: pureSuite(layout), logic: logicSuite() }

  it("picks the suite named by VITEST_SUITE", async () => {
    expect((await select(suites, "logic", quiet)).test?.name).toBe("logic")
  })

  it("says which suites there are when none is chosen", () => {
    expect(() => select(suites, "")).toThrow('Set VITEST_SUITE to one of: pure, logic (got "")')
  })

  it("reads VITEST_SUITE from the environment", () => {
    expect(() => select(suites)).toThrow("Set VITEST_SUITE")
  })
})
