import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, ElementAttribute, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { accent } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { loaderVars } from "./Loader.stylex.ts"

export type LoaderPart = "root"

export type LoaderType = "oval" | "bars" | "dots" | (string & {})

export type LoaderView = <M>(h: HtmlBuilder<M>, root: (shape: Sx) => ReadonlyArray<ElementAttribute<M>>) => Html

export type LoadersRecord = { readonly [type: string]: LoaderView }

export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"

export type LoaderOptions = {
  readonly size?: LoaderSize | number | (string & {})
  readonly color?: string
  readonly type?: LoaderType
  readonly loaders?: LoadersRecord
}

export type LoaderProps = LoaderOptions &
  StylesApiProps<LoaderPart> & {
    readonly label?: string
    readonly children?: ReadonlyArray<Child>
  }

export type LoaderConfig = ComponentConfig<LoaderOptions, LoaderPart>

const ovalSpin = stylex.keyframes({ "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } })

const barsPulse = stylex.keyframes({
  "0%": { transform: "scale(0.6)", opacity: 0 },
  "50%, 100%": { transform: "scale(1)" }
})

const dotsPulse = stylex.keyframes({
  "0%, 100%": { transform: "scale(1)", opacity: 1 },
  "50%": { transform: "scale(0.6)", opacity: 0.5 }
})

const sizes = stylex.create({
  xs: { [loaderVars.size]: "18px" },
  sm: { [loaderVars.size]: "22px" },
  md: { [loaderVars.size]: "36px" },
  lg: { [loaderVars.size]: "44px" },
  xl: { [loaderVars.size]: "58px" }
})

const styles = stylex.create({
  base: { [loaderVars.color]: accent.filled },
  oval: {
    display: "inline-block",
    boxSizing: "border-box",
    width: loaderVars.size,
    height: loaderVars.size,
    borderRadius: "10000px",
    borderWidth: `calc(${loaderVars.size} / 8)`,
    borderStyle: "solid",
    borderTopColor: loaderVars.color,
    borderRightColor: loaderVars.color,
    borderBottomColor: loaderVars.color,
    borderLeftColor: "transparent",
    animationName: ovalSpin,
    animationDuration: "1.2s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite"
  },
  bars: {
    position: "relative",
    width: loaderVars.size,
    height: loaderVars.size,
    display: "flex",
    gap: `calc(${loaderVars.size} / 5)`
  },
  bar: {
    flex: 1,
    backgroundColor: loaderVars.color,
    animationName: barsPulse,
    animationDuration: "1.2s",
    animationTimingFunction: "cubic-bezier(0, 0.5, 0.5, 1)",
    animationIterationCount: "infinite",
    borderRadius: "2px"
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: `calc(${loaderVars.size} / 10)`,
    position: "relative",
    width: loaderVars.size,
    height: loaderVars.size
  },
  dot: {
    width: `calc(${loaderVars.size} / 3 - ${loaderVars.size} / 15)`,
    height: `calc(${loaderVars.size} / 3 - ${loaderVars.size} / 15)`,
    borderRadius: "50%",
    backgroundColor: loaderVars.color,
    animationName: dotsPulse,
    animationDuration: "0.8s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite"
  },
  barDelay0: { animationDelay: "-240ms" },
  barDelay1: { animationDelay: "-120ms" },
  barDelay2: { animationDelay: "0ms" },
  dotDelay: { animationDelay: "0.4s" }
})

const pieceStyles = (type: "bars" | "dots"): ReadonlyArray<ReadonlyArray<Sx>> =>
  type === "bars"
    ? [
        [styles.bar, styles.barDelay0],
        [styles.bar, styles.barDelay1],
        [styles.bar, styles.barDelay2]
      ]
    : [[styles.dot], [styles.dot, styles.dotDelay], [styles.dot]]

const isLoaderSize = (size: string): size is LoaderSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: LoaderOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([loaderVars.size, rem(size)])
  if (isLoaderSize(size)) return sizes[size]

  return setVars([loaderVars.size, size])
}

const pieces = <M>(h: HtmlBuilder<M>, kinds: ReadonlyArray<ReadonlyArray<Sx>>): ReadonlyArray<Html> =>
  kinds.map((piece) => h.span(sx(h, ...piece), []))

const oval: LoaderView = (h, root) => h.span(root(styles.oval), [])

export const defaultLoaders: LoadersRecord = {
  oval,
  bars: (h, root) => h.span(root(styles.bars), pieces(h, pieceStyles("bars"))),
  dots: (h, root) => h.span(root(styles.dots), pieces(h, pieceStyles("dots")))
}

export const Loader =
  (config: { readonly Loader?: LoaderConfig }) =>
  <M>(h: HtmlBuilder<M>, input: LoaderProps): Html => {
    const props = withDefaults(config.Loader, input)
    const getStyles = stylesApi(h, props, config.Loader, "root")
    const color = accentStyle(props.color, (value) => setVars([loaderVars.color, value]))
    const status = [h.Role("status"), h.AriaLabel(props.label ?? "Loading")]
    const root = (shape: Sx): ReadonlyArray<ElementAttribute<M>> => [
      ...getStyles("root", styles.base, ...color, sizeStyle(props.size), shape),
      ...status
    ]
    if (props.children !== undefined) return h.span(root(null), props.children)
    const loaders: LoadersRecord = { ...defaultLoaders, ...props.loaders }
    const view = loaders[props.type ?? "oval"] ?? oval

    return view(h, root)
  }
