import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { indicatorVars } from "./FloatingIndicator.stylex.ts"

export type FloatingIndicatorPart = "root"

export type FloatingIndicatorOptions = { readonly transitionDuration?: number | string }

export type FloatingIndicatorProps = FloatingIndicatorOptions &
  StylesApiProps<FloatingIndicatorPart> & {
    readonly anchor: string
    readonly target: boolean
  }

export type FloatingIndicatorConfig = ComponentConfig<FloatingIndicatorOptions, FloatingIndicatorPart>

const styles = stylex.create({
  root: {
    positionAnchor: indicatorVars.anchor,
    top: "anchor(top)",
    left: "anchor(left)",
    width: "anchor-size(width)",
    height: "anchor-size(height)",
    position: "absolute",
    zIndex: 0,
    transitionProperty: "top, left, width, height",
    transitionTimingFunction: "ease",
    transitionDuration: indicatorVars.duration
  },
  hidden: { display: "none" },
  target: { anchorName: indicatorVars.anchor }
})

const anchorName = (anchor: string) => `--floating-indicator-${anchor}`

export const floatingIndicatorTarget = (anchor: string): ReadonlyArray<Sx> => [
  styles.target,
  setVars([indicatorVars.anchor, anchorName(anchor)])
]

export const FloatingIndicator =
  (config: { readonly FloatingIndicator?: FloatingIndicatorConfig }) =>
  <M>(h: HtmlBuilder<M>, input: FloatingIndicatorProps): Html => {
    const props = withDefaults(config.FloatingIndicator, input)
    const getStyles = stylesApi<M, FloatingIndicatorPart>(h, props, config.FloatingIndicator, "root")
    const duration = props.transitionDuration ?? 150

    return h.div([
      ...getStyles(
        "root",
        styles.root,
        !props.target && styles.hidden,
        setVars(
          [indicatorVars.anchor, anchorName(props.anchor)],
          [indicatorVars.duration, Predicate.isNumber(duration) ? `${duration}ms` : duration]
        )
      ),
      ...(props.target ? [h.DataAttribute("initialized", "")] : [h.DataAttribute("hidden", "")]),
      h.AriaHidden(true)
    ])
  }
