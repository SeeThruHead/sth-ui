import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { fontSize } from "../../theme/tokens.stylex.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"

export type UnstyledButtonPart = "root"

export type UnstyledButtonOptions = {
  readonly component?: "button" | "a" | "div" | "span"
  readonly disabled?: boolean
  readonly type?: "button" | "submit" | "reset"
}

export type ButtonBehaviour<M> = UnstyledButtonOptions & {
  readonly href?: string
  readonly label?: string
  readonly onClick?: M
}

export type UnstyledButtonProps<M> = ButtonBehaviour<M> &
  StylesApiProps<UnstyledButtonPart> & { readonly children: ReadonlyArray<Child> }

export type UnstyledButtonConfig = ComponentConfig<UnstyledButtonOptions, UnstyledButtonPart>

export const unstyledButtonStyles = stylex.create({
  root: {
    backgroundColor: "transparent",
    cursor: "pointer",
    borderWidth: 0,
    padding: 0,
    appearance: "none",
    fontFamily: "inherit",
    fontSize: fontSize.md,
    textAlign: "start",
    textDecoration: "none",
    color: "inherit",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent"
  }
})

const activationKeys = new Set(["Enter", " "])

const keyActivation = <M>(
  h: HtmlBuilder<M>,
  component: string,
  onClick: M | undefined
): ReadonlyArray<Attribute<M>> => {
  if (onClick === undefined) return []
  if (component !== "div" && component !== "span") return []

  return [h.OnKeyDownPreventDefault((key) => (activationKeys.has(key) ? Option.some(onClick) : Option.none()))]
}

export const buttonBehaviour = <M>(h: HtmlBuilder<M>, props: ButtonBehaviour<M>): ReadonlyArray<Attribute<M>> => {
  const component = props.component ?? "button"
  const disabled = props.disabled === true

  return [
    ...(component === "button" ? [h.Type(props.type ?? "button"), h.Disabled(disabled)] : []),
    ...(component === "a" && props.href !== undefined ? [h.Href(props.href)] : []),
    ...(component === "div" || component === "span" ? [h.Role("button"), h.Tabindex(disabled ? -1 : 0)] : []),
    ...(component !== "button" && disabled ? [h.AriaDisabled(true)] : []),
    ...(props.label === undefined ? [] : [h.AriaLabel(props.label)]),
    ...(props.onClick === undefined || disabled ? [] : [h.OnClick(props.onClick)]),
    ...keyActivation(h, component, disabled ? undefined : props.onClick)
  ]
}

export const UnstyledButton =
  (config: { readonly UnstyledButton?: UnstyledButtonConfig }) =>
  <M>(h: HtmlBuilder<M>, input: UnstyledButtonProps<M>): Html => {
    const props = withDefaults(config.UnstyledButton, input)
    const getStyles = stylesApi(h, props, config.UnstyledButton, "root")
    const element = h[props.component ?? "button"]

    return element(
      [...getStyles("root", unstyledButtonStyles.root, shared.focusRing), ...buttonBehaviour(h, props)],
      props.children
    )
  }
