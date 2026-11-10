import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { colors, fontSize, lineHeight, space } from "../../theme/tokens.stylex.ts"
import { dataListVars } from "./DataList.stylex.ts"

export type DataListPart = "root" | "item" | "itemLabel" | "itemValue"

export type DataListSize = "xs" | "sm" | "md" | "lg" | "xl"

export type DataListOptions = {
  readonly size?: DataListSize
  readonly gap?: StyleValue
  readonly orientation?: "horizontal" | "vertical"
  readonly withDivider?: boolean
  readonly labelWidth?: number | string
}

export type DataListItem = { readonly label: Child; readonly value: Child; readonly key?: string }

export type DataListProps = DataListOptions &
  StylesApiProps<DataListPart> & { readonly items: ReadonlyArray<DataListItem> }

export type DataListConfig = ComponentConfig<DataListOptions, DataListPart>

const sizes = stylex.create({
  xs: { [dataListVars.fontSize]: fontSize.xs, [dataListVars.lineHeight]: lineHeight.xs },
  sm: { [dataListVars.fontSize]: fontSize.sm, [dataListVars.lineHeight]: lineHeight.sm },
  md: { [dataListVars.fontSize]: fontSize.md, [dataListVars.lineHeight]: lineHeight.md },
  lg: { [dataListVars.fontSize]: fontSize.lg, [dataListVars.lineHeight]: lineHeight.lg },
  xl: { [dataListVars.fontSize]: fontSize.xl, [dataListVars.lineHeight]: lineHeight.xl }
})

const styles = stylex.create({
  root: {
    [dataListVars.fontSize]: fontSize.sm,
    [dataListVars.lineHeight]: lineHeight.sm,
    [dataListVars.gap]: space.sm,
    display: "flex",
    flexDirection: "column",
    gap: dataListVars.gap,
    fontSize: dataListVars.fontSize,
    lineHeight: dataListVars.lineHeight,
    margin: 0,
    padding: 0
  },
  divided: { gap: 0 },
  item: { display: "flex", flexDirection: "row", alignItems: "baseline", gap: space.xs },
  itemVertical: { flexDirection: "column", gap: 0 },
  itemDivided: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.defaultBorder,
    paddingTop: dataListVars.gap,
    marginTop: dataListVars.gap
  },
  label: {
    color: colors.dimmed,
    fontSize: dataListVars.fontSize,
    lineHeight: dataListVars.lineHeight,
    minWidth: dataListVars.labelWidth,
    margin: 0
  },
  labelVertical: { minWidth: "100%" },
  value: { fontSize: dataListVars.fontSize, lineHeight: dataListVars.lineHeight, margin: 0 }
})

const widthOf = (width: number | string) => (Predicate.isNumber(width) ? `${width}px` : width)

export const DataList =
  (config: { readonly DataList?: DataListConfig }) =>
  <M>(h: HtmlBuilder<M>, input: DataListProps): Html => {
    const props = withDefaults(config.DataList, input)
    const getStyles = stylesApi<M, DataListPart>(h, props, config.DataList, "root")
    const orientation = props.orientation ?? "horizontal"
    const vertical = orientation === "vertical"
    const divided = props.withDivider === true

    return h.dl(
      [
        ...getStyles(
          "root",
          styles.root,
          props.size === undefined ? null : sizes[props.size],
          divided && styles.divided,
          setDefinedVars(
            [dataListVars.gap, mapDefined(props.gap, spacing)],
            [dataListVars.labelWidth, mapDefined(props.labelWidth, widthOf)]
          )
        ),
        h.DataAttribute("orientation", orientation),
        ...(divided ? [h.DataAttribute("with-divider", "")] : [])
      ],
      props.items.map((item, index) =>
        h.div(
          getStyles("item", styles.item, vertical && styles.itemVertical, divided && index > 0 && styles.itemDivided),
          [
            h.dt(getStyles("itemLabel", styles.label, vertical && styles.labelVertical), [item.label]),
            h.dd(getStyles("itemValue", styles.value), [item.value])
          ]
        )
      )
    )
  }
