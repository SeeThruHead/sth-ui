import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { colorValue } from "../../theme/accent.ts"
import { zIndex } from "../../theme/tokens.stylex.ts"
import type { BoxElement } from "../Box/Box.ts"

export type OverlayPart = "root"

export type OverlayOptions = {
  readonly backgroundOpacity?: number
  readonly color?: string
  readonly blur?: number | string
  readonly gradient?: string
  readonly zIndex?: string | number
  readonly radius?: string | number
  readonly center?: boolean
  readonly fixed?: boolean
  readonly component?: BoxElement
}

export type OverlayProps<M> = OverlayOptions &
  StylesApiProps<OverlayPart> & {
    readonly onClick?: M
    readonly children?: ReadonlyArray<Child>
  }

export type OverlayConfig = ComponentConfig<OverlayOptions, OverlayPart>

const styles = stylex.create({
  root: {
    inset: 0,
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: zIndex.modal
  },
  fixed: { position: "fixed" },
  center: { display: "flex", alignItems: "center", justifyContent: "center" }
})

const tint = (color: string | undefined, opacity: number | undefined): string | undefined => {
  if (color === undefined && opacity === undefined) return undefined

  return `color-mix(in srgb, ${colorValue(color ?? "#000")} ${(opacity ?? 0.6) * 100}%, transparent)`
}

const blurOf = (blur: number | string | undefined): string | undefined => {
  if (blur === undefined || blur === 0) return undefined

  return `blur(${sizeValue(blur)})`
}

export const Overlay =
  (config: { readonly Overlay?: OverlayConfig }) =>
  <M>(h: HtmlBuilder<M>, input: OverlayProps<M>): Html => {
    const props = withDefaults(config.Overlay, input)
    const getStyles = stylesApi<M, OverlayPart>(h, props, config.Overlay, "root")
    const filter = blurOf(props.blur)

    return h[props.component ?? "div"](
      [
        ...getStyles(
          "root",
          styles.root,
          props.fixed === true && styles.fixed,
          props.center === true && styles.center,
          setDefinedStyle(
            ["backgroundColor", props.gradient === undefined ? tint(props.color, props.backgroundOpacity) : undefined],
            ["backgroundImage", props.gradient],
            ["backdropFilter", filter],
            ["borderRadius", mapDefined(props.radius, radiusValue)],
            ["zIndex", mapDefined(props.zIndex, String)]
          )
        ),
        ...(props.fixed === true ? [h.DataAttribute("fixed", "")] : []),
        ...(props.center === true ? [h.DataAttribute("center", "")] : []),
        ...(props.onClick === undefined ? [] : [h.OnClick(props.onClick)])
      ],
      props.children ?? []
    )
  }
