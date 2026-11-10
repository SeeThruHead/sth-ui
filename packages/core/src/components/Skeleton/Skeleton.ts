import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, radius } from "../../theme/tokens.stylex.ts"

export type SkeletonPart = "root"

export type SkeletonOptions = {
  readonly visible?: boolean
  readonly height?: StyleValue
  readonly width?: StyleValue
  readonly circle?: boolean
  readonly radius?: StyleValue
  readonly animate?: boolean
}

export type SkeletonProps = SkeletonOptions &
  StylesApiProps<SkeletonPart> & { readonly children?: ReadonlyArray<Child> }

export type SkeletonConfig = ComponentConfig<SkeletonOptions, SkeletonPart>

const fade = stylex.keyframes({
  "0%": { opacity: 0.4 },
  "50%": { opacity: 1 },
  "100%": { opacity: 0.4 }
})

const styles = stylex.create({
  root: {
    height: "auto",
    width: "100%",
    borderRadius: radius.default,
    position: "relative",
    transform: "translateZ(0)"
  },
  visible: { overflow: "hidden" },
  cover: { position: "absolute", inset: 0, zIndex: 10, backgroundColor: colors.body },
  shade: {
    position: "absolute",
    inset: 0,
    zIndex: 11,
    backgroundColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  animated: {
    animationName: fade,
    animationDuration: "1500ms",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite"
  }
})

const sizeStyle = (props: SkeletonOptions) => {
  const height = mapDefined(props.height, sizeValue)

  return setDefinedStyle(
    ["height", height],
    ["width", props.circle === true ? height : mapDefined(props.width, sizeValue)],
    ["borderRadius", props.circle === true ? "1000px" : mapDefined(props.radius, radiusValue)]
  )
}

export const Skeleton =
  (config: { readonly Skeleton?: SkeletonConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SkeletonProps): Html => {
    const props = withDefaults(config.Skeleton, input)
    const getStyles = stylesApi<M, SkeletonPart>(h, props, config.Skeleton, "root")
    const visible = props.visible ?? true
    const animate = props.animate ?? true

    return h.div(
      [
        ...getStyles("root", styles.root, visible && styles.visible, sizeStyle(props)),
        ...(visible ? [h.DataAttribute("visible", ""), h.AriaBusy(true)] : []),
        ...(animate ? [h.DataAttribute("animate", "")] : [])
      ],
      [
        ...(props.children ?? []),
        ...(visible
          ? [
              h.span([...sx(h, styles.cover), h.AriaHidden(true)], []),
              h.span([...sx(h, styles.shade, animate && styles.animated), h.AriaHidden(true)], [])
            ]
          : [])
      ]
    )
  }
