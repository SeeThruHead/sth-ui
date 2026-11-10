import * as stylex from "@stylexjs/stylex"
import { setVars } from "../../styles/StylesApi.ts"
import { floatingVars } from "./Floating.stylex.ts"

export type FloatingPlacement =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-start"
  | "top-end"
  | "right-start"
  | "right-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"

export type ArrowOptions = {
  readonly position: FloatingPlacement
  readonly arrowSize: number
  readonly arrowOffset: number
  readonly arrowRadius: number
  readonly arrowPosition: "side" | "center"
  readonly centre: "anchor" | "self"
}

const half = `calc(${floatingVars.arrowSize} / -2)`

export const arrowStyles = stylex.create({
  arrow: {
    position: "absolute",
    zIndex: 1,
    width: floatingVars.arrowSize,
    height: floatingVars.arrowSize,
    transform: "rotate(45deg)",
    backgroundColor: "inherit",
    top: {
      default: null,
      [stylex.when.ancestor(':is([data-placement="bottom"])')]: half,
      [stylex.when.ancestor(':is([data-placement="left"])')]: floatingVars.alongY,
      [stylex.when.ancestor(':is([data-placement="right"])')]: floatingVars.alongY
    },
    bottom: { default: null, [stylex.when.ancestor(':is([data-placement="top"])')]: half },
    left: {
      default: null,
      [stylex.when.ancestor(':is([data-placement="right"])')]: half,
      [stylex.when.ancestor(':is([data-placement="top"])')]: floatingVars.alongX,
      [stylex.when.ancestor(':is([data-placement="bottom"])')]: floatingVars.alongX
    },
    right: { default: null, [stylex.when.ancestor(':is([data-placement="left"])')]: half },
    borderTopLeftRadius: {
      default: 0,
      [stylex.when.ancestor(':is([data-placement="bottom"])')]: floatingVars.arrowRadius
    },
    borderTopRightRadius: {
      default: 0,
      [stylex.when.ancestor(':is([data-placement="left"])')]: floatingVars.arrowRadius
    },
    borderBottomLeftRadius: {
      default: 0,
      [stylex.when.ancestor(':is([data-placement="right"])')]: floatingVars.arrowRadius
    },
    borderBottomRightRadius: {
      default: 0,
      [stylex.when.ancestor(':is([data-placement="top"])')]: floatingVars.arrowRadius
    }
  },
  bordered: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderTopColor: {
      default: "inherit",
      [stylex.when.ancestor(':is([data-placement="top"])')]: "transparent",
      [stylex.when.ancestor(':is([data-placement="right"])')]: "transparent"
    },
    borderRightColor: { default: "inherit", [stylex.when.ancestor(':is([data-placement="bottom"])')]: "transparent" },
    borderBottomColor: {
      default: "inherit",
      [stylex.when.ancestor(':is([data-placement="bottom"])')]: "transparent",
      [stylex.when.ancestor(':is([data-placement="left"])')]: "transparent"
    },
    borderLeftColor: {
      default: "inherit",
      [stylex.when.ancestor(':is([data-placement="top"])')]: "transparent",
      [stylex.when.ancestor(':is([data-placement="left"])')]: "transparent"
    },
    clipPath: {
      default: null,
      [stylex.when.ancestor(':is([data-placement="bottom"])')]: "polygon(0 100%, 0 0, 100% 0)",
      [stylex.when.ancestor(':is([data-placement="top"])')]: "polygon(0 100%, 100% 100%, 100% 0)",
      [stylex.when.ancestor(':is([data-placement="left"])')]: "polygon(100% 0, 0 0, 100% 100%)",
      [stylex.when.ancestor(':is([data-placement="right"])')]: "polygon(0 100%, 0 0, 100% 100%)"
    }
  },
  borderless: { borderWidth: 0 }
})

const along = (options: ArrowOptions, axis: "x" | "y"): string => {
  const placement = options.position.split("-")[1]
  const offset = `${options.arrowOffset}px`
  const centre = options.centre === "anchor" ? `var(--arrow-${axis}, 0px)` : `calc(50% - ${floatingVars.arrowSize} / 2)`
  if (options.arrowPosition === "center" || placement === undefined) return centre
  if (placement === "start") return offset

  return `calc(100% - ${offset} - ${floatingVars.arrowSize})`
}

export const arrowVars = (options: ArrowOptions) =>
  setVars(
    [floatingVars.arrowSize, `${options.arrowSize}px`],
    [floatingVars.alongX, along(options, "x")],
    [floatingVars.alongY, along(options, "y")],
    [floatingVars.arrowRadius, `${options.arrowRadius}px`]
  )
