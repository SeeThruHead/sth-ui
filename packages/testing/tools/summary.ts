import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { argv, exit, stdout } from "node:process"
import { breaches, describeSummary, summarize } from "../src/Pressure.ts"

const [reports = "/reports", mode = "report"] = argv.slice(2)

const read = (path: string): string => (existsSync(path) ? readFileSync(path, "utf8") : "")

const totalMb = Math.round(Number(/MemTotal:\s+(\d+) kB/.exec(read("/proc/meminfo"))?.[1] ?? 0) / 1024)

const governor = join(reports, "governor")

const waits = existsSync(governor)
  ? readdirSync(governor)
      .filter((name) => name.endsWith(".json") && name !== "summary.json")
      .map((name) => Number(JSON.parse(read(join(governor, name))).waitedMs ?? 0))
  : []

const summary = summarize(read(join(governor, "samples.txt")), totalMb, waits, read(join(reports, "log.txt")))
const crossed = breaches(summary)

writeFileSync(join(governor, "summary.json"), JSON.stringify({ ...summary, breaches: crossed }, null, 2))
stdout.write(`\n== CI capacity ==\n${describeSummary(summary)}\n`)
stdout.write(
  crossed.length === 0 ? "within limits\n" : `over the limits:\n${crossed.map((each) => `  ${each}`).join("\n")}\n`
)

if (mode === "enforce" && crossed.length > 0) exit(1)
