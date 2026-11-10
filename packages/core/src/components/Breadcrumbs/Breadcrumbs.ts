import * as stylex from "@stylexjs/stylex"
import { childAttributes } from "foldkit/html"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { listOf, mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, PartStyles, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { breadcrumbsVars } from "./Breadcrumbs.stylex.ts"

export type BreadcrumbsPart = "root" | "breadcrumb" | "separator"

export type BreadcrumbBinding = {
  readonly bind: ReadonlyArray<ChildAttribute>
  readonly styles: PartStyles<"root">
}

export type Breadcrumb = Child | ((crumb: BreadcrumbBinding) => Child)

export type BreadcrumbsOptions = {
  readonly separator?: Child
  readonly separatorMargin?: StyleValue
}

export type BreadcrumbsProps = BreadcrumbsOptions &
  StylesApiProps<BreadcrumbsPart> & { readonly children: ReadonlyArray<Breadcrumb> }

export type BreadcrumbsConfig = ComponentConfig<BreadcrumbsOptions, BreadcrumbsPart>

const styles = stylex.create({
  root: { [breadcrumbsVars.separatorMargin]: space.xs, display: "flex", alignItems: "center", flexWrap: "wrap" },
  breadcrumb: { lineHeight: 1, whiteSpace: "nowrap", WebkitTapHighlightColor: "transparent" },
  separator: {
    marginInline: breadcrumbsVars.separatorMargin,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: `light-dark(${palette.gray7}, ${palette.dark2})`
  }
})

export const Breadcrumbs =
  (config: { readonly Breadcrumbs?: BreadcrumbsConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BreadcrumbsProps): Html => {
    const props = withDefaults(config.Breadcrumbs, input)
    const getStyles = stylesApi<M, BreadcrumbsPart>(h, props, config.Breadcrumbs, "root")
    const binding: BreadcrumbBinding = {
      bind: childAttributes(
        Object.entries(props.attributes?.breadcrumb ?? {}).map(([name, value]) => h.Attribute(name, value))
      ),
      styles: {
        root: [
          props.unstyled === true ? null : styles.breadcrumb,
          ...listOf(config.Breadcrumbs?.styles?.breadcrumb),
          ...listOf(props.styles?.breadcrumb)
        ]
      }
    }
    const crumb = (item: Breadcrumb): Child =>
      typeof item === "function" ? item(binding) : h.div(getStyles("breadcrumb", styles.breadcrumb), [item])
    const separator = h.div(getStyles("separator", styles.separator), [props.separator ?? "/"])

    return h.div(
      getStyles(
        "root",
        styles.root,
        setDefinedVars([breadcrumbsVars.separatorMargin, mapDefined(props.separatorMargin, spacing)])
      ),
      props.children.flatMap((item, index) => (index === 0 ? [crumb(item)] : [separator, crumb(item)]))
    )
  }
