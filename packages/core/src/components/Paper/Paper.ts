import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, shadowValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, radius } from "../../theme/tokens.stylex.ts"
import type { BoxElement } from "../Box/Box.ts"

export type PaperPart = "root"

export type PaperOptions = {
  readonly shadow?: string
  readonly radius?: StyleValue
  readonly withBorder?: boolean
  readonly component?: BoxElement
}

export type PaperProps = PaperOptions & StylesApiProps<PaperPart> & { readonly children: ReadonlyArray<Child> }

export type PaperConfig = ComponentConfig<PaperOptions, PaperPart>

const styles = stylex.create({
  root: {
    outline: 0,
    WebkitTapHighlightColor: "transparent",
    display: "block",
    touchAction: "manipulation",
    textDecoration: "none",
    borderRadius: radius.default,
    backgroundColor: colors.body
  },
  border: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  }
})

export const Paper =
  (config: { readonly Paper?: PaperConfig }) =>
  <M>(h: HtmlBuilder<M>, input: PaperProps): Html => {
    const props = withDefaults(config.Paper, input)
    const getStyles = stylesApi<M, PaperPart>(h, props, config.Paper, "root")

    return h[props.component ?? "div"](
      [
        ...getStyles(
          "root",
          styles.root,
          props.withBorder === true && styles.border,
          setDefinedStyle(
            ["borderRadius", mapDefined(props.radius, radiusValue)],
            ["boxShadow", mapDefined(props.shadow, shadowValue)]
          )
        ),
        ...(props.withBorder === true ? [h.DataAttribute("with-border", "")] : [])
      ],
      props.children
    )
  }
