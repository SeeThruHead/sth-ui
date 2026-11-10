import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { colorValue } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import type { BoxElement } from "../Box/Box.ts"
import { colorSwatchVars } from "./ColorSwatch.stylex.ts"

export type ColorSwatchPart = "root" | "alphaOverlay" | "shadowOverlay" | "colorOverlay" | "childrenOverlay"

export type ColorSwatchOptions = {
  readonly size?: StyleValue
  readonly radius?: StyleValue
  readonly withShadow?: boolean
}

export type ColorSwatchProps<M> = ColorSwatchOptions &
  StylesApiProps<ColorSwatchPart> & {
    readonly color: string
    readonly component?: BoxElement
    readonly onClick?: M
    readonly ariaLabel?: string
    readonly children?: ReadonlyArray<Child>
  }

export type ColorSwatchConfig = ComponentConfig<ColorSwatchOptions, ColorSwatchPart>

const alphaColor = `light-dark(${palette.gray3}, ${palette.dark4})`

const alphaBackground = `light-dark(${palette.white}, ${palette.dark7})`

const styles = stylex.create({
  root: {
    WebkitTapHighlightColor: "transparent",
    borderWidth: 0,
    padding: 0,
    appearance: "none",
    display: "block",
    lineHeight: 1,
    position: "relative",
    width: colorSwatchVars.size,
    height: colorSwatchVars.size,
    minWidth: colorSwatchVars.size,
    minHeight: colorSwatchVars.size,
    borderRadius: colorSwatchVars.radius,
    color: "inherit",
    textDecoration: "none",
    backgroundColor: "transparent"
  },
  button: { cursor: "pointer" },
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: colorSwatchVars.radius },
  shadow: {
    zIndex: 1,
    boxShadow: "rgba(0, 0, 0, 0.1) 0 0 0 1px inset, rgb(0, 0, 0, 0.15) 0 0 4px inset"
  },
  alpha: {
    backgroundSize: "8px 8px",
    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
    backgroundImage: `linear-gradient(45deg, ${alphaColor} 25%, transparent 25%), linear-gradient(-45deg, ${alphaColor} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${alphaColor} 75%), linear-gradient(-45deg, ${alphaBackground} 75%, ${alphaColor} 75%)`
  },
  color: { backgroundColor: colorSwatchVars.color },
  children: { zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }
})

export const ColorSwatch =
  (config: { readonly ColorSwatch?: ColorSwatchConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ColorSwatchProps<M>): Html => {
    const props = withDefaults(config.ColorSwatch, input)
    const getStyles = stylesApi<M, ColorSwatchPart>(h, props, config.ColorSwatch, "root")
    const component = props.component ?? "div"
    const button = component === "button"

    return h[component](
      [
        ...getStyles(
          "root",
          styles.root,
          button && styles.button,
          setDefinedVars(
            [colorSwatchVars.size, mapDefined(props.size, sizeValue)],
            [colorSwatchVars.radius, mapDefined(props.radius, radiusValue)]
          )
        ),
        ...(button ? [h.Type("button")] : []),
        ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
        ...(props.ariaLabel === undefined || button ? [] : [h.Role("img")]),
        ...(props.onClick === undefined ? [] : [h.OnClick(props.onClick)])
      ],
      [
        h.span(getStyles("alphaOverlay", styles.overlay, styles.alpha), []),
        ...(props.withShadow === false ? [] : [h.span(getStyles("shadowOverlay", styles.overlay, styles.shadow), [])]),
        h.span(
          getStyles(
            "colorOverlay",
            styles.overlay,
            styles.color,
            setVars([colorSwatchVars.color, colorValue(props.color)])
          ),
          []
        ),
        h.span(getStyles("childrenOverlay", styles.overlay, styles.children), props.children ?? [])
      ]
    )
  }
