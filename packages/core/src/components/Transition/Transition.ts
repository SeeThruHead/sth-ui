import { Predicate } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setStyle, sx } from "../../styles/StylesApi.ts"
import type { Sx } from "../../styles/StylesApi.ts"
import { transitions } from "./presets.ts"
import type { TransitionName, TransitionStyles } from "./presets.ts"

export type { TransitionName, TransitionStyles } from "./presets.ts"

export { transitions } from "./presets.ts"

import { leaving } from "./model.ts"
import type { Model } from "./model.ts"

export { init, liftCommands, Message, Model, mounted, OutMessage, update } from "./model.ts"
export type { Result } from "./model.ts"

export type TransitionOptions = {
  readonly transition?: TransitionName | TransitionStyles
  readonly duration?: number
  readonly exitDuration?: number
  readonly timingFunction?: string
  readonly enterDelay?: number
  readonly exitDelay?: number
  readonly keepMounted?: boolean
}

export type TransitionProps = TransitionOptions & {
  readonly model: Model
  readonly children: ReadonlyArray<Child>
}

const closed = (model: Model): boolean =>
  model.transitionState === "EnterStart" || model.transitionState === "LeaveAnimating"

const presetOf = (transition: TransitionOptions["transition"]): TransitionStyles =>
  Predicate.isObject(transition) ? transition : transitions[transition ?? "fade"]

export const isVisible = (model: Model): boolean => model.isShowing || leaving(model)

export const transitionStyle = (model: Model, options: TransitionOptions): Sx => {
  if (!isVisible(model)) return setStyle(["display", "none"])
  const preset = presetOf(options.transition)
  const exiting = leaving(model)
  const duration = exiting ? (options.exitDuration ?? options.duration ?? 250) : (options.duration ?? 250)
  const delay = exiting ? options.exitDelay : options.enterDelay

  return setStyle(
    ["transitionProperty", preset.transitionProperty],
    ["transitionDuration", `${duration}ms`],
    ["transitionTimingFunction", options.timingFunction ?? "ease"],
    ["transitionDelay", `${delay ?? 0}ms`],
    ["backfaceVisibility", "hidden"],
    ...Object.entries(preset.common ?? {}),
    ...Object.entries(closed(model) ? preset.out : preset.in)
  )
}

export const transitionAttributes = <M>(h: HtmlBuilder<M>, model: Model): ReadonlyArray<Attribute<M>> => [
  h.Id(model.id),
  ...(closed(model) ? [h.DataAttribute("closed", "")] : []),
  ...(model.transitionState === "Idle" ? [] : [h.DataAttribute("transition", "")])
]

export const Transition = <M>(h: HtmlBuilder<M>, props: TransitionProps): Html => {
  if (!isVisible(props.model) && props.keepMounted !== true) return h.empty

  return h.keyed("div")(
    props.model.id,
    [...transitionAttributes(h, props.model), ...sx(h, transitionStyle(props.model, props))],
    props.children
  )
}
