import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Predicate, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Child } from "../../content.ts"
import { setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { rem } from "../../theme/units.ts"
import { documentDrag } from "../../hooks/drag.ts"
import { Message, overflowsX, overflowsY, progressOf, thumbRatio, update, viewportId } from "./model.ts"
import type { Axis, Metrics, Model, ScrollAreaType } from "./model.ts"
import { scrollAreaVars, scrollbarMarker } from "./ScrollArea.stylex.ts"

export { init, Message, Model, OutMessage } from "./model.ts"
export type { ScrollAreaType } from "./model.ts"
export { scrollAreaVars } from "./ScrollArea.stylex.ts"

export type ScrollAreaPart = "root" | "viewport" | "content" | "scrollbar" | "thumb" | "corner"

export type ScrollAreaScrollbars = "x" | "y" | "xy" | false

export type ScrollAreaOptions = {
  readonly type?: ScrollAreaType
  readonly scrollbarSize?: number | string
  readonly scrollHideDelay?: number
  readonly scrollbars?: ScrollAreaScrollbars
  readonly offsetScrollbars?: boolean | "x" | "y" | "present"
  readonly overscrollBehavior?: string
  readonly verticalScrollbarPosition?: "left" | "right"
}

export type ScrollAreaProps<M> = ScrollAreaOptions &
  StylesApiProps<ScrollAreaPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly startScrollPosition?: { readonly x?: number; readonly y?: number }
    readonly children: ReadonlyArray<Child>
  }

export type ScrollAreaConfig = ComponentConfig<ScrollAreaOptions, ScrollAreaPart>

export const ScrollTo = Command.define("ScrollAreaScrollTo", {
  args: {
    id: Schema.String,
    top: Schema.optional(Schema.Finite),
    left: Schema.optional(Schema.Finite),
    behavior: Schema.optional(Schema.Literals(["auto", "smooth", "instant"]))
  },
  messages: [Message.CompletedScroll],
  execute: ({ id, top, left, behavior }) =>
    Effect.sync(() => {
      Option.map(Option.fromNullishOr(document.getElementById(id)), (viewport) =>
        viewport.scrollTo({
          ...(top === undefined ? {} : { top }),
          ...(left === undefined ? {} : { left }),
          ...(behavior === undefined ? {} : { behavior })
        })
      )

      return Message.CompletedScroll()
    })
})

export const scrollTo = (
  model: Model,
  position: { readonly top?: number; readonly left?: number; readonly behavior?: "auto" | "smooth" | "instant" }
) => ScrollTo({ id: viewportId(model), ...position })

export { update, viewportId }

export type { ScrollAreaContext } from "./model.ts"

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  dragPointer: entry(
    { active: Schema.Boolean },
    {
      modelToDependencies: (model) => ({ active: Option.isSome(model.drag) }),
      dependenciesToStream: ({ active }) =>
        Stream.when(
          documentDrag<Message>((x, y) => Message.MovedPointer({ x, y }), Message.ReleasedPointer()),
          Effect.sync(() => active)
        )
    }
  )
}))

const metricsOf = (element: Element): Metrics => ({
  scrollTop: element.scrollTop,
  scrollLeft: element.scrollLeft,
  scrollHeight: element.scrollHeight,
  scrollWidth: element.scrollWidth,
  clientHeight: element.clientHeight,
  clientWidth: element.clientWidth
})

const WatchViewport = Mount.defineStream("ScrollAreaWatchViewport", {
  args: { startX: Schema.NullOr(Schema.Finite), startY: Schema.NullOr(Schema.Finite) },
  messages: [Message.Measured, Message.Scrolled],
  execute: ({ element, startX, startY }) =>
    Stream.callback<typeof Message.Measured.Type | typeof Message.Scrolled.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const starting = startX !== null || startY !== null
          Option.liftPredicate(element, () => starting).pipe(
            Option.map((viewport) => viewport.scrollTo({ left: startX ?? 0, top: startY ?? 0 }))
          )
          const measure = new ResizeObserver(() => {
            Queue.offerUnsafe(queue, Message.Measured({ metrics: metricsOf(element) }))
          })
          const scroll = (): void => {
            Queue.offerUnsafe(queue, Message.Scrolled({ metrics: metricsOf(element) }))
          }
          measure.observe(element)
          Option.map(Option.fromNullishOr(element.firstElementChild), (content) => measure.observe(content))
          element.addEventListener("scroll", scroll, { passive: true })

          return () => {
            measure.disconnect()
            element.removeEventListener("scroll", scroll)
          }
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const withinBounds = (position: number, max: number) => position > 0 && position < max

const wheelHandler =
  (queue: Queue.Queue<typeof Message.Wheeled.Type, Cause.Done>, axis: Axis, viewport: string) =>
  (event: Event): void => {
    Option.map(Option.fromNullishOr(document.getElementById(viewport)), (target) => {
      const delta = event instanceof WheelEvent ? (axis === "y" ? event.deltaY : event.deltaX) : 0
      const position = (axis === "y" ? target.scrollTop : target.scrollLeft) + delta
      const max = axis === "y" ? target.scrollHeight - target.clientHeight : target.scrollWidth - target.clientWidth
      if (!withinBounds(position, max)) return
      event.preventDefault()
      Queue.offerUnsafe(queue, Message.Wheeled({ axis, delta }))
    })
  }

const WheelScrollbar = Mount.defineStream("ScrollAreaWheelScrollbar", {
  args: { axis: Schema.Literals(["x", "y"]), viewport: Schema.String },
  messages: [Message.Wheeled],
  execute: ({ element, axis, viewport }) =>
    Stream.callback<typeof Message.Wheeled.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const wheel = wheelHandler(queue, axis, viewport)
          element.addEventListener("wheel", wheel, { passive: false })

          return () => element.removeEventListener("wheel", wheel)
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const styles = stylex.create({
  root: {
    [scrollAreaVars.scrollbarSize]: "12px",
    [scrollAreaVars.offsetSize]: scrollAreaVars.scrollbarSize,
    position: "relative",
    overflow: "hidden"
  },
  viewport: {
    scrollbarWidth: "none",
    overscrollBehavior: scrollAreaVars.overscroll,
    WebkitOverflowScrolling: "touch",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    "::-webkit-scrollbar": { display: "none" }
  },
  scrollX: { overflowX: "scroll" },
  hiddenX: { overflowX: "hidden" },
  scrollY: { overflowY: "scroll" },
  hiddenY: { overflowY: "hidden" },
  offsetEnd: { paddingInlineEnd: scrollAreaVars.offsetSize },
  offsetLeft: { paddingLeft: scrollAreaVars.offsetSize },
  offsetRight: { paddingRight: scrollAreaVars.offsetSize },
  offsetBottom: { paddingBottom: scrollAreaVars.offsetSize },
  content: { minWidth: "100%" },
  autosizeContent: { minWidth: "min-content" },
  autosizeRoot: { display: "flex", flexDirection: "column" },
  autosizeViewport: { height: "auto", minHeight: 0, flexGrow: 0, flexShrink: 1, flexBasis: "auto" },
  scrollbar: {
    position: "absolute",
    userSelect: "none",
    touchAction: "none",
    boxSizing: "border-box",
    transitionProperty: "background-color, opacity",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    padding: `calc(${scrollAreaVars.scrollbarSize} / 5)`,
    display: "flex",
    backgroundColor: {
      default: "transparent",
      ":hover": `light-dark(${palette.gray0}, ${palette.dark8})`
    }
  },
  hidden: { display: "none" },
  vertical: {
    width: scrollAreaVars.scrollbarSize,
    top: 0,
    bottom: scrollAreaVars.cornerHeight,
    insetInlineEnd: 0
  },
  verticalLeft: { insetInlineEnd: "auto", left: 0, right: "auto" },
  verticalRight: { insetInlineEnd: "auto", left: "auto", right: 0 },
  horizontal: {
    height: scrollAreaVars.scrollbarSize,
    flexDirection: "column",
    bottom: 0,
    insetInlineStart: 0,
    insetInlineEnd: scrollAreaVars.cornerWidth
  },
  horizontalLeft: { insetInlineStart: "auto", insetInlineEnd: "auto", left: scrollAreaVars.cornerWidth, right: 0 },
  horizontalRight: { insetInlineStart: "auto", insetInlineEnd: "auto", left: 0, right: scrollAreaVars.cornerWidth },
  thumb: {
    position: "absolute",
    borderRadius: scrollAreaVars.scrollbarSize,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    backgroundColor: {
      default: "light-dark(rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.4))",
      [stylex.when.ancestor(":hover", scrollbarMarker)]: "light-dark(rgba(0, 0, 0, 0.5), rgba(255, 255, 255, 0.5))"
    },
    "::before": {
      content: "''",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "100%",
      height: "100%",
      minWidth: "44px",
      minHeight: "44px"
    }
  },
  thumbVertical: {
    left: `calc(${scrollAreaVars.scrollbarSize} / 5)`,
    right: `calc(${scrollAreaVars.scrollbarSize} / 5)`,
    height: `max(calc((100% - 2 * ${scrollAreaVars.scrollbarSize} / 5) * ${scrollAreaVars.thumbSize}), 18px)`,
    top: `calc(${scrollAreaVars.scrollbarSize} / 5 + (100% - 2 * ${scrollAreaVars.scrollbarSize} / 5 - max(calc((100% - 2 * ${scrollAreaVars.scrollbarSize} / 5) * ${scrollAreaVars.thumbSize}), 18px)) * ${scrollAreaVars.progress})`
  },
  thumbHorizontal: {
    top: `calc(${scrollAreaVars.scrollbarSize} / 5)`,
    bottom: `calc(${scrollAreaVars.scrollbarSize} / 5)`,
    width: `max(calc((100% - 2 * ${scrollAreaVars.scrollbarSize} / 5) * ${scrollAreaVars.thumbSize}), 18px)`,
    insetInlineStart: `calc(${scrollAreaVars.scrollbarSize} / 5 + (100% - 2 * ${scrollAreaVars.scrollbarSize} / 5 - max(calc((100% - 2 * ${scrollAreaVars.scrollbarSize} / 5) * ${scrollAreaVars.thumbSize}), 18px)) * ${scrollAreaVars.progress})`
  },
  corner: {
    position: "absolute",
    display: "block",
    width: scrollAreaVars.scrollbarSize,
    height: scrollAreaVars.scrollbarSize,
    insetInlineEnd: 0,
    bottom: 0,
    transitionProperty: "opacity",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`,
    opacity: { default: 0, [stylex.when.anySibling(":hover", scrollbarMarker)]: 1 }
  },
  cornerLeft: { insetInlineEnd: "auto", left: 0, right: "auto" },
  cornerRight: { insetInlineEnd: "auto", left: "auto", right: 0 }
})

const isElement = (target: EventTarget | null): target is Element => target instanceof Element

const pressedScrollbar = <M>(
  props: ScrollAreaProps<M>,
  axis: Axis,
  x: number,
  y: number,
  target: EventTarget | null
): Option.Option<M> =>
  Option.fromNullishOr(target).pipe(
    Option.filter(isElement),
    Option.flatMap((element) => Option.fromNullishOr(element.closest("[data-scrollarea-scrollbar]"))),
    Option.map((scrollbar) => {
      const box = scrollbar.getBoundingClientRect()
      const style = getComputedStyle(scrollbar)
      const pointer = axis === "y" ? y : x
      const thumb = Option.fromNullishOr(scrollbar.querySelector("[data-scrollarea-thumb]")).pipe(
        Option.map((element) => element.getBoundingClientRect()),
        Option.filter((thumbBox) =>
          axis === "y" ? y >= thumbBox.top && y <= thumbBox.bottom : x >= thumbBox.left && x <= thumbBox.right
        )
      )

      return props.toParentMessage(
        Message.PressedScrollbar({
          axis,
          pointer,
          offset: Option.match(thumb, {
            onNone: () => 0,
            onSome: (thumbBox) => pointer - (axis === "y" ? thumbBox.top : thumbBox.left)
          }),
          track:
            axis === "y"
              ? {
                  start: box.top,
                  size: box.height,
                  paddingStart: Number.parseFloat(style.paddingTop),
                  paddingEnd: Number.parseFloat(style.paddingBottom)
                }
              : {
                  start: box.left,
                  size: box.width,
                  paddingStart: Number.parseFloat(style.paddingLeft),
                  paddingEnd: Number.parseFloat(style.paddingRight)
                }
        })
      )
    })
  )

const offsets = (offset: ScrollAreaOptions["offsetScrollbars"], axis: Axis, overflowing: boolean) => {
  if (offset === undefined || offset === false) return false
  if (offset === "present") return overflowing

  return offset === true || offset === axis
}

const sizeValue = (size: number | string | undefined) =>
  size === undefined ? undefined : Predicate.isNumber(size) ? rem(size) : size

const overscrollValue = (behavior: string | undefined, scrollbars: ScrollAreaScrollbars) => {
  if (behavior === undefined) return undefined
  if (scrollbars === "x") return `${behavior} auto`

  return scrollbars === "y" ? `auto ${behavior}` : behavior
}

export const ScrollArea =
  (config: { readonly ScrollArea?: ScrollAreaConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ScrollAreaProps<M>): Html =>
    scrollArea(config, h, input, false)

export const ScrollAreaAutosize =
  (config: { readonly ScrollArea?: ScrollAreaConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ScrollAreaProps<M>): Html =>
    scrollArea(config, h, input, true)

const scrollArea = <M>(
  config: { readonly ScrollArea?: ScrollAreaConfig },
  h: HtmlBuilder<M>,
  input: ScrollAreaProps<M>,
  autosize: boolean
): Html => {
  const props = withDefaults(config.ScrollArea, input)
  const getStyles = stylesApi<M, ScrollAreaPart>(h, props, config.ScrollArea, "root")
  const { model } = props
  const type = props.type ?? "hover"
  const scrollbars = props.scrollbars ?? "xy"
  const enabledX = scrollbars === "xy" || scrollbars === "x"
  const enabledY = scrollbars === "xy" || scrollbars === "y"
  const metrics = Option.getOrUndefined(model.metrics)
  const overflowX = metrics !== undefined && overflowsX(metrics)
  const overflowY = metrics !== undefined && overflowsY(metrics)
  const visible = (enabled: boolean, overflowing: boolean) => {
    if (!enabled) return false
    if (type === "never") return false
    if (type === "always") return true

    return overflowing && (type === "auto" || model.shown)
  }
  const showX = visible(enabledX, overflowX)
  const showY = visible(enabledY, overflowY)
  const position = props.verticalScrollbarPosition
  const offsetY = enabledY && offsets(props.offsetScrollbars, "y", overflowY)
  const offsetX = enabledX && offsets(props.offsetScrollbars, "x", overflowX)
  const thumbView = (axis: Axis, measured: Metrics): Html => {
    const vertical = axis === "y"
    const ratio = vertical
      ? thumbRatio(measured.clientHeight, measured.scrollHeight)
      : thumbRatio(measured.clientWidth, measured.scrollWidth)

    return h.div(
      [
        ...getStyles(
          "thumb",
          styles.thumb,
          vertical ? styles.thumbVertical : styles.thumbHorizontal,
          setVars(
            [scrollAreaVars.thumbSize, String(ratio)],
            [scrollAreaVars.progress, String(progressOf(measured, axis))]
          )
        ),
        h.DataAttribute("scrollarea-thumb", "")
      ],
      []
    )
  }
  const scrollbarView = (axis: Axis, shown: boolean): Html => {
    const vertical = axis === "y"

    return h.div(
      [
        ...getStyles(
          "scrollbar",
          styles.scrollbar,
          vertical ? styles.vertical : styles.horizontal,
          vertical && position === "left" && styles.verticalLeft,
          vertical && position === "right" && styles.verticalRight,
          !vertical && position === "left" && styles.horizontalLeft,
          !vertical && position === "right" && styles.horizontalRight,
          !shown && styles.hidden,
          scrollbarMarker
        ),
        h.DataAttribute("scrollarea-scrollbar", ""),
        h.DataAttribute("orientation", vertical ? "vertical" : "horizontal"),
        h.DataAttribute("state", shown ? "visible" : "hidden"),
        ...(type === "never" ? [h.DataAttribute("hidden", "")] : []),
        h.OnMount(Mount.mapMessage(WheelScrollbar({ axis, viewport: viewportId(model) }), props.toParentMessage)),
        h.OnMouseEnter(props.toParentMessage(Message.HoveredScrollbar({ hovered: true }))),
        h.OnMouseLeave(props.toParentMessage(Message.HoveredScrollbar({ hovered: false }))),
        h.OnPointerDown((_type, button, _sx, _sy, _t, x, y, _pointer, target) =>
          button === 0 ? pressedScrollbar(props, axis, x, y, target) : Option.none()
        )
      ],
      Option.match(Option.filter(model.metrics, vertical ? overflowsY : overflowsX), {
        onNone: () => [],
        onSome: (measured) => [thumbView(axis, measured)]
      })
    )
  }

  return h.div(
    [
      ...getStyles(
        "root",
        styles.root,
        autosize && styles.autosizeRoot,
        setDefinedVars(
          [scrollAreaVars.scrollbarSize, sizeValue(props.scrollbarSize)],
          [scrollAreaVars.overscroll, overscrollValue(props.overscrollBehavior, scrollbars)],
          [scrollAreaVars.cornerWidth, showX && showY ? scrollAreaVars.scrollbarSize : undefined],
          [scrollAreaVars.cornerHeight, showX && showY ? scrollAreaVars.scrollbarSize : undefined]
        )
      ),
      ...(autosize ? [h.DataAttribute("autosize", "true")] : []),
      h.OnMouseEnter(props.toParentMessage(Message.EnteredRoot())),
      h.OnMouseLeave(props.toParentMessage(Message.LeftRoot()))
    ],
    [
      h.div(
        [
          ...getStyles(
            "viewport",
            styles.viewport,
            autosize && styles.autosizeViewport,
            enabledX ? styles.scrollX : styles.hiddenX,
            enabledY ? styles.scrollY : styles.hiddenY,
            offsetY && position === undefined && styles.offsetEnd,
            offsetY && position === "left" && styles.offsetLeft,
            offsetY && position === "right" && styles.offsetRight,
            offsetX && styles.offsetBottom
          ),
          h.Id(viewportId(model)),
          h.DataAttribute("scrollarea-viewport", ""),
          h.OnMount(
            Mount.mapMessage(
              WatchViewport({
                startX: props.startScrollPosition?.x ?? null,
                startY: props.startScrollPosition?.y ?? null
              }),
              props.toParentMessage
            )
          )
        ],
        [h.div(getStyles("content", styles.content, autosize && styles.autosizeContent), props.children)]
      ),
      ...(enabledX ? [scrollbarView("x", showX)] : []),
      ...(enabledY ? [scrollbarView("y", showY)] : []),
      ...(showX && showY
        ? [
            h.div(
              [
                ...getStyles(
                  "corner",
                  styles.corner,
                  position === "left" && styles.cornerLeft,
                  position === "right" && styles.cornerRight
                ),
                ...(model.scrollbarHovered ? [h.DataAttribute("hovered", "")] : [])
              ],
              []
            )
          ]
        : [])
    ]
  )
}
