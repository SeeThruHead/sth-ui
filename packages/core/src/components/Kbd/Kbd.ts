import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { font, fontWeight, lineHeight, radius } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { kbdVars } from "./Kbd.stylex.ts"

export type KbdPart = "root"

export type KbdSize = keyof typeof sizes

export type KbdOptions = { readonly size?: KbdSize | number }

export type KbdProps = KbdOptions & StylesApiProps<KbdPart> & { readonly children: ReadonlyArray<Child> }

export type KbdConfig = ComponentConfig<KbdOptions, KbdPart>

const sizes = stylex.create({
  xs: { [kbdVars.fz]: "10px" },
  sm: { [kbdVars.fz]: "12px" },
  md: { [kbdVars.fz]: "14px" },
  lg: { [kbdVars.fz]: "16px" },
  xl: { [kbdVars.fz]: "20px" }
})

const styles = stylex.create({
  root: {
    fontFamily: font.mono,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.bold,
    fontSize: kbdVars.fz,
    borderRadius: radius.sm,
    borderStyle: "solid",
    borderTopWidth: "1px",
    borderInlineWidth: "1px",
    borderBottomWidth: "3px",
    unicodeBidi: "embed",
    textAlign: "center",
    paddingBlock: "0.12em",
    paddingInline: "0.45em",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    color: `light-dark(${palette.gray7}, ${palette.dark0})`,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark6})`
  }
})

export const Kbd =
  (config: { readonly Kbd?: KbdConfig }) =>
  <M>(h: HtmlBuilder<M>, input: KbdProps): Html => {
    const props = withDefaults(config.Kbd, input)
    const getStyles = stylesApi<M, KbdPart>(h, props, config.Kbd, "root")
    const size = props.size ?? "sm"

    return h.kbd(
      getStyles("root", styles.root, Predicate.isNumber(size) ? setVars([kbdVars.fz, rem(size)]) : sizes[size]),
      props.children
    )
  }
