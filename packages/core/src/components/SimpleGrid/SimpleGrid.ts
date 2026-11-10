import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { everyPoint, sizeValue, spacing } from "../../styles/styleProps.ts"
import type { Point, Responsive, StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { simpleGridRules } from "./rules.ts"
import { simpleGridVars } from "./SimpleGrid.stylex.ts"

export type SimpleGridPart = "root" | "container"

export type SimpleGridOptions = {
  readonly cols?: Responsive<number>
  readonly spacing?: Responsive<StyleValue>
  readonly verticalSpacing?: Responsive<StyleValue>
  readonly type?: "media" | "container"
  readonly minColWidth?: StyleValue
  readonly autoFlow?: "auto-fit" | "auto-fill"
  readonly autoRows?: string
}

export type SimpleGridProps = SimpleGridOptions &
  StylesApiProps<SimpleGridPart> & { readonly children: ReadonlyArray<Child> }

export type SimpleGridConfig = ComponentConfig<SimpleGridOptions, SimpleGridPart>

const styles = stylex.create({
  root: { display: "grid", gridAutoRows: simpleGridVars.autoRows },
  autoFill: { gridTemplateColumns: `repeat(auto-fill, minmax(${simpleGridVars.minColWidth}, 1fr))` },
  autoFit: { gridTemplateColumns: `repeat(auto-fit, minmax(${simpleGridVars.minColWidth}, 1fr))` },
  container: { containerType: "inline-size", containerName: "simple-grid" }
})

const tokenOf = (group: "cols" | "gapX" | "gapY", point: Point): string => simpleGridVars[`${group}_${point}`]

const groupVars = <Value>(
  group: "cols" | "gapX" | "gapY",
  value: Responsive<Value>,
  resolve: (value: Value) => string
): ReadonlyArray<readonly [string, string]> =>
  everyPoint(value).map(([point, chosen]) => [tokenOf(group, point), resolve(chosen)])

const autoFlowStyle = (props: SimpleGridOptions) => {
  if (props.minColWidth === undefined) return null
  if (props.autoFlow === "auto-fit") return styles.autoFit

  return styles.autoFill
}

export const SimpleGrid =
  (config: { readonly SimpleGrid?: SimpleGridConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SimpleGridProps): Html => {
    const props = withDefaults(config.SimpleGrid, input)
    const getStyles = stylesApi<M, SimpleGridPart>(h, props, config.SimpleGrid, "root")
    const container = props.type === "container"
    const spacingValue = props.spacing ?? "md"
    const grid = h.div(
      getStyles(
        "root",
        styles.root,
        container ? simpleGridRules.container : simpleGridRules.media,
        autoFlowStyle(props),
        setVars(
          ...groupVars("cols", props.cols ?? 1, String),
          ...groupVars("gapX", spacingValue, spacing),
          ...groupVars("gapY", props.verticalSpacing ?? spacingValue, spacing)
        ),
        setDefinedVars(
          [simpleGridVars.minColWidth, mapDefined(props.minColWidth, sizeValue)],
          [simpleGridVars.autoRows, props.autoRows]
        )
      ),
      props.children
    )

    return container ? h.div(getStyles("container", styles.container), [grid]) : grid
  }
