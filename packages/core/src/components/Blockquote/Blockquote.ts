import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { accent, colors, radius, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { blockquoteVars } from "./Blockquote.stylex.ts"

export type BlockquotePart = "root" | "icon" | "cite"

export type BlockquoteOptions = {
  readonly color?: string
  readonly iconSize?: number
  readonly radius?: StyleValue
  readonly textWrap?: "wrap" | "nowrap" | "balance" | "pretty" | "stable"
}

export type BlockquoteProps = BlockquoteOptions &
  StylesApiProps<BlockquotePart> & {
    readonly icon?: Child
    readonly cite?: Child
    readonly children: ReadonlyArray<Child>
  }

export type BlockquoteConfig = ComponentConfig<BlockquoteOptions, BlockquotePart>

const offset = `calc(${blockquoteVars.iconSize} / -2)`

const styles = stylex.create({
  root: {
    [blockquoteVars.color]: accent.filled,
    [blockquoteVars.radius]: radius.default,
    position: "relative",
    margin: 0,
    textWrap: blockquoteVars.textWrap,
    borderInlineStartWidth: "3px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: blockquoteVars.color,
    borderStartEndRadius: blockquoteVars.radius,
    borderEndEndRadius: blockquoteVars.radius,
    paddingBlock: space.xl,
    paddingInline: "38px",
    backgroundColor: `light-dark(color-mix(in srgb, ${blockquoteVars.color} 7%, transparent), color-mix(in srgb, ${blockquoteVars.color} 6%, transparent))`
  },
  icon: {
    position: "absolute",
    color: blockquoteVars.color,
    backgroundColor: colors.body,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    top: offset,
    insetInlineStart: offset,
    width: blockquoteVars.iconSize,
    height: blockquoteVars.iconSize,
    borderRadius: blockquoteVars.iconSize
  },
  cite: { display: "block", marginTop: space.md, opacity: 0.6, fontSize: "85%" }
})

export const Blockquote =
  (config: { readonly Blockquote?: BlockquoteConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BlockquoteProps): Html => {
    const props = withDefaults(config.Blockquote, input)
    const getStyles = stylesApi<M, BlockquotePart>(h, props, config.Blockquote, "root")

    return h.blockquote(
      getStyles(
        "root",
        styles.root,
        setVars([blockquoteVars.iconSize, rem(props.iconSize ?? 48)]),
        setDefinedVars(
          [blockquoteVars.color, mapDefined(props.color, themeColor)],
          [blockquoteVars.radius, mapDefined(props.radius, radiusValue)],
          [blockquoteVars.textWrap, props.textWrap]
        )
      ),
      [
        ...(props.icon === undefined ? [] : [h.span(getStyles("icon", styles.icon), [props.icon])]),
        ...props.children,
        ...(props.cite === undefined ? [] : [h.cite(getStyles("cite", styles.cite), [props.cite])])
      ]
    )
  }
