import * as stylex from "@stylexjs/stylex"
import { palette } from "./palette.stylex.ts"
import { accent } from "./tokens.stylex.ts"

const dark = stylex.createTheme(accent, {
  filled: `light-dark(${palette.dark6}, ${palette.dark8})`,
  filledHover: `light-dark(${palette.dark7}, ${palette.dark9})`,
  light: `light-dark(${palette.dark1}, rgba(10, 10, 10, 1))`,
  lightHover: `light-dark(${palette.dark2}, rgba(14, 14, 14, 1))`,
  lightColor: `light-dark(${palette.dark9}, ${palette.dark0})`,
  outline: `light-dark(${palette.dark6}, ${palette.dark4})`,
  outlineHover: `light-dark(rgba(46, 46, 46, 0.05), rgba(66, 66, 66, 0.05))`,
  text: `light-dark(${palette.dark6}, ${palette.dark4})`,
  contrast: `#fff`
})

const gray = stylex.createTheme(accent, {
  filled: `light-dark(${palette.gray6}, ${palette.gray8})`,
  filledHover: `light-dark(${palette.gray7}, ${palette.gray9})`,
  light: `light-dark(${palette.gray1}, rgba(17, 19, 21, 1))`,
  lightHover: `light-dark(${palette.gray2}, rgba(23, 26, 29, 1))`,
  lightColor: `light-dark(${palette.gray9}, ${palette.gray0})`,
  outline: `light-dark(${palette.gray6}, ${palette.gray4})`,
  outlineHover: `light-dark(rgba(134, 142, 150, 0.05), rgba(206, 212, 218, 0.05))`,
  text: `light-dark(${palette.gray6}, ${palette.gray4})`,
  contrast: `#fff`
})

const red = stylex.createTheme(accent, {
  filled: `light-dark(${palette.red6}, ${palette.red8})`,
  filledHover: `light-dark(${palette.red7}, ${palette.red9})`,
  light: `light-dark(${palette.red1}, rgba(101, 21, 21, 1))`,
  lightHover: `light-dark(${palette.red2}, rgba(141, 29, 29, 1))`,
  lightColor: `light-dark(${palette.red9}, ${palette.red0})`,
  outline: `light-dark(${palette.red6}, ${palette.red4})`,
  outlineHover: `light-dark(rgba(250, 82, 82, 0.05), rgba(255, 135, 135, 0.05))`,
  text: `light-dark(${palette.red6}, ${palette.red4})`,
  contrast: `#fff`
})

const pink = stylex.createTheme(accent, {
  filled: `light-dark(${palette.pink6}, ${palette.pink8})`,
  filledHover: `light-dark(${palette.pink7}, ${palette.pink9})`,
  light: `light-dark(${palette.pink1}, rgba(83, 15, 39, 1))`,
  lightHover: `light-dark(${palette.pink2}, rgba(116, 21, 54, 1))`,
  lightColor: `light-dark(${palette.pink9}, ${palette.pink0})`,
  outline: `light-dark(${palette.pink6}, ${palette.pink4})`,
  outlineHover: `light-dark(rgba(230, 73, 128, 0.05), rgba(247, 131, 172, 0.05))`,
  text: `light-dark(${palette.pink6}, ${palette.pink4})`,
  contrast: `#fff`
})

const grape = stylex.createTheme(accent, {
  filled: `light-dark(${palette.grape6}, ${palette.grape8})`,
  filledHover: `light-dark(${palette.grape7}, ${palette.grape9})`,
  light: `light-dark(${palette.grape1}, rgba(67, 23, 78, 1))`,
  lightHover: `light-dark(${palette.grape2}, rgba(94, 32, 109, 1))`,
  lightColor: `light-dark(${palette.grape9}, ${palette.grape0})`,
  outline: `light-dark(${palette.grape6}, ${palette.grape4})`,
  outlineHover: `light-dark(rgba(190, 75, 219, 0.05), rgba(218, 119, 242, 0.05))`,
  text: `light-dark(${palette.grape6}, ${palette.grape4})`,
  contrast: `#fff`
})

const violet = stylex.createTheme(accent, {
  filled: `light-dark(${palette.violet6}, ${palette.violet8})`,
  filledHover: `light-dark(${palette.violet7}, ${palette.violet9})`,
  light: `light-dark(${palette.violet1}, rgba(48, 31, 98, 1))`,
  lightHover: `light-dark(${palette.violet2}, rgba(67, 43, 137, 1))`,
  lightColor: `light-dark(${palette.violet9}, ${palette.violet0})`,
  outline: `light-dark(${palette.violet6}, ${palette.violet4})`,
  outlineHover: `light-dark(rgba(121, 80, 242, 0.05), rgba(151, 117, 250, 0.05))`,
  text: `light-dark(${palette.violet6}, ${palette.violet4})`,
  contrast: `#fff`
})

const indigo = stylex.createTheme(accent, {
  filled: `light-dark(${palette.indigo6}, ${palette.indigo8})`,
  filledHover: `light-dark(${palette.indigo7}, ${palette.indigo9})`,
  light: `light-dark(${palette.indigo1}, rgba(27, 40, 100, 1))`,
  lightHover: `light-dark(${palette.indigo2}, rgba(38, 55, 139, 1))`,
  lightColor: `light-dark(${palette.indigo9}, ${palette.indigo0})`,
  outline: `light-dark(${palette.indigo6}, ${palette.indigo4})`,
  outlineHover: `light-dark(rgba(76, 110, 245, 0.05), rgba(116, 143, 252, 0.05))`,
  text: `light-dark(${palette.indigo6}, ${palette.indigo4})`,
  contrast: `#fff`
})

const blue = stylex.createTheme(accent, {
  filled: `light-dark(${palette.blue6}, ${palette.blue8})`,
  filledHover: `light-dark(${palette.blue7}, ${palette.blue9})`,
  light: `light-dark(${palette.blue1}, rgba(12, 50, 86, 1))`,
  lightHover: `light-dark(${palette.blue2}, rgba(17, 70, 120, 1))`,
  lightColor: `light-dark(${palette.blue9}, ${palette.blue0})`,
  outline: `light-dark(${palette.blue6}, ${palette.blue4})`,
  outlineHover: `light-dark(rgba(34, 139, 230, 0.05), rgba(77, 171, 247, 0.05))`,
  text: `light-dark(${palette.blue6}, ${palette.blue4})`,
  contrast: `#fff`
})

const cyan = stylex.createTheme(accent, {
  filled: `light-dark(${palette.cyan6}, ${palette.cyan8})`,
  filledHover: `light-dark(${palette.cyan7}, ${palette.cyan9})`,
  light: `light-dark(${palette.cyan1}, rgba(6, 57, 67, 1))`,
  lightHover: `light-dark(${palette.cyan2}, rgba(8, 80, 93, 1))`,
  lightColor: `light-dark(${palette.cyan9}, ${palette.cyan0})`,
  outline: `light-dark(${palette.cyan6}, ${palette.cyan4})`,
  outlineHover: `light-dark(rgba(21, 170, 191, 0.05), rgba(59, 201, 219, 0.05))`,
  text: `light-dark(${palette.cyan6}, ${palette.cyan4})`,
  contrast: `#000`
})

const teal = stylex.createTheme(accent, {
  filled: `light-dark(${palette.teal6}, ${palette.teal8})`,
  filledHover: `light-dark(${palette.teal7}, ${palette.teal9})`,
  light: `light-dark(${palette.teal1}, rgba(4, 64, 46, 1))`,
  lightHover: `light-dark(${palette.teal2}, rgba(6, 89, 64, 1))`,
  lightColor: `light-dark(${palette.teal9}, ${palette.teal0})`,
  outline: `light-dark(${palette.teal6}, ${palette.teal4})`,
  outlineHover: `light-dark(rgba(18, 184, 134, 0.05), rgba(56, 217, 169, 0.05))`,
  text: `light-dark(${palette.teal6}, ${palette.teal4})`,
  contrast: `#000`
})

const green = stylex.createTheme(accent, {
  filled: `light-dark(${palette.green6}, ${palette.green8})`,
  filledHover: `light-dark(${palette.green7}, ${palette.green9})`,
  light: `light-dark(${palette.green1}, rgba(22, 69, 31, 1))`,
  lightHover: `light-dark(${palette.green2}, rgba(30, 97, 43, 1))`,
  lightColor: `light-dark(${palette.green9}, ${palette.green0})`,
  outline: `light-dark(${palette.green6}, ${palette.green4})`,
  outlineHover: `light-dark(rgba(64, 192, 87, 0.05), rgba(105, 219, 124, 0.05))`,
  text: `light-dark(${palette.green6}, ${palette.green4})`,
  contrast: `#000`
})

const lime = stylex.createTheme(accent, {
  filled: `light-dark(${palette.lime6}, ${palette.lime8})`,
  filledHover: `light-dark(${palette.lime7}, ${palette.lime9})`,
  light: `light-dark(${palette.lime1}, rgba(46, 74, 7, 1))`,
  lightHover: `light-dark(${palette.lime2}, rgba(64, 104, 9, 1))`,
  lightColor: `light-dark(${palette.lime9}, ${palette.lime0})`,
  outline: `light-dark(${palette.lime6}, ${palette.lime4})`,
  outlineHover: `light-dark(rgba(130, 201, 30, 0.05), rgba(169, 227, 75, 0.05))`,
  text: `light-dark(${palette.lime6}, ${palette.lime4})`,
  contrast: `#000`
})

const yellow = stylex.createTheme(accent, {
  filled: `light-dark(${palette.yellow6}, ${palette.yellow8})`,
  filledHover: `light-dark(${palette.yellow7}, ${palette.yellow9})`,
  light: `light-dark(${palette.yellow1}, rgba(115, 60, 0, 1))`,
  lightHover: `light-dark(${palette.yellow2}, rgba(161, 83, 0, 1))`,
  lightColor: `light-dark(${palette.yellow9}, ${palette.yellow0})`,
  outline: `light-dark(${palette.yellow6}, ${palette.yellow4})`,
  outlineHover: `light-dark(rgba(250, 176, 5, 0.05), rgba(255, 212, 59, 0.05))`,
  text: `light-dark(${palette.yellow6}, ${palette.yellow4})`,
  contrast: `#000`
})

const orange = stylex.createTheme(accent, {
  filled: `light-dark(${palette.orange6}, ${palette.orange8})`,
  filledHover: `light-dark(${palette.orange7}, ${palette.orange9})`,
  light: `light-dark(${palette.orange1}, rgba(109, 36, 8, 1))`,
  lightHover: `light-dark(${palette.orange2}, rgba(152, 50, 11, 1))`,
  lightColor: `light-dark(${palette.orange9}, ${palette.orange0})`,
  outline: `light-dark(${palette.orange6}, ${palette.orange4})`,
  outlineHover: `light-dark(rgba(253, 126, 20, 0.05), rgba(255, 169, 77, 0.05))`,
  text: `light-dark(${palette.orange6}, ${palette.orange4})`,
  contrast: `#000`
})

export const accents = { dark, gray, red, pink, grape, violet, indigo, blue, cyan, teal, green, lime, yellow, orange }

export const filledColors: { readonly [Name in keyof typeof accents]: string } = {
  dark: `light-dark(${palette.dark6}, ${palette.dark8})`,
  gray: `light-dark(${palette.gray6}, ${palette.gray8})`,
  red: `light-dark(${palette.red6}, ${palette.red8})`,
  pink: `light-dark(${palette.pink6}, ${palette.pink8})`,
  grape: `light-dark(${palette.grape6}, ${palette.grape8})`,
  violet: `light-dark(${palette.violet6}, ${palette.violet8})`,
  indigo: `light-dark(${palette.indigo6}, ${palette.indigo8})`,
  blue: `light-dark(${palette.blue6}, ${palette.blue8})`,
  cyan: `light-dark(${palette.cyan6}, ${palette.cyan8})`,
  teal: `light-dark(${palette.teal6}, ${palette.teal8})`,
  green: `light-dark(${palette.green6}, ${palette.green8})`,
  lime: `light-dark(${palette.lime6}, ${palette.lime8})`,
  yellow: `light-dark(${palette.yellow6}, ${palette.yellow8})`,
  orange: `light-dark(${palette.orange6}, ${palette.orange8})`
}

export const textColors: { readonly [Name in keyof typeof accents]: string } = {
  dark: `light-dark(${palette.dark6}, ${palette.dark4})`,
  gray: `light-dark(${palette.gray6}, ${palette.gray4})`,
  red: `light-dark(${palette.red6}, ${palette.red4})`,
  pink: `light-dark(${palette.pink6}, ${palette.pink4})`,
  grape: `light-dark(${palette.grape6}, ${palette.grape4})`,
  violet: `light-dark(${palette.violet6}, ${palette.violet4})`,
  indigo: `light-dark(${palette.indigo6}, ${palette.indigo4})`,
  blue: `light-dark(${palette.blue6}, ${palette.blue4})`,
  cyan: `light-dark(${palette.cyan6}, ${palette.cyan4})`,
  teal: `light-dark(${palette.teal6}, ${palette.teal4})`,
  green: `light-dark(${palette.green6}, ${palette.green4})`,
  lime: `light-dark(${palette.lime6}, ${palette.lime4})`,
  yellow: `light-dark(${palette.yellow6}, ${palette.yellow4})`,
  orange: `light-dark(${palette.orange6}, ${palette.orange4})`
}

export type AccentName = keyof typeof accents
