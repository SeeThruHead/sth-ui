import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { buttonBehaviour, unstyledButtonStyles } from "../UnstyledButton/UnstyledButton.ts"
import type { ButtonBehaviour } from "../UnstyledButton/UnstyledButton.ts"
import { burgerVars } from "./Burger.stylex.ts"

export type BurgerPart = "root" | "burger"

export type BurgerSize = keyof typeof sizes

export type BurgerOptions = {
  readonly size?: BurgerSize | number | (string & {})
  readonly lineSize?: number | string
  readonly color?: string
  readonly transitionDuration?: number
  readonly transitionTimingFunction?: string
}

export type BurgerProps<M> = BurgerOptions &
  Omit<ButtonBehaviour<M>, "component" | "href"> &
  StylesApiProps<BurgerPart> & {
    readonly opened?: boolean
    readonly children?: ReadonlyArray<Child>
  }

export type BurgerConfig = ComponentConfig<BurgerOptions, BurgerPart>

const line = {
  display: "block",
  width: burgerVars.size,
  height: burgerVars.lineSize,
  backgroundColor: burgerVars.color,
  outlineWidth: "1px",
  outlineStyle: "solid",
  outlineColor: "transparent",
  transitionProperty: "background-color, transform",
  transitionDuration: { default: burgerVars.duration, "@media (prefers-reduced-motion: reduce)": "0ms" },
  transitionTimingFunction: burgerVars.timing
}

const styles = stylex.create({
  root: {
    [burgerVars.size]: "24px",
    [burgerVars.lineSize]: `calc(${burgerVars.size} / 12)`,
    [burgerVars.color]: `light-dark(${palette.black}, ${palette.white})`,
    width: `calc(${burgerVars.size} + ${space.xs})`,
    height: `calc(${burgerVars.size} + ${space.xs})`,
    padding: `calc(${space.xs} / 2)`,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  burger: { ...line, position: "relative", userSelect: "none" },
  opened: { backgroundColor: "transparent" },
  edge: { ...line, position: "absolute", insetInlineStart: 0 },
  top: { top: `calc(${burgerVars.size} / -3)` },
  bottom: { top: `calc(${burgerVars.size} / 3)` },
  topOpened: { transform: `translateY(calc(${burgerVars.size} / 3)) rotate(45deg)` },
  bottomOpened: { transform: `translateY(calc(${burgerVars.size} / -3)) rotate(-45deg)` }
})

const sizes = stylex.create({
  xs: { [burgerVars.size]: "12px" },
  sm: { [burgerVars.size]: "18px" },
  md: { [burgerVars.size]: "24px" },
  lg: { [burgerVars.size]: "34px" },
  xl: { [burgerVars.size]: "42px" }
})

const isBurgerSize = (size: string): size is BurgerSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: BurgerOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([burgerVars.size, rem(size)])

  return isBurgerSize(size) ? sizes[size] : setVars([burgerVars.size, size])
}

export const Burger =
  (config: { readonly Burger?: BurgerConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BurgerProps<M>): Html => {
    const props = withDefaults(config.Burger, input)
    const getStyles = stylesApi<M, BurgerPart>(h, props, config.Burger, "root")
    const opened = props.opened === true

    return h.button(
      [
        ...getStyles(
          "root",
          unstyledButtonStyles.root,
          styles.root,
          sizeStyle(props.size),
          setDefinedVars(
            [burgerVars.lineSize, mapDefined(props.lineSize, sizeValue)],
            [burgerVars.color, mapDefined(props.color, themeColor)],
            [burgerVars.duration, mapDefined(props.transitionDuration, (ms) => `${ms}ms`)],
            [burgerVars.timing, props.transitionTimingFunction]
          ),
          shared.focusRing
        ),
        ...buttonBehaviour(h, props),
        h.AriaExpanded(opened)
      ],
      [
        h.span(
          [
            ...getStyles("burger", styles.burger, opened && styles.opened),
            h.DataAttribute("reduce-motion", ""),
            ...(opened ? [h.DataAttribute("opened", "")] : [])
          ],
          [
            h.span(sx(h, styles.edge, styles.top, opened && styles.topOpened), []),
            h.span(sx(h, styles.edge, styles.bottom, opened && styles.bottomOpened), [])
          ]
        ),
        ...(props.children ?? [])
      ]
    )
  }
