import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { flexStyles } from "../../styles/styleProps.ts"
import type { FlexProps as FlexLayout } from "../../styles/styleProps.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import type { BoxElement } from "../Box/Box.ts"

export type FlexPart = "root"

export type FlexOptions = FlexLayout & { readonly component?: BoxElement }

export type FlexProps = FlexOptions & StylesApiProps<FlexPart> & { readonly children: ReadonlyArray<Child> }

export type FlexConfig = ComponentConfig<FlexOptions, FlexPart>

const styles = stylex.create({ root: { display: "flex" } })

export const Flex =
  (config: { readonly Flex?: FlexConfig }) =>
  <M>(h: HtmlBuilder<M>, input: FlexProps): Html => {
    const props = withDefaults(config.Flex, input)
    const getStyles = stylesApi<M, FlexPart>(h, props, config.Flex, "root")
    return h[props.component ?? "div"](getStyles("root", styles.root, ...flexStyles(props)), props.children)
  }
