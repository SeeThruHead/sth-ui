import type { Html, HtmlBuilder } from "foldkit/html"
import { colorSlider, colorSliderOverlays, colorSliderUpdate } from "../AlphaSlider/colorSlider.ts"
import type { ColorSliderConfig, ColorSliderPart, ColorSliderProps } from "../AlphaSlider/colorSlider.ts"
import type { Message, Model } from "../AlphaSlider/model.ts"

export { init, Message, Model, OutMessage } from "../AlphaSlider/model.ts"
export { colorSliderSubscriptions as subscriptions } from "../AlphaSlider/colorSlider.ts"
export type { ColorSliderOptions as HueSliderOptions } from "../AlphaSlider/colorSlider.ts"

export type HueSliderPart = ColorSliderPart

export type HueSliderProps<M> = ColorSliderProps<M>

export type HueSliderConfig = ColorSliderConfig

export const update = (model: Model, message: Message, value: number) =>
  colorSliderUpdate(model, message, { value, maxValue: 360, round: true })

export const HueSlider =
  (config: { readonly HueSlider?: HueSliderConfig }) =>
  <M>(h: HtmlBuilder<M>, props: HueSliderProps<M>): Html =>
    colorSlider(config.HueSlider, {
      name: "hue",
      maxValue: 360,
      thumbColor: `hsl(${props.value}, 100%, 50%)`,
      overlays: [colorSliderOverlays.hue, colorSliderOverlays.inset]
    })(h, props)
