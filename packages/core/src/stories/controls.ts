import { Predicate } from "effect"

export const controlSizes = ["xs", "sm", "md", "lg", "xl"] as const

export type ControlSize = (typeof controlSizes)[number]

export type SelectControl = {
  readonly type: "select"
  readonly prop: string
  readonly options: ReadonlyArray<string>
  readonly initial: string
  readonly library?: string
}

export type ColorControl = {
  readonly type: "color"
  readonly prop: string
  readonly initial: string
  readonly library?: string
}

export type SizeControl = {
  readonly type: "size"
  readonly prop: string
  readonly initial: ControlSize
  readonly library?: ControlSize
}

export type BooleanControl = {
  readonly type: "boolean"
  readonly prop: string
  readonly initial: boolean
  readonly library?: boolean
}

export type NumberControl = {
  readonly type: "number"
  readonly prop: string
  readonly initial: number
  readonly library?: number
  readonly min: number
  readonly max: number
  readonly step?: number
}

export type StringControl = {
  readonly type: "string"
  readonly prop: string
  readonly initial: string
  readonly library?: string
}

export type Control = SelectControl | ColorControl | SizeControl | BooleanControl | NumberControl | StringControl

type ValueOf<C extends Control> = C extends SelectControl
  ? C["options"][number]
  : C extends SizeControl
    ? ControlSize
    : C extends BooleanControl
      ? boolean
      : C extends NumberControl
        ? number
        : string

export type Values<Controls extends ReadonlyArray<Control>> = {
  readonly [C in Controls[number] as C["prop"]]: ValueOf<C>
}

export type Configurator<Controls extends ReadonlyArray<Control>> = {
  readonly controls: Controls
  readonly code: string
}

export const defineConfigurator = <const Controls extends ReadonlyArray<Control>>(
  configurator: Configurator<Controls>
): Configurator<Controls> => configurator

const isSize = (value: unknown): value is ControlSize => controlSizes.some((size) => size === value)

const accepts = (control: Control, value: unknown): boolean => {
  if (control.type === "select") return control.options.some((option) => option === value)
  if (control.type === "size") return isSize(value)
  if (control.type === "boolean") return Predicate.isBoolean(value)
  if (control.type === "number") return Predicate.isNumber(value)

  return Predicate.isString(value)
}

const argOf = (args: unknown, prop: string): unknown =>
  Predicate.isObject(args) && Predicate.hasProperty(args, prop) ? args[prop] : undefined

export function valuesOf<Controls extends ReadonlyArray<Control>>(controls: Controls, args: unknown): Values<Controls>
export function valuesOf(controls: ReadonlyArray<Control>, args: unknown): object {
  return Object.fromEntries(
    controls.map((control) => {
      const value = argOf(args, control.prop)

      return [control.prop, accepts(control, value) ? value : control.initial]
    })
  )
}

export const initialArgs = (controls: ReadonlyArray<Control>): Readonly<Record<string, unknown>> =>
  Object.fromEntries(controls.map((control) => [control.prop, control.initial]))
