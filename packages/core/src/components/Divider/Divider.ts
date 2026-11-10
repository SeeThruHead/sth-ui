import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, fontSize, space } from "../../theme/tokens.stylex.ts"
import { dividerVars } from "./Divider.stylex.ts"

export type DividerPart = "root" | "label"

export type DividerSize = "xs" | "sm" | "md" | "lg" | "xl"

export type DividerVariant = "solid" | "dashed" | "dotted"

export type DividerOptions = {
  readonly color?: string
  readonly size?: DividerSize | number | (string & {})
  readonly variant?: DividerVariant
  readonly labelPosition?: "left" | "center" | "right"
  readonly orientation?: "horizontal" | "vertical"
}

export type DividerProps = DividerOptions & StylesApiProps<DividerPart> & { readonly label?: Child }

export type DividerConfig = ComponentConfig<DividerOptions, DividerPart>

const sizes: ReadonlyMap<string, string> = new Map([
  ["xs", "1px"],
  ["sm", "2px"],
  ["md", "3px"],
  ["lg", "4px"],
  ["xl", "5px"]
])

const sizeOf = (size: number | string): string =>
  typeof size === "string" ? (sizes.get(size) ?? size) : sizeValue(size)

const styles = stylex.create({
  root: { [dividerVars.color]: `light-dark(${palette.gray3}, ${palette.dark4})` },
  horizontal: {
    borderTopWidth: dividerVars.size,
    borderTopStyle: dividerVars.borderStyle,
    borderTopColor: dividerVars.color
  },
  vertical: {
    borderInlineStartWidth: dividerVars.size,
    borderInlineStartStyle: dividerVars.borderStyle,
    borderInlineStartColor: dividerVars.color,
    height: "auto",
    alignSelf: "stretch"
  },
  label: {
    display: "flex",
    alignItems: "center",
    fontSize: fontSize.xs,
    color: colors.dimmed,
    whiteSpace: "nowrap",
    "::before": {
      content: "''",
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      height: "1px",
      borderTopWidth: dividerVars.size,
      borderTopStyle: dividerVars.borderStyle,
      borderTopColor: dividerVars.color,
      marginInlineEnd: space.xs
    },
    "::after": {
      content: "''",
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      height: "1px",
      borderTopWidth: dividerVars.size,
      borderTopStyle: dividerVars.borderStyle,
      borderTopColor: dividerVars.color,
      marginInlineStart: space.xs
    }
  },
  left: { "::before": { display: "none" } },
  right: { "::after": { display: "none" } }
})

export const Divider =
  (config: { readonly Divider?: DividerConfig }) =>
  <M>(h: HtmlBuilder<M>, input: DividerProps): Html => {
    const props = withDefaults(config.Divider, input)
    const getStyles = stylesApi<M, DividerPart>(h, props, config.Divider, "root")
    const orientation = props.orientation ?? "horizontal"
    const labelled = props.label !== undefined
    const position = props.labelPosition ?? "center"

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          !labelled && styles[orientation],
          setDefinedVars(
            [dividerVars.color, mapDefined(props.color, themeColor)],
            [dividerVars.borderStyle, props.variant],
            [dividerVars.size, mapDefined(props.size, sizeOf)]
          )
        ),
        h.Role("separator"),
        h.AriaOrientation(orientation),
        h.DataAttribute("orientation", orientation),
        ...(labelled ? [h.DataAttribute("with-label", "")] : [])
      ],
      labelled
        ? [
            h.span(
              [
                ...getStyles(
                  "label",
                  styles.label,
                  position === "left" && styles.left,
                  position === "right" && styles.right
                ),
                h.DataAttribute("position", position)
              ],
              [props.label]
            )
          ]
        : []
    )
  }
