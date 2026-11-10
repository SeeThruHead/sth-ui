import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, space } from "../../theme/tokens.stylex.ts"
import { emptyStateVars } from "./EmptyState.stylex.ts"

export type EmptyStatePart = "root" | "body" | "indicator" | "title" | "description" | "actions"

export type EmptyStateSize = "xs" | "sm" | "md" | "lg" | "xl"

export type EmptyStateAlign = "left" | "center" | "right"

export type EmptyStateVariant = "filled" | "light"

export type EmptyStateTitleOrder = 1 | 2 | 3 | 4 | 5 | 6

export type EmptyStateOptions = {
  readonly size?: EmptyStateSize
  readonly align?: EmptyStateAlign
  readonly variant?: EmptyStateVariant
  readonly color?: string
  readonly withIndicatorBackground?: boolean
  readonly titleOrder?: EmptyStateTitleOrder
}

export type EmptyStateProps = EmptyStateOptions &
  StylesApiProps<EmptyStatePart> & {
    readonly title?: Child
    readonly description?: Child
    readonly icon?: Child
    readonly actions?: ReadonlyArray<Child>
    readonly children?: ReadonlyArray<Child>
  }

export type EmptyStateConfig = ComponentConfig<EmptyStateOptions, EmptyStatePart>

const sizes = stylex.create({
  xs: {
    [emptyStateVars.indicatorSize]: "32px",
    [emptyStateVars.gap]: "6px",
    [emptyStateVars.titleFz]: fontSize.sm,
    [emptyStateVars.descriptionFz]: fontSize.xs
  },
  sm: {
    [emptyStateVars.indicatorSize]: "40px",
    [emptyStateVars.gap]: "8px",
    [emptyStateVars.titleFz]: fontSize.md,
    [emptyStateVars.descriptionFz]: fontSize.sm
  },
  md: {
    [emptyStateVars.indicatorSize]: "48px",
    [emptyStateVars.gap]: "10px",
    [emptyStateVars.titleFz]: fontSize.lg,
    [emptyStateVars.descriptionFz]: fontSize.sm
  },
  lg: {
    [emptyStateVars.indicatorSize]: "60px",
    [emptyStateVars.gap]: "12px",
    [emptyStateVars.titleFz]: fontSize.xl,
    [emptyStateVars.descriptionFz]: fontSize.md
  },
  xl: {
    [emptyStateVars.indicatorSize]: "72px",
    [emptyStateVars.gap]: "16px",
    [emptyStateVars.titleFz]: `calc(${fontSize.xl} * 1.2)`,
    [emptyStateVars.descriptionFz]: fontSize.lg
  }
})

const aligns = stylex.create({
  center: { flexDirection: "column", alignItems: "center" },
  left: { flexDirection: "row", alignItems: "flex-start" },
  right: { flexDirection: "row-reverse", alignItems: "flex-start" }
})

const bodyAligns = stylex.create({
  center: { alignItems: "center", textAlign: "center" },
  left: { alignItems: "flex-start", textAlign: "left" },
  right: { alignItems: "flex-end", textAlign: "right" }
})

const indicatorVariants = stylex.create({
  filled: { backgroundColor: accent.filled, color: colors.white },
  light: { backgroundColor: accent.light, color: accent.lightColor }
})

const styles = stylex.create({
  root: { display: "flex", gap: emptyStateVars.gap },
  body: { display: "flex", flexDirection: "column", gap: emptyStateVars.gap, minWidth: 0 },
  indicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: colors.dimmed,
    fontSize: emptyStateVars.indicatorSize,
    lineHeight: 1
  },
  withBackground: {
    width: "2em",
    height: "2em",
    borderRadius: "1000px",
    backgroundColor: `light-dark(${palette.gray1}, ${palette.dark6})`
  },
  title: {
    fontSize: emptyStateVars.titleFz,
    fontWeight: 600,
    lineHeight: 1.3,
    color: colors.bright,
    marginTop: 0,
    marginBottom: 0,
    marginInline: 0,
    textWrap: "balance"
  },
  description: {
    fontSize: emptyStateVars.descriptionFz,
    lineHeight: 1.55,
    color: colors.dimmed,
    marginTop: 0,
    marginBottom: 0,
    marginInline: 0,
    maxWidth: "32rem",
    textWrap: "pretty"
  },
  actions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: space.sm }
})

const headings = { 1: "h1", 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const

export const EmptyState =
  (config: { readonly EmptyState?: EmptyStateConfig }) =>
  <M>(h: HtmlBuilder<M>, input: EmptyStateProps): Html => {
    const props = withDefaults(config.EmptyState, input)
    const getStyles = stylesApi<M, EmptyStatePart>(h, props, config.EmptyState, "root")
    const align = props.align ?? "center"
    const withBackground = props.withIndicatorBackground === true || props.variant !== undefined
    const heading = props.titleOrder === undefined ? "div" : headings[props.titleOrder]
    const indicator =
      props.icon === undefined
        ? []
        : [
            h.div(
              [
                ...getStyles(
                  "indicator",
                  styles.indicator,
                  withBackground && styles.withBackground,
                  props.variant !== undefined && indicatorVariants[props.variant]
                ),
                ...(withBackground ? [h.DataAttribute("with-background", "")] : [])
              ],
              [props.icon]
            )
          ]
    const body = [
      ...(props.title === undefined ? [] : [h[heading](getStyles("title", styles.title), [props.title])]),
      ...(props.description === undefined
        ? []
        : [h.p(getStyles("description", styles.description), [props.description])]),
      ...(props.actions === undefined ? [] : [h.div(getStyles("actions", styles.actions), props.actions)]),
      ...(props.children ?? [])
    ]

    return h.div(
      [
        ...getStyles(
          "root",
          ...accentStyle(props.color, customAccent),
          styles.root,
          sizes[props.size ?? "md"],
          aligns[align]
        ),
        h.DataAttribute("align", align),
        ...(props.variant === undefined ? [] : [h.DataAttribute("variant", props.variant)])
      ],
      [...indicator, ...(body.length === 0 ? [] : [h.div(getStyles("body", styles.body, bodyAligns[align]), body)])]
    )
  }
