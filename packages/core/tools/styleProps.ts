import { breakpointNames, flexTable, responsiveTable } from "../src/styles/stylePropTable.ts"

const props = Object.entries({ ...responsiveTable, ...flexTable })

const varsFile = [
  'import * as stylex from "@stylexjs/stylex"',
  "",
  "export const stylePropVars = stylex.defineVars({",
  ...props.flatMap(([name]) => ["base", ...breakpointNames].map((point) => `  ${name}_${point}: "initial",`)),
  "})",
  ""
].join("\n")

const rule = ([name, [, property]]: readonly [string, readonly [string, string]]): string =>
  [
    `  ${name}: {`,
    `    ${property}: {`,
    `      default: stylePropVars.${name}_base,`,
    ...breakpointNames.map((point) => `      [breakpoints.${point}]: stylePropVars.${name}_${point},`),
    "    }",
    "  },"
  ].join("\n")

const rulesFile = [
  'import * as stylex from "@stylexjs/stylex"',
  'import { stylePropVars } from "./stylePropVars.stylex.ts"',
  "",
  "const breakpoints = {",
  '  xs: "@media (min-width: 36em)",',
  '  sm: "@media (min-width: 48em)",',
  '  md: "@media (min-width: 62em)",',
  '  lg: "@media (min-width: 75em)",',
  '  xl: "@media (min-width: 88em)"',
  "}",
  "",
  "export const stylePropRules = stylex.create({",
  ...props.map(rule),
  "})",
  ""
].join("\n")

await Bun.write(new URL("../src/styles/stylePropVars.stylex.ts", import.meta.url), varsFile)
await Bun.write(new URL("../src/styles/stylePropRules.ts", import.meta.url), rulesFile)
