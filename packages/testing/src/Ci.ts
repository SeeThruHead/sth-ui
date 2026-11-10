import { readFileSync } from "node:fs"
import { env } from "node:process"
import type { ViteUserConfig } from "vitest/config"
import { ciReporter } from "./CiReporter.ts"
import { decodeQuarantine, quarantinedIn, skipPattern, type QuarantineList } from "./Quarantine.ts"

export type Config = ViteUserConfig
export type Environment = Readonly<Record<string, string | undefined>>

export const quarantineFile = new URL("../../../ci/quarantine.json", import.meta.url)

export const readQuarantine = (file: URL = quarantineFile): QuarantineList =>
  decodeQuarantine(readFileSync(file, "utf8"))

type Reporters = NonNullable<NonNullable<Config["test"]>["reporters"]>

type ReporterEntry = Extract<Reporters, ReadonlyArray<unknown>>[number]

export const reportersOf = (config: Config): ReadonlyArray<ReporterEntry> => {
  const existing = config.test?.reporters
  if (existing === undefined) return ["default"]

  return Array.isArray(existing) ? existing : [existing]
}

const reporters = (config: Config, environment: Environment, app: string, task: string, suite: string) => {
  const folder = environment["CI_REPORTS"]
  if (!folder) return {}
  return {
    reporters: [
      ...reportersOf(config),
      ciReporter(`${folder}/vitest/${app}.${task}.${suite}.json`, { app, task, suite })
    ]
  }
}

const skipping = (pattern: RegExp | undefined) => (pattern ? { testNamePattern: pattern } : {})

export const suiteName = (name: string | { readonly label: string } | undefined): string =>
  typeof name === "object" ? name.label : (name ?? "test")

export const withCi = (
  config: Config,
  environment: Environment = env,
  quarantine: () => QuarantineList = readQuarantine
): Config => {
  if (!environment["CI"]) return config
  const suite = suiteName(config.test?.name)
  const app = environment["MOON_PROJECT_ID"] ?? suite
  const task = environment["MOON_TASK_ID"] ?? "test"
  return {
    ...config,
    test: {
      ...config.test,
      retry: 2,
      ...skipping(skipPattern(quarantinedIn(quarantine(), app))),
      ...reporters(config, environment, app, task, suite)
    }
  }
}

export type PlaywrightReporter = ["list"] | ["json", { outputFile: string }]

export const playwrightReporters = (environment: Environment = env): Array<PlaywrightReporter> => {
  const folder = environment["CI_REPORTS"]
  const app = environment["MOON_PROJECT_ID"] ?? "e2e"
  return folder ? [["list"], ["json", { outputFile: `${folder}/playwright/${app}.json` }]] : [["list"]]
}
