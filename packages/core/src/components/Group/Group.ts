import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { setDefinedVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { groupVars } from "./Group.stylex.ts"

export type GroupPart = "root"

export type GroupOptions = {
  readonly gap?: StyleValue
  readonly align?: string
  readonly justify?: string
  readonly wrap?: "wrap" | "nowrap" | "wrap-reverse"
  readonly grow?: boolean
  readonly preventGrowOverflow?: boolean
}

export type GroupProps = GroupOptions & StylesApiProps<GroupPart> & { readonly children: ReadonlyArray<Child> }

export type GroupConfig = ComponentConfig<GroupOptions, GroupPart>

const styles = stylex.create({
  root: {
    [groupVars.gap]: space.md,
    display: "flex",
    flexDirection: "row",
    flexWrap: groupVars.wrap,
    justifyContent: groupVars.justify,
    alignItems: groupVars.align,
    gap: groupVars.gap
  },
  cell: { display: "grid", flexGrow: 1, maxWidth: groupVars.childWidth, minWidth: 0 }
})

const childWidth = (count: number, gap: string): string => `calc(${100 / count}% - (${gap} - ${gap} / ${count}))`

export const Group =
  (config: { readonly Group?: GroupConfig }) =>
  <M>(h: HtmlBuilder<M>, input: GroupProps): Html => {
    const props = withDefaults(config.Group, input)
    const getStyles = stylesApi<M, GroupPart>(h, props, config.Group, "root")
    const grow = props.grow === true
    const gap = spacing(props.gap ?? "md")
    const cappedWidth = grow && props.preventGrowOverflow !== false ? childWidth(props.children.length, gap) : undefined
    const children = grow ? props.children.map((child) => h.div(sx(h, styles.cell), [child])) : props.children

    return h.div(
      getStyles(
        "root",
        styles.root,
        setDefinedVars(
          [groupVars.gap, props.gap === undefined ? undefined : gap],
          [groupVars.align, props.align],
          [groupVars.justify, props.justify],
          [groupVars.wrap, props.wrap],
          [groupVars.childWidth, cappedWidth]
        )
      ).concat(grow ? [h.DataAttribute("grow", "")] : []),
      children
    )
  }
