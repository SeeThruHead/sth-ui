import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { everyPoint, sizeValue, spacing } from "../../styles/styleProps.ts"
import type { Point, Responsive, StyleValue } from "../../styles/styleProps.ts"
import { setStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { shared } from "../../styles/shared.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { radius, shadow, space } from "../../theme/tokens.stylex.ts"
import { AccordionChevron } from "../Accordion/Accordion.ts"
import { engineFor, indicatorId, Message, canScrollNext, canScrollPrevious } from "./model.ts"
import type { CarouselContext, Model } from "./model.ts"
import { slideOffsets, valueAt } from "./engine.ts"
import { WatchCarousel } from "./gesture.ts"
import { carouselRules } from "./rules.ts"
import { carouselVars } from "./Carousel.stylex.ts"

export type CarouselPart =
  | "root"
  | "viewport"
  | "container"
  | "slide"
  | "controls"
  | "control"
  | "indicators"
  | "indicator"

export type CarouselOptions = {
  readonly controlSize?: number | string
  readonly controlsOffset?: StyleValue
  readonly slideSize?: Responsive<StyleValue>
  readonly slideGap?: Responsive<StyleValue>
  readonly orientation?: "horizontal" | "vertical"
  readonly type?: "media" | "container"
  readonly height?: number | string
  readonly includeGapInSize?: boolean
  readonly withControls?: boolean
  readonly withIndicators?: boolean
  readonly withKeyboardEvents?: boolean
  readonly draggable?: boolean
}

export type CarouselProps<M> = CarouselOptions &
  CarouselContext &
  StylesApiProps<CarouselPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly slides: ReadonlyArray<ReadonlyArray<Child>>
    readonly nextControlIcon?: Child
    readonly previousControlIcon?: Child
    readonly nextControlLabel?: string
    readonly previousControlLabel?: string
    readonly statusLabel?: (index: number, count: number) => string
    readonly slideLabel?: (index: number, count: number) => string
    readonly ariaLabel?: string
  }

export type CarouselConfig = ComponentConfig<CarouselOptions, CarouselPart>

const styles = stylex.create({
  root: { position: "relative" },
  viewport: { height: carouselVars.height, overflow: "hidden", touchAction: "pan-y pinch-zoom" },
  verticalViewport: { touchAction: "pan-x pinch-zoom" },
  containerType: { containerType: "inline-size", containerName: "carousel" },
  container: { display: "flex", flexDirection: "row", height: carouselVars.height, position: "relative" },
  vertical: { flexDirection: "column" },
  slide: { position: "relative", flexGrow: 0, flexShrink: 0, minWidth: 0 },
  controls: {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
    pointerEvents: "none"
  },
  controlsHorizontal: {
    insetInlineStart: 0,
    insetInlineEnd: 0,
    top: `calc(50% - ${carouselVars.controlSize} / 2)`,
    flexDirection: "row",
    paddingInline: carouselVars.controlsOffset
  },
  controlsVertical: {
    insetInlineStart: `calc(50% - ${carouselVars.controlSize} / 2)`,
    top: 0,
    bottom: 0,
    flexDirection: "column",
    paddingBlock: carouselVars.controlsOffset
  },
  control: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minWidth: carouselVars.controlSize,
    minHeight: carouselVars.controlSize,
    padding: 0,
    borderRadius: carouselVars.controlSize,
    pointerEvents: "all",
    backgroundColor: palette.white,
    color: palette.black,
    boxShadow: shadow.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: palette.gray3,
    cursor: "pointer",
    opacity: { default: "light-dark(0.85, 0.65)", ":hover": 1 },
    transitionProperty: "opacity",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease"
  },
  indicators: { position: "absolute", display: "flex", justifyContent: "center", gap: "8px", pointerEvents: "none" },
  indicatorsHorizontal: { bottom: space.md, insetInlineStart: 0, insetInlineEnd: 0, flexDirection: "row" },
  indicatorsVertical: { bottom: 0, top: 0, insetInlineEnd: space.md, flexDirection: "column" },
  indicator: {
    pointerEvents: "all",
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.xl,
    boxShadow: shadow.sm,
    opacity: { default: 0.6, ":hover": 1 },
    backgroundColor: palette.white,
    cursor: "pointer",
    width: "25px",
    height: "5px"
  },
  indicatorVertical: { width: "5px", height: "25px" },
  active: { opacity: { default: 1, ":hover": 1 } }
})

const varsFor = (group: "size" | "gap", value: Responsive<StyleValue>, resolve: (value: StyleValue) => string) =>
  everyPoint(value).map(([point, chosen]: readonly [Point, StyleValue]): readonly [string, string] => [
    carouselVars[`${group}_${point}`],
    resolve(chosen)
  ])

const defaultSlideLabel = (index: number, count: number) => `${index} of ${count}`

const defaultStatus = (index: number, count: number) => `Slide ${index} of ${count}`

const rotations = {
  horizontal: { previous: 90, next: -90 },
  vertical: { previous: -180, next: 0 }
} as const

const translate = (vertical: boolean, offset: number) =>
  vertical ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)`

const ruleKind = (container: boolean) => (container ? "Container" : "Media")

const ruleAxis = (vertical: boolean) => (vertical ? "Block" : "Inline")

export const Carousel =
  (config: { readonly Carousel?: CarouselConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CarouselProps<M>): Html => {
    const props = withDefaults(config.Carousel, input)
    const getStyles = stylesApi<M, CarouselPart>(h, props, config.Carousel, "root")
    const send = props.toParentMessage
    const model = props.model
    const vertical = props.orientation === "vertical"
    const container = props.type === "container"
    const includeGap = props.includeGapInSize ?? true
    const count = Option.match(engineFor(model, props), {
      onNone: () => 0,
      onSome: (engine) => engine.scrollSnaps.length
    })
    const offsets = Option.match(engineFor(model, props), {
      onNone: () => props.slides.map(() => 0),
      onSome: (engine) => slideOffsets(engine, props.slides.length, model.location)
    })
    const keys =
      (props.withKeyboardEvents ?? true)
        ? [
            h.OnKeyDownPreventDefault((key) => {
              if (key === "ArrowRight") return Option.some(send(Message.RequestedNext()))
              if (key === "ArrowLeft") return Option.some(send(Message.RequestedPrevious()))
              if (key === "Home") return Option.some(send(Message.RequestedSlide({ index: 0 })))

              return key === "End" ? Option.some(send(Message.RequestedSlide({ index: count - 1 }))) : Option.none()
            })
          ]
        : []
    const orientation = vertical ? "vertical" : "horizontal"
    const gapRule = carouselRules[`${includeGap ? "padding" : "margin"}${ruleAxis(vertical)}${ruleKind(container)}`]
    const pullRule = includeGap ? carouselRules[`pull${ruleAxis(vertical)}${ruleKind(container)}`] : null
    const control = (direction: "next" | "previous") => {
      const enabled = direction === "next" ? canScrollNext(model, props) : canScrollPrevious(model, props)
      const icon = direction === "next" ? props.nextControlIcon : props.previousControlIcon

      return h.button(
        [
          ...getStyles("control", styles.control, shared.focusRing),
          h.Type("button"),
          h.AriaControls(model.id),
          h.AriaLabel(
            direction === "next"
              ? (props.nextControlLabel ?? "Next slide")
              : (props.previousControlLabel ?? "Previous slide")
          ),
          h.AriaDisabled(!enabled),
          h.Tabindex(enabled ? 0 : -1),
          h.DataAttribute("type", direction),
          ...(enabled ? [] : [h.DataAttribute("inactive", "")]),
          h.OnClick(send(direction === "next" ? Message.RequestedNext() : Message.RequestedPrevious())),
          ...keys
        ],
        [
          icon ??
            h.span(
              [h.Style({ display: "flex", transform: `rotate(${rotations[orientation][direction]}deg)` })],
              [AccordionChevron(h, 16)]
            )
        ]
      )
    }
    const indicator = (index: number) =>
      h.button(
        [
          ...getStyles(
            "indicator",
            styles.indicator,
            vertical && styles.indicatorVertical,
            index === model.index && styles.active,
            shared.focusRing
          ),
          h.Id(indicatorId(model, index)),
          h.Type("button"),
          h.Role("tab"),
          h.AriaLabel(`Go to slide ${index + 1}`),
          h.AriaSelected(index === model.index),
          h.Tabindex(index === model.index ? 0 : -1),
          ...(index === model.index ? [h.DataAttribute("active", "")] : []),
          h.DataAttribute("orientation", vertical ? "vertical" : "horizontal"),
          h.OnClick(send(Message.RequestedSlide({ index }))),
          h.OnKeyDownPreventDefault((key) =>
            ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)
              ? Option.some(send(Message.PressedIndicatorKey({ index, key, vertical })))
              : Option.none()
          )
        ],
        []
      )

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setVars(
            ...varsFor("size", props.slideSize ?? "100%", sizeValue),
            ...varsFor("gap", props.slideGap ?? 0, spacing),
            [carouselVars.height, props.height === undefined ? "auto" : sizeValue(props.height)],
            [carouselVars.controlSize, sizeValue(props.controlSize ?? 26)],
            [carouselVars.controlsOffset, spacing(props.controlsOffset ?? "sm")]
          )
        ),
        h.Id(model.id),
        h.Role("region"),
        h.AriaRoleDescription("carousel"),
        ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
        h.DataAttribute("orientation", vertical ? "vertical" : "horizontal"),
        ...(includeGap ? [h.DataAttribute("include-gap-in-size", "")] : [])
      ],
      [
        h.div(
          [...sx(h, shared.visuallyHidden), h.Role("status"), h.AriaLive("polite"), h.AriaAtomic(true)],
          [count > 0 ? (props.statusLabel ?? defaultStatus)(model.index + 1, count) : ""]
        ),
        ...((props.withControls ?? true)
          ? [
              h.div(
                [
                  ...getStyles(
                    "controls",
                    styles.controls,
                    vertical ? styles.controlsVertical : styles.controlsHorizontal
                  ),
                  h.DataAttribute("orientation", vertical ? "vertical" : "horizontal")
                ],
                [control("previous"), control("next")]
              )
            ]
          : []),
        h.div(
          [
            ...getStyles(
              "viewport",
              styles.viewport,
              vertical && styles.verticalViewport,
              container && styles.containerType
            ),
            h.DataAttribute("type", container ? "container" : "media"),
            h.OnMount(Mount.mapMessage(WatchCarousel({ vertical, draggable: props.draggable ?? true }), send)),
            ...keys
          ],
          [
            h.div(
              [
                ...getStyles(
                  "container",
                  styles.container,
                  vertical && styles.vertical,
                  pullRule,
                  setStyle(
                    ["transform", translate(vertical, model.location)],
                    [
                      "transition",
                      model.animating ? `transform ${props.duration ?? 400}ms cubic-bezier(0.25, 1, 0.5, 1)` : "none"
                    ]
                  )
                ),
                h.DataAttribute("orientation", vertical ? "vertical" : "horizontal")
              ],
              props.slides.map((children, index) =>
                h.div(
                  [
                    ...getStyles(
                      "slide",
                      styles.slide,
                      carouselRules[`size${ruleKind(container)}`],
                      gapRule,
                      setStyle(["transform", translate(vertical, valueAt(offsets, index))])
                    ),
                    h.Role("group"),
                    h.AriaRoleDescription("slide"),
                    h.AriaLabel((props.slideLabel ?? defaultSlideLabel)(index + 1, props.slides.length)),
                    h.DataAttribute("orientation", vertical ? "vertical" : "horizontal")
                  ],
                  children
                )
              )
            )
          ]
        ),
        ...((props.withIndicators ?? false)
          ? [
              h.div(
                [
                  ...getStyles(
                    "indicators",
                    styles.indicators,
                    vertical ? styles.indicatorsVertical : styles.indicatorsHorizontal
                  ),
                  h.Role("tablist"),
                  h.AriaLabel("Slides"),
                  h.DataAttribute("orientation", vertical ? "vertical" : "horizontal")
                ],
                Array.from({ length: count }, (_, index) => indicator(index))
              )
            ]
          : [])
      ]
    )
  }
