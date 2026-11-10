import * as stylex from "@stylexjs/stylex"
import { anchorSetup } from "@foldkit/ui/anchor"
import { Effect, Option, Predicate, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { listOf, mergeStyles, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { shadowValue } from "../../styles/styleProps.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { Button } from "../Button/Button.ts"
import type { ButtonConfig } from "../Button/Button.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { FocusTrap, FocusTrapInitialFocus } from "../FocusTrap/FocusTrap.ts"
import { Group } from "../Group/Group.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import { transitions } from "../Transition/presets.ts"
import type { TransitionName, TransitionStyles } from "../Transition/presets.ts"
import type { GroupConfig } from "../Group/Group.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { displayStep, isInView, Message, overlayHitPath, showsTooltip, spotlightRect } from "./model.ts"
import type { Model, Rect, TourContext, TourMode } from "./model.ts"
import { tourVars } from "./Tour.stylex.ts"

export { displayStep, init, Message, Model, OutMessage, showsTooltip, update } from "./model.ts"
export type { TourContext, TourMode } from "./model.ts"

export type TourPart =
  | "root"
  | "overlay"
  | "spotlight"
  | "tooltip"
  | "title"
  | "body"
  | "navigation"
  | "closeButton"
  | "stepCounter"
  | "beacon"
  | "beaconPulse"
  | "navigationButton"

export const TourPosition = Schema.Literals([
  "top",
  "right",
  "bottom",
  "left",
  "top-start",
  "top-end",
  "right-start",
  "right-end",
  "bottom-start",
  "bottom-end",
  "left-start",
  "left-end"
])

export type TourPosition = typeof TourPosition.Type

export type TourStep = {
  readonly target?: string
  readonly title?: Child
  readonly children?: ReadonlyArray<Child>
  readonly position?: TourPosition
  readonly withOverlay?: boolean
  readonly spotlightPadding?: number
  readonly spotlightRadius?: number
  readonly withBeacon?: boolean
}

export type TourLabels = {
  readonly skip: string
  readonly back: string
  readonly next: string
  readonly close: string
  readonly stepCounter: (current: number, total: number) => string
  readonly beacon: string
}

export type TourOptions = {
  readonly mode?: TourMode
  readonly withOverlay?: boolean
  readonly withOverlayInteraction?: boolean
  readonly withCloseButton?: boolean
  readonly withKeyboardNavigation?: boolean
  readonly withScrollIntoView?: boolean
  readonly spotlightPadding?: number
  readonly spotlightRadius?: number
  readonly closeOnEscape?: boolean
  readonly closeOnOverlayClick?: boolean
  readonly zIndex?: number | string
  readonly maxWidth?: number
  readonly overlayColor?: string
  readonly color?: string
  readonly tooltipShadow?: string
  readonly stepTransitionDuration?: number
  readonly transitionProps?: {
    readonly transition?: TransitionName
    readonly duration?: number
    readonly timingFunction?: string
  }
  readonly scrollIntoViewOptions?: TourScrollOptions
  readonly withinPortal?: boolean
}

export type TourProps<M> = TourOptions &
  StylesApiProps<TourPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly steps: ReadonlyArray<TourStep>
    readonly labels?: Partial<TourLabels>
    readonly renderTooltip?: (parts: TourTooltipParts) => ReadonlyArray<Child>
  }

export type TourConfig = ComponentConfig<TourOptions, TourPart>

export const defaultLabels: TourLabels = {
  skip: "Skip",
  back: "Back",
  next: "Next",
  close: "Close",
  stepCounter: (current, total) => `${current} of ${total}`,
  beacon: "Start tour"
}

export const tourContext = (
  props: Pick<TourProps<never>, "steps" | "mode" | "closeOnEscape" | "withKeyboardNavigation">
): TourContext => ({
  stepsCount: props.steps.length,
  ...(props.mode === undefined ? {} : { mode: props.mode }),
  ...(props.closeOnEscape === undefined ? {} : { closeOnEscape: props.closeOnEscape }),
  ...(props.withKeyboardNavigation === undefined ? {} : { withKeyboardNavigation: props.withKeyboardNavigation })
})

const isKeyboardEvent = (event: Event): event is KeyboardEvent => event instanceof KeyboardEvent

const formFields: ReadonlySet<string> = new Set(["INPUT", "TEXTAREA", "SELECT"])

const typing = (event: Event): boolean => {
  if (!(event.target instanceof HTMLElement)) return false
  if (formFields.has(event.target.tagName)) return true

  return event.target.isContentEditable
}

const insideTarget = (targetId: string, event: Event): boolean =>
  Option.exists(
    Option.all([
      Option.fromNullishOr(document.getElementById(targetId)),
      Option.liftPredicate(event.target, (found): found is Node => found instanceof Node)
    ]),
    ([target, inner]) => target.contains(inner)
  )

type PressedKey = typeof Message.PressedKey.Type

const keyListener = (queue: Queue.Queue<PressedKey, Cause.Done>, targetId: string) => (event: Event) =>
  Option.map(Option.liftPredicate(event, isKeyboardEvent), (key) =>
    Queue.offerUnsafe(
      queue,
      Message.PressedKey({ key: key.key, insideTarget: typing(key) || insideTarget(targetId, key) })
    )
  )

const WatchKeys = Mount.defineStream("TourKeys", {
  args: { targetId: Schema.String },
  messages: [Message.PressedKey],
  execute: ({ targetId }) =>
    Stream.callback<PressedKey>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const onKeyDown = keyListener(queue, targetId)
          document.addEventListener("keydown", onKeyDown, { capture: true })

          return () => document.removeEventListener("keydown", onKeyDown, { capture: true })
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const rectOf = (element: Element): Rect => {
  const box = element.getBoundingClientRect()

  return { top: box.top, left: box.left, width: box.width, height: box.height }
}

const ancestors = (element: Element): ReadonlyArray<Element> => {
  const parent = element.parentElement
  if (parent === null || parent === document.body) return []

  return [parent, ...ancestors(parent)]
}

const scrollClips = (element: Element): ReadonlyArray<Rect> =>
  ancestors(element)
    .filter((ancestor) => /(auto|scroll|hidden)/.test(getComputedStyle(ancestor).overflow))
    .map(rectOf)

const ScrollBehavior = Schema.Literals(["auto", "instant", "smooth"])

type ScrollBehavior = typeof ScrollBehavior.Type

const ScrollBlock = Schema.Literals(["start", "center", "end", "nearest"])

type ScrollBlock = typeof ScrollBlock.Type

export type TourScrollOptions = {
  readonly behavior?: ScrollBehavior
  readonly block?: ScrollBlock
}

const scrollIntoView = (element: Element, options: ScrollIntoViewOptions) => {
  const viewport = { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
  if (!isInView(rectOf(element), viewport, scrollClips(element))) element.scrollIntoView(options)
}

const TrackSpotlight = Mount.define("TourSpotlight", {
  args: {
    targetId: Schema.String,
    padding: Schema.Finite,
    radius: Schema.Finite,
    scroll: Schema.Boolean,
    behavior: ScrollBehavior,
    block: ScrollBlock
  },
  messages: [Message.CompletedMount],
  execute: Effect.fn("TourSpotlight")(function* ({
    element,
    targetId,
    padding,
    radius: corner,
    scroll,
    behavior,
    block
  }) {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const target = Option.fromNullishOr(document.getElementById(targetId))
        Option.map(
          Option.filter(target, () => scroll),
          (found) => scrollIntoView(found, { behavior, block })
        )
        const place = () => {
          const rect = Option.getOrNull(Option.map(target, rectOf))
          Option.map(Option.fromNullishOr(element.querySelector("[data-tour-spotlight]")), (spotlight) =>
            Option.map(Option.fromNullishOr(rect), (found) => {
              const padded = spotlightRect(found, padding)
              spotlight.setAttribute("x", String(padded.left))
              spotlight.setAttribute("y", String(padded.top))
              spotlight.setAttribute("width", String(padded.width))
              spotlight.setAttribute("height", String(padded.height))
            })
          )
          Option.map(Option.fromNullishOr(element.querySelector("[data-tour-hit]")), (hit) =>
            hit.setAttribute("d", overlayHitPath(rect, padding, corner))
          )
        }
        place()
        const observer = new ResizeObserver(place)
        Option.map(target, (found) => observer.observe(found))
        window.addEventListener("scroll", place, { capture: true, passive: true })
        window.addEventListener("resize", place)

        return () => {
          observer.disconnect()
          window.removeEventListener("scroll", place, { capture: true })
          window.removeEventListener("resize", place)
        }
      }),
      (stop) => Effect.sync(stop)
    )

    return Message.CompletedMount()
  })
})

const AnchorToTarget = Mount.define("TourAnchor", {
  args: {
    targetId: Schema.String,
    placement: TourPosition,
    gap: Schema.Finite,
    offset: Schema.Finite,
    focus: Schema.Boolean
  },
  messages: [Message.CompletedMount],
  execute: Effect.fn("TourAnchor")(function* ({ element, targetId, placement, gap, offset, focus }) {
    yield* Effect.acquireRelease(
      Effect.sync(() =>
        anchorSetup(element, {
          buttonId: targetId,
          anchor: { placement, gap, offset, padding: 8, portal: false },
          interceptTab: false,
          focusAfterPosition: focus
        })
      ),
      (cleanup) => Effect.sync(cleanup)
    )

    return Message.CompletedMount()
  })
})

const stepEasing = "cubic-bezier(0.16, 1, 0.3, 1)"

const stepTransition = (moving: boolean, duration: number): string =>
  moving ? `top ${duration}ms ${stepEasing}, left ${duration}ms ${stepEasing}` : ""

const moveBetweenSteps = (tooltip: HTMLElement, duration: number): (() => void) => {
  tooltip.style.setProperty("transition", stepTransition(tooltip.hasAttribute("data-placed"), duration))
  tooltip.setAttribute("data-placed", "")
  const timer = window.setTimeout(() => tooltip.style.removeProperty("transition"), duration)

  return () => window.clearTimeout(timer)
}

const centerTooltip = (tooltip: HTMLElement, focus: boolean): (() => void) => {
  tooltip.style.removeProperty("left")
  tooltip.style.removeProperty("top")
  tooltip.style.removeProperty("position")
  const frame = requestAnimationFrame(() => (focus ? tooltip.focus({ preventScroll: true }) : undefined))

  return () => cancelAnimationFrame(frame)
}

const PlaceStep = Mount.define("TourPlaceStep", {
  args: {
    targetId: Schema.String,
    placement: TourPosition,
    focus: Schema.Boolean,
    centered: Schema.Boolean,
    duration: Schema.Finite
  },
  messages: [Message.CompletedMount],
  execute: Effect.fn("TourPlaceStep")(function* ({ element, targetId, placement, focus, centered, duration }) {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const releases = Option.toArray(Option.fromNullishOr(element.parentElement)).map((tooltip) => {
          const settle = moveBetweenSteps(tooltip, duration)
          const release = centered
            ? centerTooltip(tooltip, focus)
            : anchorSetup(tooltip, {
                buttonId: targetId,
                anchor: { placement, gap: 12, offset: 0, padding: 8, portal: false },
                interceptTab: false,
                focusAfterPosition: focus
              })

          return () => {
            settle()
            release()
          }
        })

        return () => releases.forEach((release) => release())
      }),
      (cleanup) => Effect.sync(cleanup)
    )

    return Message.CompletedMount()
  })
})

const Keyframe = Schema.Record(Schema.String, Schema.String)

const TooltipLifecycle = Mount.define("TourTooltipLifecycle", {
  args: { from: Keyframe, to: Keyframe, duration: Schema.Finite, easing: Schema.String },
  messages: [Message.CompletedMount],
  execute: Effect.fn("TourTooltipLifecycle")(function* ({ element, from, to, duration, easing }) {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const previous = Option.fromNullishOr(document.activeElement)
        element.animate([from, to], { duration, easing })

        return () =>
          Option.filter(previous, isHtmlElement).pipe(
            Option.filter((found) => found.isConnected),
            Option.map((found) => found.focus({ preventScroll: true }))
          )
      }),
      (restore) => Effect.sync(restore)
    )

    return Message.CompletedMount()
  })
})

const isHtmlElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const pulse = stylex.keyframes({
  "0%": { transform: "scale(0.8)", opacity: 0.3 },
  "50%": { transform: "scale(1)", opacity: 0 },
  "100%": { transform: "scale(0.8)", opacity: 0.3 }
})

const fade = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })

const styles = stylex.create({
  root: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: tourVars.zIndex },
  overlay: {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "auto",
    animationName: fade,
    animationDuration: "200ms",
    animationTimingFunction: "ease"
  },
  overlayInteraction: { pointerEvents: "none" },
  hit: { pointerEvents: "auto" },
  tooltip: {
    position: "absolute",
    pointerEvents: "auto",
    padding: space.md,
    borderRadius: { default: radius.default },
    boxShadow: tourVars.tooltipShadow,
    zIndex: 1,
    boxSizing: "border-box",
    width: `min(${tourVars.maxWidth}, calc(100vw - 16px))`,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark7})`,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    outline: "none"
  },
  centered: {
    position: "fixed",
    top: "50%",
    left: "50%",
    translate: "-50% -50%",
    width: tourVars.maxWidth,
    maxWidth: "calc(100% - 16px)"
  },
  title: {
    margin: 0,
    fontWeight: 600,
    fontSize: fontSize.md,
    lineHeight: 1.4,
    marginBottom: space.xs
  },
  body: { fontSize: fontSize.sm, lineHeight: 1.55 },
  navigation: { marginTop: space.md },
  closeButton: { position: "absolute", top: space.xs, insetInlineEnd: space.xs },
  stepCounter: { fontSize: fontSize.sm, color: `light-dark(${palette.gray6}, ${palette.dark2})` },
  beacon: {
    position: "absolute",
    pointerEvents: "auto",
    width: tourVars.beaconSize,
    height: tourVars.beaconSize,
    borderRadius: "50%",
    backgroundColor: tourVars.color,
    borderWidth: 0,
    padding: 0,
    cursor: "pointer",
    zIndex: 1
  },
  beaconPulse: {
    position: "absolute",
    inset: `calc(${tourVars.beaconSize} * -0.35)`,
    borderRadius: "50%",
    backgroundColor: tourVars.color,
    opacity: 0.3,
    animationName: pulse,
    animationDuration: "1.5s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    pointerEvents: "none"
  },
  frame: { display: "contents" }
})

type View<M> = {
  readonly h: HtmlBuilder<M>
  readonly props: TourProps<M>
  readonly getStyles: GetStyles<M, TourPart>
  readonly labels: TourLabels
  readonly lift: (message: Message) => M
  readonly button: ReturnType<typeof Button>
  readonly closeButton: ReturnType<typeof CloseButton>
  readonly group: ReturnType<typeof Group>
  readonly parts: { readonly navigationButton: ReadonlyArray<Sx>; readonly closeButton: ReadonlyArray<Sx> }
}

const titleId = (model: Model) => `${model.id}-title`

const bodyId = (model: Model) => `${model.id}-body`

const overlayView = <M>(view: View<M>, step: TourStep, index: number): Html => {
  const { h, props, getStyles, lift } = view
  const padding = step.spotlightPadding ?? props.spotlightPadding ?? 8
  const corner = step.spotlightRadius ?? props.spotlightRadius ?? 4
  const interaction = props.withOverlayInteraction === true
  const maskId = `${props.model.id}-mask`

  return h.keyed("svg")(
    `${props.model.id}-overlay-${index}`,
    [
      ...getStyles("overlay", styles.overlay, interaction && styles.overlayInteraction),
      h.Role("presentation"),
      ...(interaction ? [h.DataAttribute("with-overlay-interaction", "")] : []),
      ...(props.closeOnOverlayClick === true ? [h.OnClick(lift(Message.Closed()))] : []),
      h.OnMount(
        Mount.mapMessage(
          TrackSpotlight({
            targetId: step.target ?? "",
            padding,
            radius: corner,
            scroll: props.withScrollIntoView !== false && step.target !== undefined,
            behavior: props.scrollIntoViewOptions?.behavior ?? "instant",
            block: props.scrollIntoViewOptions?.block ?? "center"
          }),
          lift
        )
      )
    ],
    [
      h.defs(
        [],
        [
          h.mask(
            [h.Id(maskId)],
            [
              h.rect([h.Attribute("width", "100%"), h.Attribute("height", "100%"), h.Attribute("fill", "white")], []),
              ...(step.target === undefined
                ? []
                : [
                    h.rect(
                      [
                        ...getStyles("spotlight"),
                        h.DataAttribute("tour-spotlight", ""),
                        h.Attribute("rx", String(corner)),
                        h.Attribute("ry", String(corner)),
                        h.Attribute("fill", "black")
                      ],
                      []
                    )
                  ])
            ]
          )
        ]
      ),
      h.rect(
        [
          h.Attribute("width", "100%"),
          h.Attribute("height", "100%"),
          h.Style({ fill: tourVars.overlayColor }),
          h.Attribute("mask", `url(#${maskId})`)
        ],
        []
      ),
      ...(interaction
        ? [
            h.path(
              [
                ...sx(h, styles.hit),
                h.DataAttribute("tour-hit", ""),
                h.Attribute("fill-rule", "evenodd"),
                h.Attribute("fill", "transparent")
              ],
              []
            )
          ]
        : [])
    ]
  )
}

const navigationView = <M>(view: View<M>, index: number): Html => {
  const { h, props, getStyles, labels, lift, button, group } = view
  const count = props.steps.length
  const last = index === count - 1
  const navigationButton = (label: string, message: Message, filled: boolean) =>
    button(h, {
      variant: filled ? "filled" : "default",
      size: "compact-sm",
      onClick: lift(message),
      ...(filled && props.color !== undefined ? { color: props.color } : {}),
      styles: { root: view.parts.navigationButton },
      attributes: { root: { "data-tour-navigation": "" } },
      children: [label]
    })

  return h.div(getStyles("navigation", styles.navigation), [
    group(h, {
      justify: "space-between",
      wrap: "nowrap",
      children: [
        navigationButton(labels.skip, Message.Closed(), false),
        h.span(
          [...getStyles("stepCounter", styles.stepCounter), h.AriaLive("polite")],
          [labels.stepCounter(index + 1, count)]
        ),
        group(h, {
          gap: "xs",
          wrap: "nowrap",
          children: [
            ...(index === 0 ? [] : [navigationButton(labels.back, Message.SetStep({ step: index - 1 }), false)]),
            last
              ? navigationButton(labels.close, Message.Closed(), true)
              : navigationButton(labels.next, Message.SetStep({ step: index + 1 }), true)
          ]
        })
      ]
    })
  ])
}

export type TourTooltipParts = {
  readonly step: TourStep
  readonly index: number
  readonly closeButton: Html | null
  readonly title: Html | null
  readonly body: Html | null
  readonly navigation: Html
}

const defaultTooltip = (parts: TourTooltipParts): ReadonlyArray<Html> =>
  [parts.closeButton, parts.title, parts.body, parts.navigation].filter((part) => part !== null)

const tooltipView = <M>(view: View<M>, step: TourStep, index: number, trapped: boolean): Html => {
  const { h, props, getStyles, labels, lift, closeButton } = view
  const centered = step.target === undefined
  const model = props.model
  const preset: TransitionStyles = transitions[props.transitionProps?.transition ?? "pop"]
  const lifecycle = TooltipLifecycle({
    from: { ...preset.common, ...preset.out },
    to: { ...preset.common, ...preset.in },
    duration: props.transitionProps?.duration ?? 200,
    easing: props.transitionProps?.timingFunction ?? "ease"
  })
  const parts: TourTooltipParts = {
    step,
    index,
    closeButton:
      props.withCloseButton === false
        ? null
        : closeButton(h, {
            label: labels.close,
            onClick: lift(Message.Closed()),
            styles: { root: [styles.closeButton, ...view.parts.closeButton] }
          }),
    title:
      step.title === undefined ? null : h.h3([...getStyles("title", styles.title), h.Id(titleId(model))], [step.title]),
    body:
      step.children === undefined
        ? null
        : h.div([...getStyles("body", styles.body), h.Id(bodyId(model))], step.children),
    navigation: navigationView(view, index)
  }
  const place = PlaceStep({
    targetId: step.target ?? "",
    placement: step.position ?? "bottom",
    focus: !trapped,
    centered,
    duration: props.stepTransitionDuration ?? 300
  })

  return h.keyed("div")(
    `${model.id}-tooltip`,
    [
      ...getStyles("tooltip", styles.tooltip, centered && styles.centered),
      h.Role("dialog"),
      h.Tabindex(-1),
      ...(step.title === undefined
        ? [h.AriaLabel(labels.stepCounter(index + 1, props.steps.length))]
        : [h.AriaLabelledBy(titleId(model))]),
      ...(step.children === undefined ? [] : [h.AriaDescribedBy(bodyId(model))]),
      ...(centered ? [h.DataAttribute("centered", "")] : []),
      h.OnMount(Mount.mapMessage(lifecycle, lift))
    ],
    [
      h.keyed("span")(`${model.id}-place-${index}`, [h.Hidden(true), h.OnMount(Mount.mapMessage(place, lift))], []),
      h.keyed("div")(
        `${model.id}-step-${index}`,
        [...sx(h, styles.frame), h.OnMount(Mount.mapMessage(WatchKeys({ targetId: step.target ?? "" }), lift))],
        [
          FocusTrap(h, {
            active: trapped,
            returnFocus: false,
            styles: { root: styles.frame },
            children: [FocusTrapInitialFocus(h), ...(props.renderTooltip ?? defaultTooltip)(parts)]
          })
        ]
      )
    ]
  )
}

const beaconLabel = (label: string, title: Child | undefined) =>
  Predicate.isString(title) ? `${label}: ${title}` : label

const beaconsView = <M>(view: View<M>): ReadonlyArray<Html> => {
  const { h, props, getStyles, labels, lift } = view

  return props.steps.flatMap((step, index) => {
    if (step.withBeacon === false || step.target === undefined) return []

    return [
      h.keyed("button")(
        `${props.model.id}-beacon-${index}`,
        [
          ...getStyles("beacon", styles.beacon),
          h.Type("button"),
          h.AriaLabel(beaconLabel(labels.beacon, step.title)),
          h.DataAttribute("tour-beacon", ""),
          h.OnClick(lift(Message.OpenedBeacon({ step: index }))),
          h.OnMount(
            Mount.mapMessage(
              AnchorToTarget({ targetId: step.target, placement: "top-end", gap: -4, offset: -4, focus: false }),
              lift
            )
          )
        ],
        [h.span([...getStyles("beaconPulse", styles.beaconPulse), h.AriaHidden(true)], [])]
      )
    ]
  })
}

export const Tour = (config: {
  readonly Tour?: TourConfig
  readonly Button?: ButtonConfig
  readonly Loader?: LoaderConfig
  readonly CloseButton?: CloseButtonConfig
  readonly Group?: GroupConfig
  readonly Portal?: PortalConfig
}) => {
  const portal = Portal(config)
  const button = Button(config)
  const closeButton = CloseButton(config)
  const group = Group(config)

  return <M>(h: HtmlBuilder<M>, input: TourProps<M>): Html => {
    const props = withDefaults(config.Tour, input)
    const getStyles = stylesApi<M, TourPart>(h, props, config.Tour, "root")
    const lift = props.toParentMessage
    const labels = { ...defaultLabels, ...props.labels }
    const merged = mergeStyles(["navigationButton", "closeButton"], config.Tour?.styles, props.styles)
    const parts = {
      navigationButton: props.unstyled === true ? [] : listOf(merged.navigationButton),
      closeButton: props.unstyled === true ? [] : listOf(merged.closeButton)
    }
    const view = { h, props, getStyles, labels, lift, button, closeButton, group, parts }
    const context = tourContext(props)
    const model = props.model
    const index = displayStep(model, context)
    const step = Option.fromNullishOr(props.steps[index])
    const shown = showsTooltip(model, context)
    const mode = props.mode ?? "guided"
    const overlay = Option.exists(step, (found) => found.withOverlay ?? props.withOverlay ?? true)
    const trapped = mode === "guided" && overlay && props.withOverlayInteraction !== true

    const root = h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setDefinedVars(
            [tourVars.zIndex, props.zIndex === undefined ? undefined : String(props.zIndex)],
            [tourVars.overlayColor, props.overlayColor],
            [tourVars.color, props.color === undefined ? undefined : themeColor(props.color)],
            [tourVars.tooltipShadow, props.tooltipShadow === undefined ? undefined : shadowValue(props.tooltipShadow)],
            [tourVars.maxWidth, props.maxWidth === undefined ? undefined : `${props.maxWidth}px`]
          )
        ),
        h.Id(model.id)
      ],
      model.active
        ? [
            ...(shown
              ? Option.toArray(step).flatMap((found) => [
                  ...(overlay ? [overlayView(view, found, index)] : []),
                  tooltipView(view, found, index, trapped)
                ])
              : []),
            ...(mode === "beacon" && model.beaconStep === null ? beaconsView(view) : [])
          ]
        : []
    )

    return props.withinPortal === false ? root : portal(h, { children: [root] })
  }
}
