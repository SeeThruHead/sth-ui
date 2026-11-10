import { everyPoint, points, sizeValue, spacing } from "../../styles/styleProps.ts"
import { rem } from "../../theme/units.ts"
import type { Breakpoint, Point, Responsive, StyleValue } from "../../styles/styleProps.ts"
import { shellVars } from "./AppShell.stylex.ts"
import { shellNames } from "./names.ts"
import type { ShellName } from "./names.ts"

export type ShellSize = Responsive<StyleValue>

export type SideConfiguration = {
  readonly width: ShellSize
  readonly breakpoint: Breakpoint
  readonly collapsed?: { readonly mobile?: boolean; readonly desktop?: boolean }
}

export type EdgeConfiguration = {
  readonly height: ShellSize
  readonly collapsed?: boolean
  readonly offset?: boolean
}

export type ShellMode = "fixed" | "static"

export type ShellLayout = "default" | "alt"

export type Shell = {
  readonly navbar?: SideConfiguration | undefined
  readonly aside?: SideConfiguration | undefined
  readonly header?: EdgeConfiguration | undefined
  readonly footer?: EdgeConfiguration | undefined
  readonly padding?: Responsive<StyleValue> | undefined
  readonly mode: ShellMode
  readonly layout: ShellLayout
  readonly disabled: boolean
  readonly sizes?: ShellSizes | undefined
}

export type ShellSizes = {
  readonly navbar?: number | undefined
  readonly aside?: number | undefined
  readonly header?: number | undefined
  readonly footer?: number | undefined
}

type Side = {
  readonly width: string
  readonly offset: string
  readonly transform: string
  readonly position: string
  readonly display: string
  readonly row: string
  readonly column: string
  readonly grid: string
  readonly docked: boolean
  readonly handle: string
}

type Edge = { readonly height: string; readonly offset: string }

const at = <Value>(value: Responsive<Value>, point: Point): Value | undefined =>
  everyPoint(value).find(([found]) => found === point)?.[1]

const sizeAt = (value: ShellSize, point: Point): string => {
  const found = at(value, point)

  return found === undefined ? "0px" : sizeValue(found)
}

const absent: Side = {
  width: "0px",
  offset: "0px",
  transform: "none",
  position: "fixed",
  display: "flex",
  row: "auto",
  column: "auto",
  grid: "0px",
  docked: false,
  handle: "none"
}

const isMobile = (point: Point, breakpoint: Breakpoint): boolean => points.indexOf(point) < points.indexOf(breakpoint)

const side = (
  config: SideConfiguration | undefined,
  point: Point,
  shell: Shell,
  hide: string,
  column: string,
  resized: number | undefined
): Side => {
  if (config === undefined) return absent
  if (isMobile(point, config.breakpoint))
    return { ...absent, width: "100%", transform: config.collapsed?.mobile === true ? hide : "none" }
  const width = resized === undefined ? sizeAt(config.width, point) : `min(${rem(resized)}, 100vw)`
  const collapsed = config.collapsed?.desktop === true
  const open: Side = {
    ...absent,
    width,
    offset: collapsed ? "0px" : width,
    transform: collapsed ? hide : "none",
    handle: collapsed ? "none" : "block"
  }
  if (shell.mode === "fixed") return open
  if (collapsed) return { ...open, width: "0px", display: "none" }

  return {
    ...open,
    position: "sticky",
    row: shell.layout === "alt" ? "1 / -1" : "2",
    column,
    grid: width,
    docked: true
  }
}

const edge = (config: EdgeConfiguration | undefined, point: Point, shell: Shell, resized: number | undefined): Edge => {
  if (config === undefined) return { height: "0px", offset: "0px" }
  const height = resized === undefined ? sizeAt(config.height, point) : `min(${rem(resized)}, 100dvh)`
  const offsets = shell.mode === "static" || config.offset !== false
  const hidden = shell.mode === "fixed" && config.collapsed === true

  return { height, offset: offsets && !hidden ? height : "0px" }
}

const valuesAt = (shell: Shell, point: Point): { readonly [Name in ShellName]: string } => {
  const navbar = side(
    shell.navbar,
    point,
    shell,
    `translateX(calc(${shellVars.navbarWidth} * -1))`,
    "1",
    shell.sizes?.navbar
  )
  const aside = side(shell.aside, point, shell, `translateX(${shellVars.asideWidth})`, "3", shell.sizes?.aside)
  const header = edge(shell.header, point, shell, shell.sizes?.header)
  const footer = edge(shell.footer, point, shell, shell.sizes?.footer)
  const offset = (value: string): string => (shell.disabled ? "0px" : value)

  return {
    navbarWidth: navbar.width,
    navbarOffset: offset(navbar.offset),
    navbarTransform: navbar.transform,
    navbarPosition: navbar.position,
    navbarDisplay: navbar.display,
    navbarRow: navbar.row,
    navbarColumn: navbar.column,
    navbarHandle: navbar.handle,
    asideWidth: aside.width,
    asideOffset: offset(aside.offset),
    asideTransform: aside.transform,
    asidePosition: aside.position,
    asideDisplay: aside.display,
    asideRow: aside.row,
    asideColumn: aside.column,
    asideHandle: aside.handle,
    headerHeight: header.height,
    headerOffset: offset(header.offset),
    footerHeight: footer.height,
    footerOffset: offset(footer.offset),
    padding: spacing(at(shell.padding ?? 0, point) ?? 0),
    columns: `${navbar.grid} 1fr ${aside.grid}`,
    mainStart: navbar.docked ? "2" : "1",
    mainEnd: aside.docked ? "3" : "-1"
  }
}

export const shellPointVars = (shell: Shell): ReadonlyArray<readonly [string, string]> =>
  points.flatMap((point) => {
    const values = valuesAt(shell, point)

    return shellNames.map((name): readonly [string, string] => [shellVars[`${name}_${point}`], values[name]])
  })
