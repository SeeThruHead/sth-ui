import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"

export type VisuallyHiddenPart = "root"

export type VisuallyHiddenOptions = object

export type VisuallyHiddenProps = StylesApiProps<VisuallyHiddenPart> & { readonly children: ReadonlyArray<Child> }

export type VisuallyHiddenConfig = ComponentConfig<VisuallyHiddenOptions, VisuallyHiddenPart>

export const VisuallyHidden =
  (config: { readonly VisuallyHidden?: VisuallyHiddenConfig }) =>
  <M>(h: HtmlBuilder<M>, input: VisuallyHiddenProps): Html => {
    const props = withDefaults(config.VisuallyHidden, input)
    const getStyles = stylesApi<M, VisuallyHiddenPart>(h, props, config.VisuallyHidden, "root")

    return h.span(getStyles("root", shared.visuallyHidden), props.children)
  }
