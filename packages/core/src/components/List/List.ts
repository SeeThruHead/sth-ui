import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setStyle, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { fontSize, lineHeight, space } from "../../theme/tokens.stylex.ts"
import { listVars } from "./List.stylex.ts"

export type ListPart = "root" | "item" | "itemWrapper" | "itemIcon" | "itemLabel"

export type ListSize = "xs" | "sm" | "md" | "lg" | "xl"

export type ListItem = {
  readonly children: ReadonlyArray<Child>
  readonly icon?: Child
  readonly value?: number
}

export type ListOptions = {
  readonly type?: "ordered" | "unordered"
  readonly withPadding?: boolean
  readonly size?: ListSize
  readonly spacing?: StyleValue
  readonly center?: boolean
  readonly listStyleType?: string
}

export type ListProps = ListOptions &
  StylesApiProps<ListPart> & {
    readonly items: ReadonlyArray<ListItem>
    readonly icon?: Child
    readonly start?: number
    readonly reversed?: boolean
  }

export type ListConfig = ComponentConfig<ListOptions, ListPart>

const sizes = stylex.create({
  xs: { [listVars.fz]: fontSize.xs, [listVars.lh]: lineHeight.xs },
  sm: { [listVars.fz]: fontSize.sm, [listVars.lh]: lineHeight.sm },
  md: { [listVars.fz]: fontSize.md, [listVars.lh]: lineHeight.md },
  lg: { [listVars.fz]: fontSize.lg, [listVars.lh]: lineHeight.lg },
  xl: { [listVars.fz]: fontSize.xl, [listVars.lh]: lineHeight.xl }
})

const styles = stylex.create({
  root: {
    [listVars.markerGap]: space.lg,
    listStylePosition: "outside",
    fontSize: listVars.fz,
    lineHeight: listVars.lh,
    marginTop: 0,
    marginBottom: 0,
    marginInline: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingInlineEnd: 0,
    paddingInlineStart: listVars.markerGap
  },
  withPadding: { paddingInlineStart: `calc(${listVars.markerGap} + ${space.md})` },
  item: { whiteSpace: "normal", lineHeight: listVars.lh },
  itemWithIcon: { listStyleType: "none" },
  itemSpaced: { marginTop: listVars.spacing },
  centered: { lineHeight: 1 },
  itemWrapper: { display: "inline-flex", flexDirection: "column", alignItems: "flex-start", whiteSpace: "normal" },
  itemWrapperWithIcon: { flexDirection: "row", alignItems: "center" },
  itemIcon: { display: "inline-block", verticalAlign: "middle", marginInlineEnd: space.sm }
})

export const List =
  (config: { readonly List?: ListConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ListProps): Html => {
    const props = withDefaults(config.List, input)
    const getStyles = stylesApi<M, ListPart>(h, props, config.List, "root")
    const type = props.type ?? "unordered"
    const center = props.center === true

    const itemView = (item: ListItem, index: number): Html => {
      const icon = item.icon ?? props.icon
      const withIcon = icon !== undefined

      return h.li(
        [
          ...getStyles(
            "item",
            styles.item,
            withIcon && styles.itemWithIcon,
            index > 0 && styles.itemSpaced,
            center && styles.centered
          ),
          ...(withIcon ? [h.DataAttribute("with-icon", "")] : []),
          ...(center ? [h.DataAttribute("centered", "")] : []),
          ...(item.value === undefined ? [] : [h.Attribute("value", String(item.value))])
        ],
        [
          h.div(getStyles("itemWrapper", styles.itemWrapper, withIcon && styles.itemWrapperWithIcon), [
            ...(withIcon ? [h.span(getStyles("itemIcon", styles.itemIcon), [icon])] : []),
            h.span(getStyles("itemLabel"), item.children)
          ])
        ]
      )
    }

    return h[type === "ordered" ? "ol" : "ul"](
      [
        ...getStyles(
          "root",
          styles.root,
          sizes[props.size ?? "md"],
          props.withPadding === true && styles.withPadding,
          setDefinedVars([listVars.spacing, mapDefined(props.spacing, spacing)]),
          ...(props.listStyleType === undefined ? [] : [setStyle(["listStyleType", props.listStyleType])])
        ),
        h.DataAttribute("type", type),
        ...(props.withPadding === true ? [h.DataAttribute("with-padding", "")] : []),
        ...(props.start === undefined ? [] : [h.Attribute("start", String(props.start))]),
        ...(props.reversed === true ? [h.Attribute("reversed", "")] : [])
      ],
      props.items.map(itemView)
    )
  }
