import { accentSlots } from "./accentSlots.ts"
import { mantinePalette } from "./mantinePalette.ts"

const colours = Object.entries(mantinePalette)

const paletteFile = [
  'import * as stylex from "@stylexjs/stylex"',
  "",
  "export const palette = stylex.defineVars({",
  '  white: "#fff",',
  '  black: "#000",',
  ...colours.flatMap(([name, shades]) => shades.map((value, index) => `  ${name}${index}: "${value}",`)),
  "})",
  ""
].join("\n")

const accentTheme = ([name, shades]: readonly [string, ReadonlyArray<string>]): string =>
  [
    `const ${name} = stylex.createTheme(accent, {`,
    ...accentSlots(name, shades).map(([slot, value]) => `  ${slot}: \`${value}\`,`),
    "})",
    ""
  ].join("\n")

const accentsFile = [
  'import * as stylex from "@stylexjs/stylex"',
  'import { palette } from "./palette.stylex.ts"',
  'import { accent } from "./tokens.stylex.ts"',
  "",
  ...colours.map(accentTheme),
  `export const accents = { ${colours.map(([name]) => name).join(", ")} }`,
  "",
  "export const filledColors: { readonly [Name in keyof typeof accents]: string } = {",
  ...colours.map(([name]) => `  ${name}: \`light-dark(\${palette.${name}6}, \${palette.${name}8})\`,`),
  "}",
  "",
  "export const textColors: { readonly [Name in keyof typeof accents]: string } = {",
  ...colours.map(([name]) => `  ${name}: \`light-dark(\${palette.${name}6}, \${palette.${name}4})\`,`),
  "}",
  "",
  "export type AccentName = keyof typeof accents",
  ""
].join("\n")

await Bun.write(new URL("../src/theme/palette.stylex.ts", import.meta.url), paletteFile)
await Bun.write(new URL("../src/theme/accents.ts", import.meta.url), accentsFile)
