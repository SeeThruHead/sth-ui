import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Effect, FileSystem, Path } from "effect"
import type { IconPath, IconWeight } from "../src/Icon.ts"
import { exportName, fileName, indexOf, moduleOf, pathsOf, weights } from "./svg.ts"

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const assets = path.join(import.meta.dirname, "../node_modules/@phosphor-icons/core/assets")
  const out = path.join(import.meta.dirname, "../src")
  const names = (yield* fs.readDirectory(path.join(assets, "regular")))
    .filter((file) => file.endsWith(".svg"))
    .map((file) => file.replace(/\.svg$/, ""))
    .toSorted()
  const read = (name: string, weight: IconWeight) =>
    Effect.map(
      fs.readFileString(path.join(assets, weight, fileName(name, weight))),
      (svg) => [weight, pathsOf(svg)] as const
    )
  const writeIcon = Effect.fn("icons.writeIcon")(function* (name: string) {
    const pairs = yield* Effect.forEach(weights, (weight) => read(name, weight))
    const data: Readonly<Record<IconWeight, ReadonlyArray<IconPath>>> = {
      thin: [],
      light: [],
      regular: [],
      bold: [],
      fill: [],
      duotone: [],
      ...Object.fromEntries(pairs)
    }
    yield* fs.writeFileString(path.join(out, "icons", `${exportName(name)}.ts`), moduleOf(name, data))
  })
  yield* Effect.forEach(names, writeIcon, { concurrency: 16 })
  yield* fs.writeFileString(path.join(out, "index.ts"), indexOf(names))
  yield* Effect.logInfo(`${names.length} icons to ${out}`)
})

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
