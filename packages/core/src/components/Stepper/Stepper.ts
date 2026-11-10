import * as stylex from "@stylexjs/stylex"
import { Option, Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { checkIconPath } from "../Combobox/Combobox.ts"
import { Loader } from "../Loader/Loader.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { stepperVars } from "./Stepper.stylex.ts"

export type StepperPart =
  | "root"
  | "steps"
  | "separator"
  | "content"
  | "step"
  | "stepWrapper"
  | "stepIcon"
  | "stepIconContent"
  | "stepCompletedIcon"
  | "stepBody"
  | "stepLabel"
  | "stepDescription"
  | "stepLoader"
  | "verticalSeparator"

export type StepFragment = Child | ((step: number) => Child)

export type StepperSize = "xs" | "sm" | "md" | "lg" | "xl"

export type StepperStep = {
  readonly label?: StepFragment
  readonly description?: StepFragment
  readonly icon?: StepFragment
  readonly completedIcon?: StepFragment
  readonly progressIcon?: StepFragment
  readonly color?: string
  readonly withIcon?: boolean
  readonly loading?: boolean
  readonly allowStepSelect?: boolean
  readonly iconPosition?: "left" | "right"
  readonly ariaLabel?: string
  readonly children?: ReadonlyArray<Child>
}

export type StepperOptions = {
  readonly color?: string
  readonly iconSize?: number | string
  readonly contentPadding?: StyleValue
  readonly orientation?: "horizontal" | "vertical"
  readonly iconPosition?: "left" | "right"
  readonly size?: StepperSize
  readonly radius?: StyleValue
  readonly allowNextStepsSelect?: boolean
  readonly wrap?: boolean
  readonly labelPosition?: "right" | "bottom"
  readonly autoContrast?: boolean
  readonly keepMounted?: boolean
}

export type StepperProps<M> = StepperOptions &
  StylesApiProps<StepperPart> & {
    readonly active: number
    readonly steps: ReadonlyArray<StepperStep>
    readonly completed?: ReadonlyArray<Child>
    readonly onStepClick?: (step: number) => M
    readonly icon?: StepFragment
    readonly completedIcon?: StepFragment
    readonly progressIcon?: StepFragment
  }

export type StepperConfig = ComponentConfig<StepperOptions, StepperPart>

type StepState = "stepInactive" | "stepProgress" | "stepCompleted"

const sizes = stylex.create({
  xs: { [stepperVars.iconSize]: "34px", [stepperVars.fz]: fontSize.xs, [stepperVars.spacing]: space.xs },
  sm: { [stepperVars.iconSize]: "36px", [stepperVars.fz]: fontSize.sm, [stepperVars.spacing]: space.sm },
  md: { [stepperVars.iconSize]: "42px", [stepperVars.fz]: fontSize.md, [stepperVars.spacing]: space.md },
  lg: { [stepperVars.iconSize]: "48px", [stepperVars.fz]: fontSize.lg, [stepperVars.spacing]: space.lg },
  xl: { [stepperVars.iconSize]: "52px", [stepperVars.fz]: fontSize.xl, [stepperVars.spacing]: space.xl }
})

const pop = stylex.keyframes({
  from: { opacity: 0, transform: "scale(.9) translateY(10px)" },
  to: { opacity: 1, transform: "none" }
})

const styles = stylex.create({
  root: {
    [stepperVars.contentPadding]: space.md,
    [stepperVars.outlineColor]: `light-dark(${palette.gray2}, ${palette.dark5})`,
    [stepperVars.stepColor]: accent.filled
  },
  steps: { display: "flex", flexWrap: "nowrap", alignItems: "center", flexDirection: "row" },
  wrapped: { flexWrap: "wrap", rowGap: space.md, columnGap: 0 },
  stepsBottom: { alignItems: "flex-start" },
  stepsVertical: { flexDirection: "column", alignItems: "flex-start" },
  stepsVerticalRight: { alignItems: "flex-end" },
  separator: {
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: "2px",
    marginInline: space.md,
    backgroundColor: stepperVars.outlineColor
  },
  separatorActive: { backgroundColor: accent.filled },
  separatorBottom: { marginTop: `calc((${stepperVars.iconSize} - 2px) / 2)` },
  content: { paddingTop: stepperVars.contentPadding },
  hidden: { display: "none" },
  step: {
    display: "flex",
    cursor: "default",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    color: "inherit",
    font: "inherit",
    textAlign: "start",
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: { default: null, ":focus-visible": "2px" }
  },
  clickable: { cursor: "pointer" },
  stepRight: { flexDirection: "row-reverse" },
  stepBottom: {
    flexDirection: "column",
    alignItems: "center",
    minWidth: stepperVars.iconSize,
    maxWidth: `calc(${stepperVars.iconSize} * 4)`,
    overflow: "visible"
  },
  stepVertical: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    minHeight: `calc(${stepperVars.iconSize} + ${space.xl} + ${space.xs} / 2)`,
    marginTop: `calc(${space.xs} / 2)`,
    overflow: "hidden"
  },
  stepVerticalFirst: { marginTop: 0 },
  stepVerticalLast: { minHeight: "auto" },
  stepWrapper: { position: "relative" },
  verticalSeparator: {
    top: `calc(${stepperVars.iconSize} + ${space.xs} / 2)`,
    insetInlineStart: `calc(${stepperVars.iconSize} / 2)`,
    height: "100vh",
    position: "absolute",
    borderInlineStartWidth: "2px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: stepperVars.outlineColor
  },
  verticalSeparatorActive: { borderInlineStartColor: accent.filled },
  stepIcon: {
    height: stepperVars.iconSize,
    width: stepperVars.iconSize,
    minHeight: stepperVars.iconSize,
    minWidth: stepperVars.iconSize,
    borderRadius: stepperVars.radius,
    fontSize: stepperVars.fz,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    fontWeight: 700,
    transitionProperty: "background-color, border-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: stepperVars.outlineColor,
    backgroundColor: stepperVars.outlineColor,
    color: `light-dark(${palette.gray7}, ${palette.dark1})`,
    boxSizing: "border-box"
  },
  stepIconProgress: { borderColor: accent.filled },
  stepIconCompleted: { color: colors.white, backgroundColor: accent.filled, borderColor: accent.filled },
  contrast: { color: accent.contrast },
  stepIconContent: { display: "flex" },
  stepCompletedIcon: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.white,
    animationName: pop,
    animationDuration: "200ms",
    animationTimingFunction: "ease"
  },
  check: { width: "60%", height: "60%" },
  stepBody: { display: "flex", flexDirection: "column", marginInlineStart: space.sm },
  stepBodyRight: { textAlign: "end", marginInlineStart: 0, marginInlineEnd: space.sm },
  stepBodyBottom: {
    alignItems: "center",
    textAlign: "center",
    marginInlineStart: 0,
    marginInlineEnd: 0,
    marginTop: `calc(${space.xs} / 2)`
  },
  stepLabel: { fontWeight: fontWeight.medium, fontSize: stepperVars.fz, lineHeight: 1 },
  stepDescription: {
    marginTop: `calc(${stepperVars.spacing} / 3)`,
    marginBottom: `calc(${stepperVars.spacing} / 3)`,
    fontSize: `calc(${stepperVars.fz} - 0.125rem)`,
    lineHeight: 1,
    color: colors.dimmed
  }
})

const fragment = (value: StepFragment, step: number): Child => (Predicate.isFunction(value) ? value(step) : value)

const optionalFragment = (value: StepFragment | undefined, step: number): Child | undefined =>
  value === undefined ? undefined : fragment(value, step)

const stateOf = (active: number, index: number): StepState => {
  if (active === index) return "stepProgress"

  return active > index ? "stepCompleted" : "stepInactive"
}

const allowed = <M>(props: StepperProps<M>, step: StepperStep, state: StepState): boolean => {
  if (step.allowStepSelect !== undefined) return step.allowStepSelect

  return state === "stepCompleted" || props.allowNextStepsSelect !== false
}

const selectable = <M>(
  props: StepperProps<M>,
  step: StepperStep,
  state: StepState
): Option.Option<(step: number) => M> =>
  Option.filter(Option.fromNullishOr(props.onStepClick), () => allowed(props, step, state))

export const Stepper = (config: { readonly Stepper?: StepperConfig; readonly Loader?: LoaderConfig }) => {
  const loader = Loader(config)

  return <M>(h: HtmlBuilder<M>, input: StepperProps<M>): Html => {
    const props = withDefaults(config.Stepper, input)
    const getStyles = stylesApi<M, StepperPart>(h, props, config.Stepper, "root")
    const orientation = props.orientation ?? "horizontal"
    const vertical = orientation === "vertical"
    const labelPosition = vertical ? undefined : (props.labelPosition ?? "right")
    const bottom = labelPosition === "bottom"
    const count = props.steps.length

    const stepView = (step: StepperStep, index: number): Html => {
      const state = stateOf(props.active, index)
      const progress = state === "stepProgress"
      const completed = state === "stepCompleted"
      const click = selectable(props, step, state)
      const clickable = Option.isSome(click)
      const iconPosition = step.iconPosition ?? props.iconPosition ?? "left"
      const right = iconPosition === "right"
      const label = optionalFragment(step.label, index)
      const description = optionalFragment(step.description, index)
      const icon = step.icon ?? props.icon ?? String(index + 1)
      const shownIcon = progress ? (step.progressIcon ?? props.progressIcon ?? icon) : icon
      const loaderOf = (color: string | undefined) =>
        loader(h, {
          size: `calc(${stepperVars.iconSize} / 2)`,
          ...(color === undefined ? {} : { color })
        })
      const stateAttributes = [
        ...(progress ? [h.DataAttribute("progress", "")] : []),
        ...(completed ? [h.DataAttribute("completed", "")] : [])
      ]

      return h.button(
        [
          ...getStyles(
            "step",
            ...accentStyle(step.color, customAccent),
            styles.step,
            clickable && styles.clickable,
            right && styles.stepRight,
            bottom && styles.stepBottom,
            vertical && styles.stepVertical,
            vertical && index === 0 && styles.stepVerticalFirst,
            vertical && index === count - 1 && styles.stepVerticalLast
          ),
          h.Type("button"),
          h.Tabindex(clickable ? 0 : -1),
          h.DataAttribute("icon-position", iconPosition),
          ...(labelPosition === undefined ? [] : [h.DataAttribute("label-position", labelPosition)]),
          ...(clickable ? [h.DataAttribute("allow-click", "")] : []),
          ...stateAttributes,
          ...(step.ariaLabel === undefined ? [] : [h.AriaLabel(step.ariaLabel)]),
          ...Option.toArray(click).map((handler) => h.OnClick(handler(index)))
        ],
        [
          ...(step.withIcon === false
            ? []
            : [
                h.span(getStyles("stepWrapper", styles.stepWrapper), [
                  h.span(
                    [
                      ...getStyles(
                        "stepIcon",
                        styles.stepIcon,
                        progress && styles.stepIconProgress,
                        completed && styles.stepIconCompleted,
                        completed && props.autoContrast === true && styles.contrast
                      ),
                      ...stateAttributes
                    ],
                    completed
                      ? [
                          h.span(
                            getStyles(
                              "stepCompletedIcon",
                              styles.stepCompletedIcon,
                              props.autoContrast === true && styles.contrast
                            ),
                            [
                              step.loading === true
                                ? loaderOf("white")
                                : (optionalFragment(step.completedIcon ?? props.completedIcon, index) ??
                                  h.svg(
                                    [
                                      ...sx(h, styles.check),
                                      h.Attribute("viewBox", "0 0 10 7"),
                                      h.Attribute("fill", "none"),
                                      h.AriaHidden(true)
                                    ],
                                    [h.path([h.Attribute("d", checkIconPath), h.Attribute("fill", "currentColor")], [])]
                                  ))
                            ]
                          )
                        ]
                      : [
                          h.span(getStyles("stepIconContent", styles.stepIconContent), [
                            step.loading === true ? loaderOf(step.color) : fragment(shownIcon, index)
                          ])
                        ]
                  ),
                  ...(vertical
                    ? [
                        h.span(
                          [
                            ...getStyles(
                              "verticalSeparator",
                              styles.verticalSeparator,
                              completed && styles.verticalSeparatorActive,
                              index === count - 1 && styles.hidden
                            ),
                            ...(completed ? [h.DataAttribute("active", "")] : [])
                          ],
                          []
                        )
                      ]
                    : [])
                ])
              ]),
          ...(label === undefined && description === undefined
            ? []
            : [
                h.span(
                  [
                    ...getStyles(
                      "stepBody",
                      styles.stepBody,
                      right && styles.stepBodyRight,
                      bottom && styles.stepBodyBottom
                    ),
                    h.DataAttribute("orientation", orientation),
                    h.DataAttribute("icon-position", iconPosition)
                  ],
                  [
                    ...(label === undefined ? [] : [h.span(getStyles("stepLabel", styles.stepLabel), [label])]),
                    ...(description === undefined
                      ? []
                      : [h.span(getStyles("stepDescription", styles.stepDescription), [description])])
                  ]
                )
              ])
        ]
      )
    }

    const items = props.steps.flatMap((step, index) => [
      stepView(step, index),
      ...(!vertical && index !== count - 1
        ? [
            h.div(
              [
                ...getStyles(
                  "separator",
                  styles.separator,
                  index < props.active && styles.separatorActive,
                  bottom && styles.separatorBottom
                ),
                ...(index < props.active ? [h.DataAttribute("active", "")] : []),
                h.DataAttribute("orientation", orientation)
              ],
              []
            )
          ]
        : [])
    ])
    const contents = [
      ...props.steps.map((step, index) => ({ shown: props.active === index, children: step.children ?? [] })),
      ...(props.completed === undefined ? [] : [{ shown: props.active > count - 1, children: props.completed }])
    ]
    const content =
      props.keepMounted === true
        ? contents.map((item) =>
            h.div(getStyles("content", styles.content, !item.shown && styles.hidden), item.children)
          )
        : contents
            .filter((item) => item.shown && item.children.length > 0)
            .map((item) => h.div(getStyles("content", styles.content), item.children))

    return h.div(
      getStyles(
        "root",
        ...accentStyle(props.color, customAccent),
        styles.root,
        sizes[props.size ?? "md"],
        setDefinedVars(
          [stepperVars.iconSize, mapDefined(props.iconSize, (size) => (Predicate.isNumber(size) ? rem(size) : size))],
          [stepperVars.contentPadding, mapDefined(props.contentPadding, spacing)],
          [stepperVars.radius, mapDefined(props.radius, radiusValue)]
        )
      ),
      [
        h.div(
          [
            ...getStyles(
              "steps",
              styles.steps,
              props.wrap !== false && !vertical && styles.wrapped,
              bottom && styles.stepsBottom,
              vertical && styles.stepsVertical,
              vertical && props.iconPosition === "right" && styles.stepsVerticalRight
            ),
            h.DataAttribute("orientation", orientation),
            h.DataAttribute("icon-position", props.iconPosition ?? "left"),
            ...(labelPosition === undefined ? [] : [h.DataAttribute("label-position", labelPosition)]),
            ...(props.wrap !== false && !vertical ? [h.DataAttribute("wrap", "")] : [])
          ],
          items
        ),
        ...content
      ]
    )
  }
}
