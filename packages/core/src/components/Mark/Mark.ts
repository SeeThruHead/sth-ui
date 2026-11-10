import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { colorValue, isAccentName } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"

export type MarkPart = "root"

export type MarkOptions = { readonly color?: string }

export type MarkProps = MarkOptions & StylesApiProps<MarkPart> & { readonly children: ReadonlyArray<Child> }

export type MarkConfig = ComponentConfig<MarkOptions, MarkPart>

const styles = stylex.create({ root: { color: palette.black } })

export const markBackground = (color: string): string =>
  isAccentName(color) ? `light-dark(${colorValue(`${color}.2`)}, ${colorValue(`${color}.5`)})` : colorValue(color)

export const Mark =
  (config: { readonly Mark?: MarkConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MarkProps): Html => {
    const props = withDefaults(config.Mark, input)
    const getStyles = stylesApi<M, MarkPart>(h, props, config.Mark, "root")

    return h.mark(
      getStyles("root", styles.root, setStyle(["backgroundColor", markBackground(props.color ?? "yellow")])),
      props.children
    )
  }
