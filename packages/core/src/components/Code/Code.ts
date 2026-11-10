import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { font, fontSize, lineHeight, radius, space } from "../../theme/tokens.stylex.ts"
import { codeVars } from "./Code.stylex.ts"

export type CodePart = "root"

export type CodeOptions = { readonly color?: string }

export type CodeProps = CodeOptions &
  StylesApiProps<CodePart> & {
    readonly block?: boolean
    readonly children: ReadonlyArray<Child>
  }

export type CodeConfig = ComponentConfig<CodeOptions, CodePart>

const styles = stylex.create({
  root: {
    [codeVars.background]: `light-dark(${palette.gray0}, ${palette.dark6})`,
    fontFamily: font.mono,
    lineHeight: lineHeight.md,
    paddingBlock: "2px",
    paddingInline: `calc(${space.xs} / 2)`,
    borderRadius: radius.sm,
    fontSize: fontSize.xs,
    margin: 0,
    overflow: "auto",
    backgroundColor: codeVars.background
  },
  block: { paddingBlock: space.xs, paddingInline: space.xs }
})

export const Code =
  (config: { readonly Code?: CodeConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CodeProps): Html => {
    const props = withDefaults(config.Code, input)
    const getStyles = stylesApi<M, CodePart>(h, props, config.Code, "root")
    const block = props.block === true

    return h[block ? "pre" : "code"](
      [
        ...getStyles(
          "root",
          styles.root,
          block && styles.block,
          setDefinedVars([codeVars.background, mapDefined(props.color, themeColor)])
        ),
        ...(block ? [h.DataAttribute("block", "")] : []),
        h.Dir("ltr")
      ],
      props.children
    )
  }
