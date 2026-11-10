import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { stackVars } from "./Stack.stylex.ts"

export type StackPart = "root"

export type StackOptions = {
  readonly gap?: StyleValue
  readonly align?: string
  readonly justify?: string
}

export type StackProps = StackOptions & StylesApiProps<StackPart> & { readonly children: ReadonlyArray<Child> }

export type StackConfig = ComponentConfig<StackOptions, StackPart>

const styles = stylex.create({
  root: {
    [stackVars.gap]: space.md,
    display: "flex",
    flexDirection: "column",
    alignItems: stackVars.align,
    justifyContent: stackVars.justify,
    gap: stackVars.gap
  }
})

export const Stack =
  (config: { readonly Stack?: StackConfig }) =>
  <M>(h: HtmlBuilder<M>, input: StackProps): Html => {
    const props = withDefaults(config.Stack, input)
    const getStyles = stylesApi<M, StackPart>(h, props, config.Stack, "root")

    return h.div(
      getStyles(
        "root",
        styles.root,
        setDefinedVars(
          [stackVars.gap, mapDefined(props.gap, spacing)],
          [stackVars.align, props.align],
          [stackVars.justify, props.justify]
        )
      ),
      props.children
    )
  }
