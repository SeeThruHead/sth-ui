import * as stylex from "@stylexjs/stylex"
import { Effect, Option, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { countFromEnd, countFromStart, dataSignature, fitsInRows, Message, overflowWrapsAtEnd, Phase } from "./model.ts"
import type { ItemBox, Model } from "./model.ts"
import { overflowListVars } from "./OverflowList.stylex.ts"

export { init, Message, Model, update } from "./model.ts"

export type OverflowListPart = "root"

export type OverflowListOptions = {
  readonly maxRows?: number
  readonly maxVisibleItems?: number
  readonly gap?: StyleValue
  readonly collapseFrom?: "start" | "end"
}

export type OverflowListProps<T, M> = OverflowListOptions &
  StylesApiProps<OverflowListPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly data: ReadonlyArray<T>
    readonly renderItem: (item: T, index: number) => Child
    readonly renderOverflow: (items: ReadonlyArray<T>) => Child
    readonly getItemKey?: (item: T, index: number) => string | number
  }

export type OverflowListConfig = ComponentConfig<OverflowListOptions, OverflowListPart>

const styles = stylex.create({
  root: {
    [overflowListVars.gap]: space.xs,
    display: "flex",
    flexWrap: "wrap",
    contain: "layout style",
    gap: overflowListVars.gap
  },
  probe: { position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }
})

type ProbeArgs = {
  readonly key: string
  readonly phase: Phase
  readonly maxRows: number
  readonly maxVisible: number
  readonly fromStart: boolean
  readonly withOverflow: boolean
  readonly width: number
}

type Measured = {
  readonly container: HTMLElement
  readonly items: ReadonlyArray<Element>
  readonly overflow: Option.Option<Element>
}

const visibleLimit = (args: ProbeArgs): number => (args.maxVisible < 0 ? Infinity : args.maxVisible)

const boxOf = (element: Element): ItemBox => {
  const rect = element.getBoundingClientRect()

  return { top: rect.top, bottom: rect.bottom, width: rect.width }
}

const measured = (probe: Element, args: ProbeArgs): Measured => {
  const container = Option.getOrThrow(Option.fromNullishOr(probe.parentElement))
  const rest = Array.from(container.children).filter((child) => child !== probe)
  const overflowIndex = args.fromStart ? 0 : rest.length - 1
  const overflow = args.withOverflow ? Option.fromNullishOr(rest[overflowIndex]) : Option.none()

  return { container, items: rest.filter((child) => Option.getOrUndefined(overflow) !== child), overflow }
}

const gapOf = (container: HTMLElement): number => Number.parseFloat(getComputedStyle(container).columnGap)

const counted = (args: ProbeArgs, { container, items }: Measured): Message => {
  const width = container.getBoundingClientRect().width
  const boxes = items.map(boxOf)
  const count = args.fromStart
    ? countFromStart(
        boxes.map((box) => box.width),
        width,
        gapOf(container),
        args.maxRows,
        visibleLimit(args)
      )
    : countFromEnd(boxes, width, args.maxRows, visibleLimit(args))

  return Message.Counted({ key: args.key, count, width })
}

const overflowWraps = (args: ProbeArgs, { container, items }: Measured, overflow: Element): boolean => {
  const boxes = items.map(boxOf)
  if (!args.fromStart) return overflowWrapsAtEnd(boxes, boxOf(overflow))
  if (boxes.length === 0) return false
  const widths = [boxOf(overflow).width, ...boxes.map((box) => box.width)]

  return !fitsInRows(widths, container.getBoundingClientRect().width, gapOf(container), args.maxRows)
}

const checked = (args: ProbeArgs, measurement: Measured): Message =>
  Option.match(measurement.overflow, {
    onNone: () => Message.Settled(),
    onSome: (overflow) => (overflowWraps(args, measurement, overflow) ? Message.Subtracted() : Message.Settled())
  })

const watchWidth = (queue: Queue.Queue<Message, Cause.Done>, container: HTMLElement, width: number) => {
  const observer = new ResizeObserver(() => {
    if (container.getBoundingClientRect().width === width) return
    Queue.offerUnsafe(queue, Message.Resized())
  })
  observer.observe(container)

  return () => observer.disconnect()
}

const Probe = Mount.defineStream("OverflowListProbe", {
  args: {
    key: Schema.String,
    phase: Phase,
    maxRows: Schema.Finite,
    maxVisible: Schema.Int,
    fromStart: Schema.Boolean,
    withOverflow: Schema.Boolean,
    width: Schema.Finite
  },
  messages: [Message.Counted, Message.Subtracted, Message.Settled, Message.Resized],
  execute: ({ element, ...args }) =>
    Stream.callback<Message>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const measurement = measured(element, args)
          if (args.phase === "normal") return watchWidth(queue, measurement.container, args.width)
          Queue.offerUnsafe(queue, args.phase === "measuring" ? counted(args, measurement) : checked(args, measurement))

          return () => undefined
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const OverflowList =
  (config: { readonly OverflowList?: OverflowListConfig }) =>
  <T, M>(h: HtmlBuilder<M>, input: OverflowListProps<T, M>): Html => {
    const props = withDefaults(config.OverflowList, input)
    const getStyles = stylesApi<M, OverflowListPart>(h, props, config.OverflowList, "root")
    const maxRows = props.maxRows ?? 1
    const maxVisible = props.maxVisibleItems ?? Infinity
    const fromStart = props.collapseFrom === "start"
    const key = [dataSignature(props.data, props.getItemKey), maxRows, maxVisible, fromStart].join("|")
    const phase = props.model.key === key ? props.model.phase : "measuring"
    const shown = fromStart ? props.data.slice(-maxVisible) : props.data.slice(0, maxVisible)
    const visible = Math.max(0, props.model.visible - props.model.subtract)
    const hidden = props.data.length - visible
    const withOverflow = hidden > 0 && phase !== "measuring"
    const overflowItems = fromStart ? props.data.slice(0, hidden) : props.data.slice(visible)
    const offset = props.data.length - shown.length
    const isVisible = (index: number): boolean => {
      if (phase === "measuring") return true

      return fromStart ? index >= shown.length - visible : index < visible
    }
    const items = shown.flatMap((item, index) =>
      isVisible(index) ? [props.renderItem(item, fromStart ? offset + index : index)] : []
    )
    const overflow = withOverflow ? [props.renderOverflow(overflowItems)] : []

    return h.div(
      [...getStyles("root", styles.root, setDefinedVars([overflowListVars.gap, mapDefined(props.gap, spacing)]))],
      [
        h.keyed("span")(
          [key, phase, props.model.round].join("|"),
          [
            ...sx(h, styles.probe),
            h.AriaHidden(true),
            h.OnMount(
              Mount.mapMessage(
                Probe({
                  key,
                  phase,
                  maxRows,
                  maxVisible: Number.isFinite(maxVisible) ? maxVisible : -1,
                  fromStart,
                  withOverflow,
                  width: props.model.width
                }),
                props.toParentMessage
              )
            )
          ],
          []
        ),
        ...(fromStart ? [...overflow, ...items] : [...items, ...overflow])
      ]
    )
  }
