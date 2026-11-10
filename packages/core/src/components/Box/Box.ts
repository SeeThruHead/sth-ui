import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import type { Breakpoint } from "../../styles/styleProps.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"

const from = {
  xs: "@media (min-width: 36em)",
  sm: "@media (min-width: 48em)",
  md: "@media (min-width: 62em)",
  lg: "@media (min-width: 75em)",
  xl: "@media (min-width: 88em)"
}

const below = {
  xs: "@media (max-width: 35.99em)",
  sm: "@media (max-width: 47.99em)",
  md: "@media (max-width: 61.99em)",
  lg: "@media (max-width: 74.99em)",
  xl: "@media (max-width: 87.99em)"
}

export type BoxPart = "root"

export type BoxElement =
  | "div"
  | "span"
  | "section"
  | "article"
  | "main"
  | "header"
  | "footer"
  | "nav"
  | "aside"
  | "p"
  | "ul"
  | "ol"
  | "li"
  | "label"
  | "a"
  | "button"

export type BoxOptions = {
  readonly component?: BoxElement
  readonly hiddenFrom?: Breakpoint
  readonly visibleFrom?: Breakpoint
}

export type BoxProps = BoxOptions &
  StylesApiProps<BoxPart> & {
    readonly children: ReadonlyArray<Child>
  }

export type BoxConfig = ComponentConfig<BoxOptions, BoxPart>

const hiddenFrom = stylex.create({
  xs: { display: { default: null, [from.xs]: "none" } },
  sm: { display: { default: null, [from.sm]: "none" } },
  md: { display: { default: null, [from.md]: "none" } },
  lg: { display: { default: null, [from.lg]: "none" } },
  xl: { display: { default: null, [from.xl]: "none" } }
})

const visibleFrom = stylex.create({
  xs: { display: { default: null, [below.xs]: "none" } },
  sm: { display: { default: null, [below.sm]: "none" } },
  md: { display: { default: null, [below.md]: "none" } },
  lg: { display: { default: null, [below.lg]: "none" } },
  xl: { display: { default: null, [below.xl]: "none" } }
})

export const Box =
  (config: { readonly Box?: BoxConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BoxProps): Html => {
    const props = withDefaults(config.Box, input)
    const getStyles = stylesApi<M, BoxPart>(h, props, config.Box, "root")
    const element = h[props.component ?? "div"]

    return element(
      getStyles(
        "root",
        props.hiddenFrom === undefined ? null : hiddenFrom[props.hiddenFrom],
        props.visibleFrom === undefined ? null : visibleFrom[props.visibleFrom]
      ),
      props.children
    )
  }
