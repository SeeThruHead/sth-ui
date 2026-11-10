import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import type { BoxElement } from "../Box/Box.ts"

export type CenterPart = "root"

export type CenterOptions = { readonly inline?: boolean; readonly component?: BoxElement }

export type CenterProps = CenterOptions & StylesApiProps<CenterPart> & { readonly children: ReadonlyArray<Child> }

export type CenterConfig = ComponentConfig<CenterOptions, CenterPart>

const styles = stylex.create({
  root: { display: "flex", alignItems: "center", justifyContent: "center" },
  inline: { display: "inline-flex" }
})

export const Center =
  (config: { readonly Center?: CenterConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CenterProps): Html => {
    const props = withDefaults(config.Center, input)
    const getStyles = stylesApi<M, CenterPart>(h, props, config.Center, "root")

    return h[props.component ?? "div"](
      getStyles("root", styles.root, props.inline === true && styles.inline),
      props.children
    )
  }
