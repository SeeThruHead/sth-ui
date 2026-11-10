import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { containerVars } from "./Container.stylex.ts"

export type ContainerPart = "root"

export type ContainerSize = keyof typeof sizes

export type Breakout = {
  readonly _tag: "Breakout"
  readonly children: ReadonlyArray<Child>
  readonly row: StyleXStyles | undefined
}

export type ContainerOptions = {
  readonly size?: ContainerSize | number | (string & {})
  readonly fluid?: boolean
  readonly strategy?: "block" | "grid"
}

export type ContainerProps = ContainerOptions &
  StylesApiProps<ContainerPart> & { readonly children: ReadonlyArray<Child | Breakout> }

export type ContainerConfig = ComponentConfig<ContainerOptions, ContainerPart>

export const breakout = (children: ReadonlyArray<Child>, options: { readonly row?: StyleXStyles } = {}): Breakout => ({
  _tag: "Breakout",
  children,
  row: options.row
})

const styles = stylex.create({
  block: {
    [containerVars.size]: "960px",
    maxWidth: containerVars.size,
    paddingInline: space.md,
    marginInline: "auto"
  },
  fluid: { maxWidth: "100%" },
  grid: {
    [containerVars.size]: "960px",
    display: "grid",
    gridTemplateColumns: `1fr min(100%, ${containerVars.size}) 1fr`,
    marginInline: "auto"
  },
  cell: { gridColumn: "2" },
  breakout: { gridColumn: "1 / -1" },
  breakoutInner: { maxWidth: containerVars.size, marginInline: "auto" }
})

const sizes = stylex.create({
  xs: { [containerVars.size]: "540px" },
  sm: { [containerVars.size]: "720px" },
  md: { [containerVars.size]: "960px" },
  lg: { [containerVars.size]: "1140px" },
  xl: { [containerVars.size]: "1320px" }
})

const isSize = (size: string): size is ContainerSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: ContainerOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([containerVars.size, rem(size)])
  if (isSize(size)) return sizes[size]

  return setVars([containerVars.size, size])
}

const isBreakout = (child: Child | Breakout): child is Breakout => Predicate.isTagged(child, "Breakout")

const gridChild = <M>(h: HtmlBuilder<M>, child: Child | Breakout): Html =>
  isBreakout(child)
    ? h.div(sx(h, styles.breakout, child.row), [h.div(sx(h, styles.breakoutInner), child.children)])
    : h.div(sx(h, styles.cell), [child])

const blockChild = (child: Child | Breakout): ReadonlyArray<Child> => (isBreakout(child) ? child.children : [child])

export const Container =
  (config: { readonly Container?: ContainerConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ContainerProps): Html => {
    const props = withDefaults(config.Container, input)
    const getStyles = stylesApi<M, ContainerPart>(h, props, config.Container, "root")
    const grid = props.strategy === "grid"
    const fluid = props.fluid === true

    return h.div(
      getStyles(
        "root",
        grid ? styles.grid : styles.block,
        fluid ? null : sizeStyle(props.size),
        fluid && !grid && styles.fluid
      ),
      grid ? props.children.map((child) => gridChild(h, child)) : props.children.flatMap(blockChild)
    )
  }
