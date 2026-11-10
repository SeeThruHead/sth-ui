import { describe, expect, it } from "@effect/vitest"
import { readdirSync } from "node:fs"
import { exportName, fileName, indexOf, moduleOf, pathsOf } from "./svg.ts"

describe("Phosphor SVGs", () => {
  it("names each weight's file as Phosphor does", () => {
    expect(fileName("house", "regular")).toBe("house.svg")
    expect(fileName("house", "duotone")).toBe("house-duotone.svg")
  })

  it("exports each icon in PascalCase with an Icon suffix", () => {
    expect(exportName("arrow-u-up-left")).toBe("ArrowUUpLeftIcon")
  })

  it("reads every path and its opacity", () => {
    const svg = '<svg viewBox="0 0 256 256"><path d="M1,2Z" opacity="0.2"/><path d="M3,4Z"/></svg>'

    expect(pathsOf(svg)).toEqual([{ d: "M1,2Z", opacity: 0.2 }, { d: "M3,4Z" }])
  })

  it("reads a path with no outline as one that draws nothing", () => {
    expect(pathsOf('<svg><path opacity="0.2"/></svg>')).toEqual([{ d: "", opacity: 0.2 }])
  })

  it("writes a module and an index", () => {
    const data = {
      thin: [],
      light: [],
      regular: [{ d: "M1" }],
      bold: [],
      fill: [],
      duotone: [{ d: "M2", opacity: 0.2 }]
    }

    expect(moduleOf("house", data)).toContain('export const HouseIcon = icon("house", {')
    expect(moduleOf("house", data)).toContain('duotone: [{ d: "M2", opacity: 0.2 }]')
    expect(indexOf(["house"])).toContain('export { HouseIcon } from "./icons/HouseIcon.ts"')
  })
})

describe("generated icons", () => {
  it("has a module for every Phosphor icon", () => {
    const assets = new URL("../node_modules/@phosphor-icons/core/assets/regular", import.meta.url)
    const generated = new URL("../src/icons", import.meta.url)
    const names = readdirSync(assets).map((file) => exportName(file.replace(/\.svg$/, "")))

    expect(
      readdirSync(generated)
        .map((file) => file.replace(/\.ts$/, ""))
        .toSorted()
    ).toEqual(names.toSorted())
  })
})
