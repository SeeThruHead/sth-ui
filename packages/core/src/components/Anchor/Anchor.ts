import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { colors } from "../../theme/tokens.stylex.ts"
import { textModifiers, textStyles } from "../Text/Text.ts"
import type { TextOptions } from "../Text/Text.ts"

export type AnchorPart = "root"

export type AnchorUnderline = keyof typeof underlines

export type AnchorOptions = Omit<TextOptions, "span" | "component"> & {
  readonly underline?: AnchorUnderline
  readonly component?: "a" | "button"
}

export type AnchorProps<M> = AnchorOptions &
  StylesApiProps<AnchorPart> & {
    readonly href?: string
    readonly target?: string
    readonly rel?: string
    readonly download?: string
    readonly onClick?: M
    readonly children: ReadonlyArray<Child>
  }

export type AnchorConfig = ComponentConfig<AnchorOptions, AnchorPart>

const styles = stylex.create({
  root: {
    color: colors.anchor,
    textDecoration: "none",
    appearance: "none",
    borderWidth: 0,
    display: "inline",
    padding: 0,
    margin: 0,
    backgroundColor: "transparent",
    cursor: "pointer",
    fontFamily: "inherit"
  },
  gradient: { textDecoration: { default: "none", ":hover": "none" } },
  clamped: { display: "-webkit-box" }
})

const underlines = stylex.create({
  hover: { textDecoration: { default: "none", ":hover": "underline" } },
  "not-hover": { textDecoration: { default: "underline", ":hover": "none" } },
  always: { textDecoration: "underline" },
  never: { textDecoration: "none" }
})

export const Anchor =
  (config: { readonly Anchor?: AnchorConfig }) =>
  <M>(h: HtmlBuilder<M>, input: AnchorProps<M>): Html => {
    const props = withDefaults(config.Anchor, input)
    const getStyles = stylesApi<M, AnchorPart>(h, props, config.Anchor, "root")
    const underline = props.underline ?? "hover"
    const modifiers = textModifiers(props)
    const button = props.component === "button"

    return h[button ? "button" : "a"](
      [
        ...getStyles(
          "root",
          ...textStyles(props),
          styles.root,
          underlines[underline],
          props.variant === "gradient" && styles.gradient,
          props.lineClamp !== undefined && styles.clamped,
          shared.focusRing
        ),
        h.DataAttribute("underline", underline),
        ...(modifiers.truncate === undefined ? [] : [h.DataAttribute("truncate", modifiers.truncate)]),
        ...(modifiers.lineClamp ? [h.DataAttribute("line-clamp", "")] : []),
        ...(modifiers.inline ? [h.DataAttribute("inline", "")] : []),
        ...(modifiers.inherit ? [h.DataAttribute("inherit", "")] : []),
        ...(props.variant === undefined ? [] : [h.DataAttribute("variant", props.variant)]),
        ...(button ? [h.Type("button")] : []),
        ...(props.href === undefined ? [] : [h.Href(props.href)]),
        ...(props.target === undefined ? [] : [h.Target(props.target)]),
        ...(props.rel === undefined ? [] : [h.Rel(props.rel)]),
        ...(props.download === undefined ? [] : [h.Download(props.download)]),
        ...(props.onClick === undefined ? [] : [h.OnClick(props.onClick)])
      ],
      props.children
    )
  }
