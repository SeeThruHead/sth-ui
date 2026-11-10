import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { forwardPart, setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { zIndex } from "../../theme/tokens.stylex.ts"
import { Loader } from "../Loader/Loader.ts"
import type { LoaderConfig, LoaderProps } from "../Loader/Loader.ts"
import { Overlay } from "../Overlay/Overlay.ts"
import type { OverlayConfig, OverlayProps } from "../Overlay/Overlay.ts"
import * as Transition from "../Transition/Transition.ts"
import type { TransitionOptions } from "../Transition/Transition.ts"

export type LoadingOverlayPart = "root" | "loader" | "overlay"

export type LoadingOverlayOptions = {
  readonly zIndex?: string | number
  readonly transitionProps?: TransitionOptions
}

export type LoadingOverlayProps<M> = LoadingOverlayOptions &
  StylesApiProps<LoadingOverlayPart> & {
    readonly visible?: boolean
    readonly model?: Transition.Model
    readonly loaderProps?: LoaderProps
    readonly overlayProps?: Omit<OverlayProps<M>, "children">
  }

export type LoadingOverlayConfig = ComponentConfig<LoadingOverlayOptions, LoadingOverlayPart>

const styles = stylex.create({
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: zIndex.overlay
  },
  loader: { position: "relative", zIndex: `calc(${zIndex.overlay} + 1)`, display: "flex" }
})

const shown = (props: { readonly visible?: boolean; readonly model?: Transition.Model }): boolean =>
  props.model === undefined ? props.visible === true : Transition.isVisible(props.model)

export const LoadingOverlay = (config: {
  readonly LoadingOverlay?: LoadingOverlayConfig
  readonly Loader?: LoaderConfig
  readonly Overlay?: OverlayConfig
}) => {
  const loader = Loader(config)
  const overlay = Overlay(config)

  return <M>(h: HtmlBuilder<M>, input: LoadingOverlayProps<M>): Html => {
    const props = withDefaults(config.LoadingOverlay, input)
    const getStyles = stylesApi<M, LoadingOverlayPart>(h, props, config.LoadingOverlay, "root")
    if (!shown(props)) return h.empty
    const layer = props.zIndex === undefined ? zIndex.overlay : String(props.zIndex)
    const motion =
      props.model === undefined
        ? []
        : [Transition.transitionStyle(props.model, { transition: "fade", duration: 0, ...props.transitionProps })]
    const transitionAttributes = props.model === undefined ? [] : Transition.transitionAttributes(h, props.model)

    return h.div(
      [
        ...getStyles("root", styles.root, ...motion, props.zIndex === undefined ? null : setLayer(layer)),
        ...transitionAttributes
      ],
      [
        h.div(getStyles("loader", styles.loader, props.zIndex === undefined ? null : setLoaderLayer(layer)), [
          loader(h, { ...props.loaderProps })
        ]),
        overlay(h, {
          color: `light-dark(${palette.white}, ${palette.dark5})`,
          backgroundOpacity: 0.75,
          zIndex: layer,
          ...props.overlayProps,
          ...forwardPart(props, config.LoadingOverlay, "overlay", props.overlayProps ?? {})
        })
      ]
    )
  }
}

const setLayer = (layer: string) => setStyle(["zIndex", layer])

const setLoaderLayer = (layer: string) => setStyle(["zIndex", `calc(${layer} + 1)`])
