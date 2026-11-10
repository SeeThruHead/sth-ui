import type { Html, HtmlBuilder } from "foldkit/html"
import { setStyle } from "../../styles/StylesApi.ts"
import { colorSlider, colorSliderOverlays, colorSliderUpdate } from "./colorSlider.ts"
import type { ColorSliderConfig, ColorSliderPart, ColorSliderProps } from "./colorSlider.ts"
import type { Message, Model } from "./model.ts"

export { init, Message, Model, OutMessage } from "./model.ts"
export { colorSliderSubscriptions as subscriptions } from "./colorSlider.ts"
export type { ColorSliderOptions as AlphaSliderOptions, ColorSliderSize } from "./colorSlider.ts"

export type AlphaSliderPart = ColorSliderPart

export type AlphaSliderProps<M> = ColorSliderProps<M> & { readonly color: string }

export type AlphaSliderConfig = ColorSliderConfig

export const update = (model: Model, message: Message, value: number) =>
  colorSliderUpdate(model, message, { value, maxValue: 1, round: false, decimals: 2 })

export const AlphaSlider =
  (config: { readonly AlphaSlider?: AlphaSliderConfig }) =>
  <M>(h: HtmlBuilder<M>, props: AlphaSliderProps<M>): Html =>
    colorSlider(config.AlphaSlider, {
      name: "alpha",
      maxValue: 1,
      thumbColor: "transparent",
      overlays: [
        colorSliderOverlays.checkers,
        setStyle(["backgroundImage", `linear-gradient(90deg, transparent, ${props.color})`]),
        colorSliderOverlays.inset
      ]
    })(h, props)
