import { env } from "node:process"
import { type Config, reportersOf, suiteName, withCi } from "./Ci.ts"
import { coverageWarnings } from "./CoverageBar.ts"
import { admit, record } from "./Governor.ts"
import type { Admission, Environment } from "./Governor.ts"
import type { Kind } from "./Capacity.ts"

export type { Config } from "./Ci.ts"
type Test = NonNullable<Config["test"]>
type Coverage = NonNullable<Test["coverage"]>

export type Layout = {
  readonly pureModules: ReadonlyArray<string>
  readonly pureTests: ReadonlyArray<string>
}

const testTimeout = 20_000

export const fullCoverage = (
  include: ReadonlyArray<string>,
  exclude: ReadonlyArray<string> = [],
  reportsDirectory = "coverage"
): Coverage => ({
  enabled: true,
  provider: "istanbul",
  include: [...include],
  exclude: ["**/*.test.ts", "**/*.testing.ts", "**/*.stories.ts", ...exclude],
  reporter: ["text-summary", "json-summary"],
  reportsDirectory
})

export const warned = (config: Config): Config => ({
  ...config,
  test: {
    ...config.test,
    reporters: [
      ...reportersOf(config),
      coverageWarnings(suiteName(config.test?.name), config.test?.coverage?.reportsDirectory ?? "coverage")
    ]
  }
})

export const domainLayout = (isPure: (path: string) => boolean, cwd = "."): Layout => {
  const pureModules = [...new Bun.Glob("src/domains/*/*.ts").scanSync(cwd)]
    .filter((path) => !path.endsWith(".test.ts"))
    .filter((path) => isPure(path.replace(/^src\//, "")))
    .toSorted()
  return { pureModules, pureTests: pureModules.map((path) => path.replace(/\.ts$/, ".test.ts")) }
}

export const pureSuite = (layout: Layout): Config => ({
  test: {
    testTimeout,
    name: "pure",
    include: ["src/kernel/**/*.test.ts", ...layout.pureTests, "src/client/lib/**/*.test.ts"],
    coverage: {
      ...fullCoverage(["src/kernel/**", ...layout.pureModules, "src/client/lib/**"]),
      reportsDirectory: "coverage/pure"
    }
  }
})

export const logicCovered: ReadonlyArray<string> = [
  "src/client/pages/**/update.ts",
  "src/client/pages/**/model.ts",
  "src/client/app/**/update.ts",
  "src/client/pages/**/props.ts",
  "tools/attribution.ts"
]

export const logicSuite = (covered: ReadonlyArray<string> = logicCovered): Config => ({
  test: {
    testTimeout,
    name: "logic",
    include: [
      "src/client/pages/**/*.test.ts",
      "src/client/app/**/*.test.ts",
      "lint/**/*.test.ts",
      "tools/**/*.test.ts"
    ],
    coverage: { ...fullCoverage(covered), reportsDirectory: "coverage/logic" }
  }
})

export const serverSuite = (layout: Layout, extra: Test = {}): Config => ({
  test: {
    testTimeout,
    name: "server",
    include: [
      "src/framework/**/*.test.ts",
      "src/domains/**/*.test.ts",
      "src/features/**/*.test.ts",
      "src/app/**/*.test.ts",
      "test/**/*.test.ts"
    ],
    exclude: [...layout.pureTests],
    sequence: { concurrent: false },
    coverage: {
      ...fullCoverage(
        ["src/framework/**", "src/domains/**", "src/features/**", "src/app/**"],
        [...layout.pureModules, "src/app/server.ts"]
      ),
      reportsDirectory: "coverage/server"
    },
    ...extra
  }
})

export const componentCoverage: Coverage = {
  ...fullCoverage(["src/client/components/**", "src/client/pages/**/*Page.ts"]),
  reportsDirectory: "coverage/components"
}

export type PackageSuite = {
  readonly name: string
  readonly include?: ReadonlyArray<string>
  readonly covered?: ReadonlyArray<string>
  readonly uncovered?: ReadonlyArray<string>
  readonly sequential?: boolean
  readonly reportsDirectory?: string
}

const kindOf = (config: Config): Kind => (config.test?.browser?.enabled === true ? "browser" : "node")

const wanted = (config: Config, cpus: number): number => {
  const fixed = config.test?.maxWorkers

  return typeof fixed === "number" ? fixed : cpus
}

const scaled = (base: number | undefined, fallback: number, scale: number): number =>
  Math.round((base ?? fallback) * scale)

export const governedBy = (config: Config, admission: Admission): Config => ({
  ...config,
  test: {
    ...config.test,
    maxWorkers: admission.workers,
    testTimeout: scaled(config.test?.testTimeout, 5_000, admission.timeoutScale),
    hookTimeout: scaled(config.test?.hookTimeout, 10_000, admission.timeoutScale)
  }
})

type Admit = typeof admit

export const governed = async (config: Config, environment: Environment, admitting: Admit = admit) => {
  if (environment["CI_GOVERNOR"] === "off") return config
  const admission = await admitting(wanted(config, Number.POSITIVE_INFINITY), kindOf(config), environment)
  const suite = typeof config.test?.name === "string" ? config.test.name : undefined
  const name = [environment["MOON_PROJECT_ID"], environment["MOON_TASK_ID"], suite]
    .filter((part): part is string => part !== undefined)
    .join(".")
  record(admission, name === "" ? "vitest" : name, environment)

  return governedBy(config, admission)
}

export const packageSuite = (
  suite: PackageSuite,
  environment: Environment = env,
  admitting: Admit = admit
): Promise<Config> =>
  governed(
    withCi(
      warned({
        test: {
          testTimeout,
          name: suite.name,
          include: [...(suite.include ?? ["src/**/*.test.ts"])],
          ...(suite.sequential ? { sequence: { concurrent: false } } : {}),
          coverage: fullCoverage(suite.covered ?? ["src/**"], suite.uncovered ?? [], suite.reportsDirectory)
        }
      })
    ),
    environment,
    admitting
  )

export const select = (
  suites: Readonly<Record<string, Config>>,
  chosen = env["VITEST_SUITE"] ?? "",
  environment: Environment = env
): Promise<Config> => {
  const suite = suites[chosen]
  if (suite) return governed(withCi(warned(suite)), environment)
  throw new Error(`Set VITEST_SUITE to one of: ${Object.keys(suites).join(", ")} (got "${chosen}")`)
}
