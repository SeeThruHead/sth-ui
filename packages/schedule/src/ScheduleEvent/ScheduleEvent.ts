import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { stylesApi } from "@sth-ui/core/styles/StylesApi.ts"
import type { StylesApiProps, Sx } from "@sth-ui/core/styles/StylesApi.ts"
import { accentStyle } from "@sth-ui/core/theme/accent.ts"
import { customAccent } from "@sth-ui/core/theme/customAccent.ts"
import { accent, colors, fontWeight, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { ScheduleEvent as EventData } from "../events.ts"

export type EventAttribute<M> = Parameters<HtmlBuilder<M>["div"]>[0][number]

export type RenderEvent<M> = (
  event: EventData,
  props: { readonly attributes: ReadonlyArray<EventAttribute<M>>; readonly children: ReadonlyArray<Html> }
) => Html

export type ScheduleEventPart = "event" | "eventInner" | "eventResizeHandle"

export type ScheduleEventProps<M> = StylesApiProps<ScheduleEventPart> & {
  readonly event: EventData
  readonly onClick?: M
  readonly renderEventBody?: ((event: EventData) => Child) | undefined
  readonly renderEvent?: RenderEvent<M> | undefined
  readonly nowrap?: boolean
  readonly hanging?: "start" | "end" | "both" | "none"
  readonly clipStart?: boolean
  readonly resizeAxis?: "vertical" | "horizontal"
  readonly clipEnd?: boolean
  readonly size?: "sm" | "md"
  readonly cascade?: boolean
  readonly static?: boolean
  readonly draggable?: boolean
  readonly dragging?: boolean
  readonly invalid?: boolean
  readonly resizable?: boolean
  readonly resizing?: boolean
  readonly layout: Sx
}

const styles = stylex.create({
  event: {
    padding: "1px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    zIndex: 3,
    boxSizing: "border-box"
  },
  cascade: {
    zIndex: {
      default: "var(--event-z-index, 3)",
      ":hover": "var(--event-z-index-raised, 9)",
      ":focus-within": "var(--event-z-index-raised, 9)"
    },
    transitionProperty: "z-index",
    transitionDuration: "0s",
    transitionDelay: { default: "0s", ":hover": "var(--event-raise-delay, 600ms)", ":focus-within": "0s" }
  },
  dragging: { opacity: 0.2 },
  resizing: { zIndex: 10 },
  invalidInner: { outline: `1px solid ${colors.error}`, opacity: 0.6 },
  grab: { cursor: { default: "grab", ":active": "grabbing" } },
  handle: {
    position: "absolute",
    insetInline: "4px",
    height: "6px",
    zIndex: 1,
    cursor: "ns-resize",
    touchAction: "none"
  },
  handleStart: { top: 0 },
  handleEnd: { bottom: 0 },
  handleSide: { insetInline: "auto", insetBlock: "4px", width: "6px", height: "auto", cursor: "ew-resize" },
  handleLeft: { insetInlineStart: 0 },
  handleRight: { insetInlineEnd: 0 },
  inner: {
    backgroundColor: { default: accent.light, ":hover": accent.lightHover },
    color: accent.lightColor,
    borderRadius: radius.sm,
    fontWeight: fontWeight.medium,
    fontSize: "12px",
    fontFamily: "inherit",
    lineHeight: 1,
    padding: "3px 4px",
    width: "100%",
    height: "100%",
    borderWidth: 0,
    textAlign: "start",
    cursor: "pointer",
    userSelect: "none",
    overflow: "hidden",
    boxSizing: "border-box",
    display: "block"
  },
  filled: { backgroundColor: { default: accent.filled, ":hover": accent.filledHover }, color: accent.contrast },
  md: { fontSize: "14px", padding: "4px 6px" },
  hangingStart: {
    borderStartStartRadius: 0,
    borderEndStartRadius: 0,
    paddingInlineStart: "6px",
    boxShadow: "inset 2px 0 0 color-mix(in srgb, currentColor 30%, transparent)"
  },
  hangingEnd: {
    borderStartEndRadius: 0,
    borderEndEndRadius: 0,
    paddingInlineEnd: "6px",
    boxShadow: "inset -2px 0 0 color-mix(in srgb, currentColor 30%, transparent)"
  },
  clipStart: {
    paddingInlineStart: "12px",
    borderStartStartRadius: 0,
    borderEndStartRadius: 0,
    clipPath: "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)"
  },
  clipEnd: {
    paddingInlineEnd: "12px",
    borderStartEndRadius: 0,
    borderEndEndRadius: 0,
    clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)"
  },
  clipBoth: {
    clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)"
  },
  nowrap: { whiteSpace: "nowrap", textOverflow: "ellipsis", lineHeight: 1.25 },
  still: { cursor: "default", pointerEvents: "none" },
  cascadeInner: { boxShadow: "0 0 0 1px var(--sth-color-body, white)" }
})

const flagNames = [
  ["cascade", "cascade"],
  ["draggable", "draggable"],
  ["dragging", "dragging"],
  ["invalid", "invalid"],
  ["resizable", "resizable"],
  ["resizing", "resizing"],
  ["clipStart", "clip-start"],
  ["clipEnd", "clip-end"]
] as const

const flags = <M>(h: HtmlBuilder<M>, props: ScheduleEventProps<M>) =>
  flagNames.filter(([prop]) => props[prop] === true).map(([, name]) => h.DataAttribute(name, ""))

const handle = <M>(
  h: HtmlBuilder<M>,
  props: ScheduleEventProps<M>,
  edge: "start" | "end",
  getStyles: ReturnType<typeof stylesApi<M, ScheduleEventPart>>
): ReadonlyArray<Html> =>
  props.resizable === true
    ? [
        h.div(
          [
            ...getStyles(
              "eventResizeHandle",
              styles.handle,
              edge === "start" ? styles.handleStart : styles.handleEnd,
              props.resizeAxis === "horizontal" && styles.handleSide,
              props.resizeAxis === "horizontal" && (edge === "start" ? styles.handleLeft : styles.handleRight)
            ),
            h.DataAttribute("resize-edge", edge),
            h.DataAttribute("event-id", String(props.event.id)),
            ...(typeof props.event.id === "number" ? [h.DataAttribute("event-numeric", "")] : []),
            h.AriaHidden(true)
          ],
          []
        )
      ]
    : []

export const ScheduleEvent = <M>(h: HtmlBuilder<M>, props: ScheduleEventProps<M>): Html => {
  const getStyles = stylesApi<M, ScheduleEventPart>(h, props, undefined, "event")
  const event = props.event
  const variant = event.variant ?? "light"

  const attributes = [
    ...getStyles(
      "event",
      ...accentStyle(event.color, customAccent),
      styles.event,
      props.cascade === true && styles.cascade,
      props.dragging === true && styles.dragging,
      props.resizing === true && styles.resizing,
      props.layout
    ),
    h.DataAttribute("event-id", String(event.id)),
    ...(typeof event.id === "number" ? [h.DataAttribute("event-numeric", "")] : []),
    ...flags(h, props),
    ...(props.hanging === undefined || props.hanging === "none" ? [] : [h.DataAttribute("hanging", props.hanging)])
  ]
  const children = [
    ...handle(h, props, "start", getStyles),
    h.button(
      [
        ...getStyles(
          "eventInner",
          styles.inner,
          variant === "filled" && styles.filled,
          props.nowrap === true && styles.nowrap,
          props.clipStart === true && styles.clipStart,
          props.clipEnd === true && styles.clipEnd,
          props.clipStart === true && props.clipEnd === true && styles.clipBoth,
          (props.hanging === "start" || props.hanging === "both") && styles.hangingStart,
          (props.hanging === "end" || props.hanging === "both") && styles.hangingEnd,
          props.size === "md" && styles.md,
          props.static === true && styles.still,
          props.cascade === true && styles.cascadeInner,
          props.draggable === true && styles.grab,
          props.invalid === true && styles.invalidInner,
          shared.focusRing
        ),
        h.Type("button"),
        h.Title(event.title),
        ...(props.static === true ? [h.Tabindex(-1)] : []),
        ...(props.onClick === undefined ? [] : [h.OnClick(props.onClick)])
      ],
      [props.renderEventBody === undefined ? event.title : props.renderEventBody(event)]
    ),
    ...handle(h, props, "end", getStyles)
  ]
  if (props.renderEvent !== undefined) return props.renderEvent(event, { attributes, children })

  return h.keyed("div")(String(event.id), attributes, children)
}
