import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { spacing } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import { affixVars } from "./Affix.stylex.ts"

export type AffixPart = "root"

export type AffixPosition = {
  readonly top?: StyleValue
  readonly left?: StyleValue
  readonly bottom?: StyleValue
  readonly right?: StyleValue
}

export type AffixOptions = {
  readonly position?: AffixPosition
  readonly zIndex?: number | string
  readonly withinPortal?: boolean
  readonly portalTarget?: string
}

export type AffixProps = AffixOptions & StylesApiProps<AffixPart> & { readonly children: ReadonlyArray<Child> }

export type AffixConfig = ComponentConfig<AffixOptions, AffixPart>

const styles = stylex.create({
  root: {
    position: "fixed",
    zIndex: affixVars.zIndex,
    insetInlineStart: affixVars.left,
    insetInlineEnd: affixVars.right,
    top: affixVars.top,
    bottom: affixVars.bottom
  }
})

export const Affix = (config: { readonly Affix?: AffixConfig; readonly Portal?: PortalConfig }) => {
  const portal = Portal(config)

  return <M>(h: HtmlBuilder<M>, input: AffixProps): Html => {
    const props = withDefaults(config.Affix, input)
    const getStyles = stylesApi<M, AffixPart>(h, props, config.Affix, "root")
    const position = props.position ?? { bottom: 0, right: 0 }
    const affix = h.div(
      getStyles(
        "root",
        styles.root,
        setDefinedVars(
          [affixVars.zIndex, mapDefined(props.zIndex, String)],
          [affixVars.top, mapDefined(position.top, spacing)],
          [affixVars.left, mapDefined(position.left, spacing)],
          [affixVars.bottom, mapDefined(position.bottom, spacing)],
          [affixVars.right, mapDefined(position.right, spacing)]
        )
      ),
      props.children
    )

    return props.withinPortal === false
      ? affix
      : portal(h, { ...(props.portalTarget === undefined ? {} : { target: props.portalTarget }), children: [affix] })
  }
}
