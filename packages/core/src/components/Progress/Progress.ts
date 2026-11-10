import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { contrastColor } from "../../theme/contrast.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, radius } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { progressVars } from "./Progress.stylex.ts"

export type ProgressPart = "root" | "section" | "label"

export type ProgressSize = keyof typeof sizes

export type ProgressSection = {
  readonly value: number
  readonly color?: string
  readonly label?: Child
  readonly ariaLabel?: string
  readonly striped?: boolean
  readonly animated?: boolean
  readonly withAria?: boolean
}

export type ProgressOptions = {
  readonly size?: ProgressSize | number
  readonly radius?: StyleValue
  readonly transitionDuration?: number
  readonly orientation?: "horizontal" | "vertical"
  readonly autoContrast?: boolean
}

export type ProgressRootProps = ProgressOptions &
  StylesApiProps<ProgressPart> & { readonly sections: ReadonlyArray<ProgressSection> }

export type ProgressProps = ProgressOptions &
  StylesApiProps<ProgressPart> &
  Omit<ProgressSection, "label" | "ariaLabel"> & { readonly label?: string }

export type ProgressConfig = ComponentConfig<ProgressOptions, ProgressPart>

const stripes = stylex.keyframes({ "0%": { backgroundPosition: "0 0" }, "100%": { backgroundPosition: "40px 0" } })

const stripesVertical = stylex.keyframes({
  "0%": { backgroundPosition: "0 0" },
  "100%": { backgroundPosition: "0 40px" }
})

const stripeStops =
  "rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent"

const sizes = stylex.create({
  xs: { [progressVars.size]: "3px" },
  sm: { [progressVars.size]: "5px" },
  md: { [progressVars.size]: "8px" },
  lg: { [progressVars.size]: "12px" },
  xl: { [progressVars.size]: "16px" }
})

const styles = stylex.create({
  root: {
    [progressVars.radius]: radius.default,
    position: "relative",
    height: progressVars.size,
    borderRadius: progressVars.radius,
    overflow: "hidden",
    display: "flex",
    backgroundColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  },
  vertical: { height: "auto", width: progressVars.size, flexDirection: "column-reverse" },
  section: {
    backgroundColor: progressVars.sectionColor,
    height: "100%",
    width: progressVars.sectionSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundSize: "20px 20px",
    transitionProperty: "width",
    transitionDuration: progressVars.duration,
    transitionTimingFunction: "ease",
    borderRadius: 0
  },
  sectionVertical: { width: "100%", height: progressVars.sectionSize, transitionProperty: "height" },
  striped: { backgroundImage: `linear-gradient(45deg, ${stripeStops})` },
  stripedVertical: { backgroundImage: `linear-gradient(135deg, ${stripeStops})` },
  animated: {
    animationName: stripes,
    animationDuration: "1s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite"
  },
  animatedVertical: { animationName: stripesVertical },
  firstRow: { borderStartStartRadius: progressVars.radius, borderEndStartRadius: progressVars.radius },
  lastRow: { borderStartEndRadius: progressVars.radius, borderEndEndRadius: progressVars.radius },
  firstColumn: { borderEndStartRadius: progressVars.radius, borderEndEndRadius: progressVars.radius },
  lastColumn: { borderStartStartRadius: progressVars.radius, borderStartEndRadius: progressVars.radius },
  label: {
    color: progressVars.labelColor,
    fontWeight: "bold",
    userSelect: "none",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    fontSize: `min(calc(${progressVars.size} * 0.65), 1.125rem)`,
    lineHeight: 1,
    paddingInline: "4px"
  },
  labelVertical: { writingMode: "vertical-rl" }
})

export const ProgressRoot =
  (config: { readonly Progress?: ProgressConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ProgressRootProps): Html => {
    const props = withDefaults(config.Progress, input)
    const getStyles = stylesApi<M, ProgressPart>(h, props, config.Progress, "root")
    const vertical = props.orientation === "vertical"
    const size = props.size ?? "md"
    const last = props.sections.length - 1
    const section = (entry: ProgressSection, index: number) => {
      const striped = entry.striped === true || entry.animated === true
      const color = entry.color === undefined ? accent.filled : themeColor(entry.color)

      return h.div(
        [
          ...getStyles(
            "section",
            styles.section,
            vertical && styles.sectionVertical,
            striped && (vertical ? styles.stripedVertical : styles.striped),
            entry.animated === true && styles.animated,
            entry.animated === true && vertical && styles.animatedVertical,
            index === 0 && (vertical ? styles.firstColumn : styles.firstRow),
            index === last && index > 0 && (vertical ? styles.lastColumn : styles.lastRow),
            setVars([progressVars.sectionSize, `${entry.value}%`], [progressVars.sectionColor, color]),
            setDefinedVars([progressVars.labelColor, props.autoContrast === true ? contrastColor(color) : undefined])
          ),
          ...(entry.withAria === false
            ? []
            : [
                h.Role("progressbar"),
                h.Attribute("aria-valuemax", "100"),
                h.Attribute("aria-valuemin", "0"),
                h.Attribute("aria-valuenow", String(entry.value)),
                h.Attribute("aria-valuetext", `${entry.value}%`)
              ]),
          ...(entry.ariaLabel === undefined ? [] : [h.AriaLabel(entry.ariaLabel)]),
          ...(striped ? [h.DataAttribute("striped", "")] : []),
          ...(entry.animated === true ? [h.DataAttribute("animated", "")] : [])
        ],
        entry.label === undefined
          ? []
          : [h.div(getStyles("label", styles.label, vertical && styles.labelVertical), [entry.label])]
      )
    }

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          vertical && styles.vertical,
          Predicate.isNumber(size) ? setVars([progressVars.size, rem(size)]) : sizes[size],
          setDefinedVars(
            [progressVars.radius, mapDefined(props.radius, radiusValue)],
            [progressVars.duration, mapDefined(props.transitionDuration, (duration) => `${duration}ms`)]
          )
        ),
        h.DataAttribute("orientation", vertical ? "vertical" : "horizontal")
      ],
      props.sections.map(section)
    )
  }

export const Progress = (config: { readonly Progress?: ProgressConfig }) => {
  const root = ProgressRoot(config)

  return <M>(h: HtmlBuilder<M>, props: ProgressProps): Html => {
    const { value, color, striped, animated, withAria, label, ...rest } = props

    return root<M>(h, {
      ...rest,
      sections: [
        {
          value,
          ...(color === undefined ? {} : { color }),
          ...(striped === undefined ? {} : { striped }),
          ...(animated === undefined ? {} : { animated }),
          ...(withAria === undefined ? {} : { withAria }),
          ...(label === undefined ? {} : { ariaLabel: label })
        }
      ]
    })
  }
}
