import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { colors } from "../../theme/tokens.stylex.ts"
import { marqueeVars } from "./Marquee.stylex.ts"

export type MarqueePart = "root" | "content" | "group"

export type MarqueeOrientation = "horizontal" | "vertical"

export type MarqueeOptions = {
  readonly reverse?: boolean
  readonly pauseOnHover?: boolean
  readonly orientation?: MarqueeOrientation
  readonly repeat?: number
  readonly duration?: number
  readonly gap?: StyleValue
  readonly fadeEdges?: boolean
  readonly fadeEdgeColor?: string
  readonly fadeEdgeSize?: string
}

export type MarqueeProps = MarqueeOptions & StylesApiProps<MarqueePart> & { readonly children: ReadonlyArray<Child> }

export type MarqueeConfig = ComponentConfig<MarqueeOptions, MarqueePart>

const travel = `calc(-100% / ${marqueeVars.repeat} - ${marqueeVars.gap} / ${marqueeVars.repeat})`

const horizontal = stylex.keyframes({
  from: { transform: "translateX(0)" },
  to: { transform: `translateX(${travel})` }
})

const vertical = stylex.keyframes({
  from: { transform: "translateY(0)" },
  to: { transform: `translateY(${travel})` }
})

const fade = {
  content: "''",
  position: "absolute",
  zIndex: 1,
  pointerEvents: "none"
} as const

const styles = stylex.create({
  root: {
    [marqueeVars.fadeColor]: colors.body,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    maxHeight: "100%",
    maxWidth: "100%"
  },
  row: { flexDirection: "row" },
  column: { flexDirection: "column" },
  fadeRow: {
    "::before": {
      ...fade,
      top: 0,
      bottom: 0,
      left: 0,
      width: marqueeVars.fadeSize,
      backgroundImage: `linear-gradient(to right, ${marqueeVars.fadeColor}, transparent)`
    },
    "::after": {
      ...fade,
      top: 0,
      bottom: 0,
      right: 0,
      width: marqueeVars.fadeSize,
      backgroundImage: `linear-gradient(to left, ${marqueeVars.fadeColor}, transparent)`
    }
  },
  fadeColumn: {
    "::before": {
      ...fade,
      left: 0,
      right: 0,
      top: 0,
      height: marqueeVars.fadeSize,
      backgroundImage: `linear-gradient(to bottom, ${marqueeVars.fadeColor}, transparent)`
    },
    "::after": {
      ...fade,
      left: 0,
      right: 0,
      bottom: 0,
      height: marqueeVars.fadeSize,
      backgroundImage: `linear-gradient(to top, ${marqueeVars.fadeColor}, transparent)`
    }
  },
  content: {
    display: "flex",
    gap: marqueeVars.gap,
    animationDuration: marqueeVars.duration,
    animationTimingFunction: "linear",
    animationIterationCount: "infinite"
  },
  contentRow: { flexDirection: "row", animationName: horizontal },
  contentColumn: { flexDirection: "column", animationName: vertical },
  reverse: { animationDirection: "reverse" },
  pauseOnHover: { animationPlayState: { default: null, [stylex.when.ancestor(":is(:hover)")]: "paused" } },
  group: { display: "flex", flexShrink: 0, gap: marqueeVars.gap }
})

export const Marquee =
  (config: { readonly Marquee?: MarqueeConfig }) =>
  <M>(h: HtmlBuilder<M>, input: MarqueeProps): Html => {
    const props = withDefaults(config.Marquee, input)
    const getStyles = stylesApi<M, MarqueePart>(h, props, config.Marquee, "root")
    const orientation = props.orientation ?? "horizontal"
    const row = orientation === "horizontal"
    const fadeEdges = props.fadeEdges !== false
    const repeat = props.repeat ?? 4

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          row ? styles.row : styles.column,
          fadeEdges && (row ? styles.fadeRow : styles.fadeColumn),
          stylex.defaultMarker(),
          setVars(
            [marqueeVars.duration, `${props.duration ?? 100000}ms`],
            [marqueeVars.gap, spacing(props.gap ?? "md")],
            [marqueeVars.repeat, String(repeat)]
          ),
          setDefinedVars([marqueeVars.fadeColor, props.fadeEdgeColor], [marqueeVars.fadeSize, props.fadeEdgeSize])
        ),
        h.DataAttribute("orientation", orientation),
        ...(props.reverse === true ? [h.DataAttribute("reverse", "")] : []),
        ...(props.pauseOnHover === true ? [h.DataAttribute("pause-on-hover", "")] : []),
        ...(fadeEdges ? [h.DataAttribute("fade-edges", "")] : [])
      ],
      [
        h.div(
          getStyles(
            "content",
            styles.content,
            row ? styles.contentRow : styles.contentColumn,
            props.reverse === true && styles.reverse,
            props.pauseOnHover === true && styles.pauseOnHover
          ),
          Array.from({ length: repeat }, (_, index) =>
            h.div(
              [
                ...getStyles("group", styles.group, row ? styles.row : styles.column),
                ...(index > 0 ? [h.AriaHidden(true)] : [])
              ],
              props.children
            )
          )
        )
      ]
    )
  }
