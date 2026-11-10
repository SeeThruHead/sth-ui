import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { ComponentConfig } from "../../styles/StylesApi.ts"
import { rem } from "../../theme/units.ts"
import type { ModalBaseConfig, ModalBaseOptions, ModalBasePart, ModalBaseProps } from "../Modal/ModalBase.ts"
import type { TransitionName } from "../Transition/Transition.ts"
import { drawerVars } from "./Drawer.stylex.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import { modalBase } from "../Modal/ModalBase.ts"

export { Message, Model, OutMessage, bodyId, close, init, open, titleId, update } from "../Modal/ModalBase.ts"
export type { Result } from "../Modal/ModalBase.ts"

export type DrawerPart = ModalBasePart

export type DrawerPosition = "left" | "right" | "top" | "bottom"

export type DrawerSize = keyof typeof sizes

export type DrawerOptions = ModalBaseOptions & {
  readonly position?: DrawerPosition
  readonly size?: DrawerSize | number | (string & {})
  readonly offset?: string | number
}

export type DrawerProps<M> = ModalBaseProps<M> & DrawerOptions

export type DrawerConfig = ComponentConfig<DrawerOptions, DrawerPart>

const styles = stylex.create({
  root: { [drawerVars.size]: "440px", [drawerVars.offset]: "0rem" },
  inner: { justifyContent: "flex-start", alignItems: "flex-start" },
  content: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: drawerVars.size,
    height: `calc(100% - ${drawerVars.offset} * 2)`,
    margin: drawerVars.offset,
    maxWidth: `calc(100% - ${drawerVars.offset} * 2)`,
    maxHeight: `calc(100% - ${drawerVars.offset} * 2)`
  },
  header: { zIndex: 1000 }
})

const positions = stylex.create({
  left: {},
  right: { justifyContent: "flex-end" },
  top: { alignItems: "flex-start" },
  bottom: { alignItems: "flex-end" }
})

const across = stylex.create({
  horizontal: {},
  vertical: { flexBasis: `calc(100% - ${drawerVars.offset} * 2)`, height: drawerVars.size }
})

const transitions: { readonly [Position in DrawerPosition]: TransitionName } = {
  top: "slide-down",
  bottom: "slide-up",
  left: "slide-right",
  right: "slide-left"
}

const sizes = stylex.create({
  xs: { [drawerVars.size]: "320px" },
  sm: { [drawerVars.size]: "380px" },
  md: { [drawerVars.size]: "440px" },
  lg: { [drawerVars.size]: "620px" },
  xl: { [drawerVars.size]: "780px" }
})

const isDrawerSize = (size: string): size is DrawerSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: DrawerOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([drawerVars.size, rem(size)])

  return isDrawerSize(size) ? sizes[size] : setVars([drawerVars.size, size])
}

export const Drawer = (config: ModalBaseConfig & { readonly Drawer?: DrawerConfig }) => {
  const base = modalBase(config)

  return <M>(h: HtmlBuilder<M>, input: DrawerProps<M>): Html => {
    const props = withDefaults(config.Drawer, input)
    const getStyles = stylesApi<M, DrawerPart>(h, props, config.Drawer, "root")
    const position = props.position ?? "left"
    const vertical = position === "top" || position === "bottom"

    return base(h, props, getStyles, {
      root: [
        styles.root,
        sizeStyle(props.size),
        setDefinedVars([drawerVars.offset, mapDefined(props.offset, sizeValue)])
      ],
      inner: [styles.inner, positions[position]],
      content: [styles.content, vertical ? across.vertical : across.horizontal],
      header: [styles.header],
      attributes: [],
      transition: { transition: transitions[position], ...props.transitionProps },
      radius: mapDefined(props.radius, radiusValue) ?? "0",
      config: config.Drawer
    })
  }
}
