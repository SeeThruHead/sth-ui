import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Predicate, Queue, Stream } from "effect"
import type { Cause } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { colors } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { AccordionChevron } from "../Accordion/Accordion.ts"
import { Message, scrollState, update } from "./model.ts"
import type { Model } from "./model.ts"
import { scrollerVars } from "./Scroller.stylex.ts"

export { init, Message, Model, scrollState } from "./model.ts"
export type { ScrollerContext } from "./model.ts"

export type ScrollerPart = "root" | "container" | "content" | "control" | "chevron"

export type ScrollerOptions = {
  readonly scrollAmount?: number
  readonly controlSize?: number | string
  readonly edgeGradientColor?: string
  readonly showStartControl?: boolean
  readonly showEndControl?: boolean
  readonly draggable?: boolean
}

export type ScrollerProps<M> = ScrollerOptions &
  StylesApiProps<ScrollerPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly startControlIcon?: Child
    readonly endControlIcon?: Child
    readonly startControlLabel?: string
    readonly endControlLabel?: string
    readonly children: ReadonlyArray<Child>
  }

export type ScrollerConfig = ComponentConfig<ScrollerOptions, ScrollerPart>

const containerId = (model: Model) => `${model.id}-container`

const isRtl = (element: Element): boolean => getComputedStyle(element).direction === "rtl"

const draggedMark = "data-dragged"

const startDrag = (container: HTMLElement) => (event: PointerEvent) => {
  container.removeAttribute(draggedMark)
  container.setAttribute("data-drag-start", String(event.screenX))
}

const followDrag = (container: HTMLElement) => (event: PointerEvent) => {
  if (event.buttons !== 1) return
  if (Math.abs(event.screenX - Number(container.getAttribute("data-drag-start"))) <= 5) return
  container.setAttribute(draggedMark, "")
}

const swallowDraggedClick = (container: HTMLElement) => (event: Event) => {
  if (!container.hasAttribute(draggedMark)) return
  container.removeAttribute(draggedMark)
  event.stopPropagation()
  event.preventDefault()
}

export { update }

const reporter = (queue: Queue.Queue<typeof Message.Scrolled.Type, Cause.Done>, container: HTMLElement) => (): void => {
  Queue.offerUnsafe(
    queue,
    Message.Scrolled({
      ...scrollState({
        scrollLeft: container.scrollLeft,
        scrollWidth: container.scrollWidth,
        clientWidth: container.clientWidth,
        rtl: isRtl(container)
      }),
      scrollLeft: container.scrollLeft
    })
  )
}

const WatchScroll = Mount.defineStream("ScrollerWatch", {
  messages: [Message.Scrolled],
  execute: ({ element }) =>
    Stream.callback<typeof Message.Scrolled.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const container = Option.getOrThrow(Option.liftPredicate(element, isHtmlElement))
          const report = reporter(queue, container)
          const observer = new ResizeObserver(report)
          const start = startDrag(container)
          const follow = followDrag(container)
          const swallow = swallowDraggedClick(container)
          report()
          container.addEventListener("scroll", report, { passive: true })
          container.addEventListener("pointerdown", start, { capture: true })
          container.addEventListener("pointermove", follow, { capture: true })
          container.addEventListener("click", swallow, { capture: true })
          observer.observe(container)
          Option.map(Option.fromNullishOr(container.firstElementChild), (content) => observer.observe(content))

          return () => {
            container.removeEventListener("scroll", report)
            container.removeEventListener("pointerdown", start, { capture: true })
            container.removeEventListener("pointermove", follow, { capture: true })
            container.removeEventListener("click", swallow, { capture: true })
            observer.disconnect()
          }
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const styles = stylex.create({
  root: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    maxWidth: "100%",
    [scrollerVars.background]: colors.body
  },
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "none",
    userSelect: "none"
  },
  draggable: { cursor: { default: "grab", ":active": "grabbing" } },
  content: { display: "inline-flex", whiteSpace: "nowrap" },
  control: {
    display: "flex",
    alignItems: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    width: scrollerVars.controlSize,
    zIndex: 1,
    color: { default: colors.dimmed, ":hover": colors.text },
    opacity: 1,
    pointerEvents: "auto",
    transitionProperty: "opacity, color",
    transitionDuration: "200ms, 150ms",
    transitionTimingFunction: "ease",
    borderWidth: 0,
    padding: 0,
    cursor: "pointer"
  },
  start: {
    insetInlineStart: 0,
    backgroundImage: `linear-gradient(to right, ${scrollerVars.background} 40%, transparent)`,
    justifyContent: "flex-start"
  },
  end: {
    insetInlineEnd: 0,
    backgroundImage: `linear-gradient(to left, ${scrollerVars.background} 40%, transparent)`,
    justifyContent: "flex-end"
  },
  hidden: { opacity: 0, pointerEvents: "none" },
  startChevron: { rotate: "90deg" },
  endChevron: { rotate: "-90deg" }
})

const sizeOf = (size: number | string): string => (Predicate.isNumber(size) ? rem(size) : size)

export const Scroller =
  (config: { readonly Scroller?: ScrollerConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ScrollerProps<M>): Html => {
    const props = withDefaults(config.Scroller, input)
    const getStyles = stylesApi<M, ScrollerPart>(h, props, config.Scroller, "root")
    const { model, toParentMessage: lift } = props
    const draggable = props.draggable !== false
    const control = (position: "start" | "end", shown: boolean, icon: Child | undefined, label: string) =>
      h.button(
        [
          ...getStyles("control", styles.control, styles[position], !shown && styles.hidden),
          h.Type("button"),
          h.AriaLabel(label),
          h.Tabindex(shown ? 0 : -1),
          h.DataAttribute("position", position),
          ...(shown ? [] : [h.DataAttribute("hidden", "")]),
          h.OnClick(lift(position === "start" ? Message.PressedStart() : Message.PressedEnd()))
        ],
        [
          icon ??
            h.span(getStyles("chevron", position === "start" ? styles.startChevron : styles.endChevron), [
              AccordionChevron(h, 16)
            ])
        ]
      )

    return h.div(
      getStyles(
        "root",
        styles.root,
        setDefinedVars(
          [scrollerVars.controlSize, mapDefined(props.controlSize, sizeOf)],
          [scrollerVars.background, mapDefined(props.edgeGradientColor, themeColor)]
        )
      ),
      [
        control(
          "start",
          props.showStartControl === true || model.canScrollStart,
          props.startControlIcon,
          props.startControlLabel ?? "Scroll left"
        ),
        h.div(
          [
            ...getStyles("container", styles.container, draggable && styles.draggable),
            h.Id(containerId(model)),
            h.Role("presentation"),
            ...(draggable ? [h.DataAttribute("draggable", "")] : []),
            ...(model.drag === null ? [] : [h.DataAttribute("dragging", "")]),
            h.OnMount(Mount.mapMessage(WatchScroll(), lift)),
            h.OnPointerDown((type, button, screenX) =>
              Option.liftPredicate(lift(Message.Pressed({ x: screenX })), () => type === "mouse" && button === 0)
            ),
            ...(model.drag === null
              ? []
              : [
                  h.OnPointerMove((screenX) => Option.some(lift(Message.Moved({ x: screenX })))),
                  h.OnPointerUp(() => Option.some(lift(Message.Released()))),
                  h.OnPointerLeave(() => Option.some(lift(Message.Released())))
                ])
          ],
          [h.div(getStyles("content", styles.content), props.children)]
        ),
        control(
          "end",
          props.showEndControl === true || model.canScrollEnd,
          props.endControlIcon,
          props.endControlLabel ?? "Scroll right"
        )
      ]
    )
  }
