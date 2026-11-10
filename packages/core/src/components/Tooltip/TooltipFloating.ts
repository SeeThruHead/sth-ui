import * as stylex from "@stylexjs/stylex"
import { Effect, Function, MutableRef, Option, Schema, Stream } from "effect"
import { childAttributes } from "foldkit/html"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { FloatingMessage } from "./model.ts"
import type { FloatingModel } from "./model.ts"
import { tooltipVars } from "./Tooltip.stylex.ts"

export { FloatingMessage, FloatingModel, initFloating, updateFloating } from "./model.ts"

export type TooltipFloatingPosition = "top" | "right" | "bottom" | "left"

export type TooltipFloatingOptions = {
  readonly position?: TooltipFloatingPosition
  readonly offset?: number
  readonly color?: string
  readonly radius?: StyleValue
  readonly multiline?: boolean
  readonly zIndex?: number | string
}

export type TooltipFloatingProps<M> = TooltipFloatingOptions &
  StylesApiProps<"tooltip"> & {
    readonly model: FloatingModel
    readonly toParentMessage: (message: FloatingMessage) => M
    readonly label: Child
    readonly target: (bind: ReadonlyArray<ChildAttribute>) => Html
    readonly disabled?: boolean
  }

export type TooltipFloatingConfig = ComponentConfig<TooltipFloatingOptions, "tooltip">

const styles = stylex.create({
  tooltip: {
    position: "fixed",
    zIndex: tooltipVars.zIndex,
    paddingBlock: `calc(${space.xs} / 2)`,
    paddingInline: space.xs,
    pointerEvents: "none",
    fontSize: fontSize.sm,
    whiteSpace: "nowrap",
    borderRadius: radius.default,
    backgroundColor: `light-dark(${palette.gray9}, ${palette.gray2})`,
    color: `light-dark(${palette.white}, ${palette.black})`
  },
  colored: { backgroundColor: accent.filled, color: palette.white },
  multiline: { whiteSpace: "normal" },
  top: { transform: "translate(-50%, -100%)" },
  right: { transform: "translateY(-50%)" },
  bottom: { transform: "translateX(-50%)" },
  left: { transform: "translate(-100%, -50%)" },
  frame: { display: "contents" }
})

type Point = { readonly x: number; readonly y: number }

const shifts: Readonly<Record<TooltipFloatingPosition, (offset: number) => Point>> = {
  top: (offset) => ({ x: 0, y: -offset }),
  right: (offset) => ({ x: offset, y: 0 }),
  bottom: (offset) => ({ x: 0, y: offset }),
  left: (offset) => ({ x: -offset, y: 0 })
}

const shiftOf = (panel: HTMLElement): Point => ({
  x: Number(panel.dataset["shiftX"]),
  y: Number(panel.dataset["shiftY"])
})

const placed = (panelId: string, point: Point): boolean =>
  Option.match(Option.fromNullishOr(document.getElementById(panelId)), {
    onNone: () => false,
    onSome: (panel) => {
      const shift = shiftOf(panel)
      panel.style.setProperty("left", `${point.x + shift.x}px`)
      panel.style.setProperty("top", `${point.y + shift.y}px`)
      panel.style.setProperty("visibility", "visible")

      return true
    }
  })

const isHtml = (element: Element): element is HTMLElement => element instanceof HTMLElement

const follow = (target: HTMLElement, panelId: string) => {
  const point = MutableRef.make<Point>({ x: 0, y: 0 })
  const frame = MutableRef.make(0)
  const place = () => placed(panelId, MutableRef.get(point))
  const untilPlaced = () => {
    if (place()) return
    MutableRef.set(frame, requestAnimationFrame(untilPlaced))
  }
  const onMove = (event: PointerEvent) => {
    MutableRef.set(point, { x: event.clientX, y: event.clientY })
    place()
  }
  const onEnter = (event: PointerEvent) => {
    onMove(event)
    MutableRef.set(frame, requestAnimationFrame(untilPlaced))
  }
  const onLeave = () => cancelAnimationFrame(MutableRef.get(frame))
  target.addEventListener("pointermove", onMove)
  target.addEventListener("pointerenter", onEnter)
  target.addEventListener("pointerleave", onLeave)

  return () => {
    onLeave()
    target.removeEventListener("pointermove", onMove)
    target.removeEventListener("pointerenter", onEnter)
    target.removeEventListener("pointerleave", onLeave)
  }
}

const FollowPointer = Mount.defineStream("TooltipFollowPointer", {
  args: { panelId: Schema.String },
  messages: [Schema.Never],
  execute: ({ element, panelId }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => follow(Option.getOrThrow(Option.liftPredicate(element, isHtml)), panelId)),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const TooltipFloating =
  (config: { readonly TooltipFloating?: TooltipFloatingConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TooltipFloatingProps<M>): Html => {
    const props = withDefaults(config.TooltipFloating, input)
    const getStyles = stylesApi<M, "tooltip">(h, props, config.TooltipFloating, "tooltip")
    const position = props.position ?? "right"
    const panelId = `${props.model.id}-floating`
    const shift = shifts[position](props.offset ?? 10)
    const disabled = props.disabled === true
    const follower = Mount.mapMessage(FollowPointer({ panelId }), Function.absurd<M>)
    const bind = disabled
      ? []
      : childAttributes([
          h.OnMouseEnter(props.toParentMessage(FloatingMessage.Entered())),
          h.OnMouseLeave(props.toParentMessage(FloatingMessage.Left())),
          h.OnMount(follower)
        ])
    const panel = h.div(
      [
        h.Id(panelId),
        h.Role("tooltip"),
        h.DataAttribute("position", position),
        h.DataAttribute("shift-x", String(shift.x)),
        h.DataAttribute("shift-y", String(shift.y)),
        h.Style({ visibility: "hidden" }),
        ...getStyles(
          "tooltip",
          styles.tooltip,
          ...accentStyle(props.color, customAccent),
          props.color !== undefined && styles.colored,
          props.multiline === true && styles.multiline,
          styles[position],
          stylex.defaultMarker(),
          setVars([tooltipVars.zIndex, String(props.zIndex ?? 300)]),
          setDefinedStyle(["borderRadius", mapDefined(props.radius, radiusValue)])
        )
      ],
      [props.label]
    )

    return h.div(sx(h, styles.frame), [props.target(bind), ...(props.model.opened && !disabled ? [panel] : [])])
  }
