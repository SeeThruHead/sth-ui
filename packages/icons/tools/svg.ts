import type { IconPath, IconWeight } from "../src/Icon.ts"

export const weights: ReadonlyArray<IconWeight> = ["thin", "light", "regular", "bold", "fill", "duotone"]

export const fileName = (name: string, weight: IconWeight): string =>
  weight === "regular" ? `${name}.svg` : `${name}-${weight}.svg`

export const exportName = (name: string): string =>
  `${name
    .split("-")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join("")}Icon`

const attribute = (element: string, name: string): string | undefined =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(element)?.[1]

export const pathsOf = (svg: string): ReadonlyArray<IconPath> =>
  [...svg.matchAll(/<path\b[^>]*>/g)].map((found) => {
    const d = attribute(found[0], "d") ?? ""
    const opacity = attribute(found[0], "opacity")

    return opacity === undefined ? { d } : { d, opacity: Number(opacity) }
  })

const literal = (path: IconPath): string =>
  path.opacity === undefined ? `{ d: "${path.d}" }` : `{ d: "${path.d}", opacity: ${path.opacity} }`

export const moduleOf = (name: string, data: Readonly<Record<IconWeight, ReadonlyArray<IconPath>>>): string =>
  [
    'import { icon } from "../Icon.ts"',
    "",
    `export const ${exportName(name)} = icon("${name}", {`,
    weights.map((weight) => `  ${weight}: [${data[weight].map(literal).join(", ")}]`).join(",\n"),
    "})",
    ""
  ].join("\n")

export const indexOf = (names: ReadonlyArray<string>): string =>
  [
    ...names.map((name) => `export { ${exportName(name)} } from "./icons/${exportName(name)}.ts"`),
    'export type { Icon, IconData, IconPath, IconProps, IconWeight } from "./Icon.ts"',
    'export { icon } from "./Icon.ts"',
    ""
  ].join("\n")
