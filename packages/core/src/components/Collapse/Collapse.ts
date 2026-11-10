import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Queue, Schema, Stream } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { mapDefined, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { collapseVars } from "./Collapse.stylex.ts"

export type CollapsePart = "root"

export type CollapseOptions = {
  readonly orientation?: "vertical" | "horizontal"
  readonly transitionDuration?: number
  readonly transitionTimingFunction?: string
  readonly animateOpacity?: boolean
  readonly keepMounted?: boolean
}

export type CollapseProps<M> = CollapseOptions &
  StylesApiProps<CollapsePart> & {
    readonly expanded: boolean
    readonly children: ReadonlyArray<Child>
    readonly onTransitionStart?: M
    readonly onTransitionEnd?: M
  }

export type CollapseConfig = ComponentConfig<CollapseOptions, CollapsePart>

const Transition = defineMessageUnion({ Started: {}, Ended: {} })

type Transition = typeof Transition.Type

const sizeProperties: ReadonlySet<string> = new Set(["grid-template-rows", "grid-template-columns"])

const ownSize = (element: Element, event: Event) =>
  event instanceof TransitionEvent && event.target === element && sizeProperties.has(event.propertyName)

const WatchTransition = Mount.defineStream("CollapseTransition", {
  args: { start: Schema.Boolean, end: Schema.Boolean },
  messages: [Transition.Started, Transition.Ended],
  execute: ({ element, start, end }) =>
    Stream.callback<Transition>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const listeners = [
            ...(start ? [["transitionstart", Transition.Started()] as const] : []),
            ...(end ? [["transitionend", Transition.Ended()] as const] : [])
          ].map(
            ([type, message]) =>
              [
                type,
                (event: Event) =>
                  Option.liftPredicate(message, () => ownSize(element, event)).pipe(
                    Option.map((ready) => Queue.offerUnsafe(queue, ready))
                  )
              ] as const
          )
          listeners.forEach(([type, listener]) => element.addEventListener(type, listener))

          return () => listeners.forEach(([type, listener]) => element.removeEventListener(type, listener))
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const styles = stylex.create({
  root: {
    display: "grid",
    transitionProperty: "grid-template-rows, opacity, visibility",
    transitionDuration: collapseVars.duration,
    transitionTimingFunction: collapseVars.timing
  },
  vertical: { gridTemplateRows: "1fr" },
  verticalClosed: { gridTemplateRows: "0fr" },
  horizontal: {
    gridTemplateColumns: "1fr",
    transitionProperty: "grid-template-columns, opacity, visibility",
    justifyContent: "start"
  },
  horizontalClosed: { gridTemplateColumns: "0fr" },
  closed: {
    visibility: "hidden",
    transitionDuration: `${collapseVars.duration}, ${collapseVars.duration}, 0s`,
    transitionDelay: `0s, 0s, ${collapseVars.duration}`
  },
  faded: { opacity: 0 },
  still: { transitionProperty: "grid-template-rows, grid-template-columns, visibility" },
  inner: { minHeight: 0, minWidth: 0, overflow: "hidden" }
})

export const Collapse =
  (config: { readonly Collapse?: CollapseConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CollapseProps<M>): Html => {
    const props = withDefaults(config.Collapse, input)
    const getStyles = stylesApi<M, CollapsePart>(h, props, config.Collapse, "root")
    const horizontal = props.orientation === "horizontal"
    const expanded = props.expanded
    const fade = props.animateOpacity !== false
    const shown = expanded || props.keepMounted !== false
    const start = Option.fromNullishOr(props.onTransitionStart)
    const end = Option.fromNullishOr(props.onTransitionEnd)
    const watch = WatchTransition({ start: Option.isSome(start), end: Option.isSome(end) })
    const lifted = (transition: Transition) => Option.getOrThrow(transition._tag === "Started" ? start : end)

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          horizontal ? styles.horizontal : styles.vertical,
          !expanded && (horizontal ? styles.horizontalClosed : styles.verticalClosed),
          !expanded && styles.closed,
          !expanded && fade && styles.faded,
          !fade && styles.still,
          setDefinedVars(
            [collapseVars.duration, mapDefined(props.transitionDuration, (ms) => `${ms}ms`)],
            [collapseVars.timing, props.transitionTimingFunction]
          )
        ),
        h.AriaHidden(!expanded),
        h.Inert(!expanded),
        ...(expanded ? [h.DataAttribute("expanded", "")] : []),
        ...(Option.isSome(Option.orElse(start, () => end)) ? [h.OnMount(Mount.mapMessage(watch, lifted))] : [])
      ],
      [h.div(sx(h, styles.inner), shown ? props.children : [])]
    )
  }
