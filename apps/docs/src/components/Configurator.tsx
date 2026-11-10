import React, { useState } from "react"
import { Example } from "./Example"
import type { StoryArgs } from "./Example"
import styles from "./Site.module.css"
import configurators from "../configurators.json"

type Value = string | number | boolean

type Control = {
  readonly type: string
  readonly prop: string
  readonly initial: Value
  readonly library?: Value
  readonly options?: ReadonlyArray<string>
  readonly min?: number
  readonly max?: number
  readonly step?: number
}

type Spec = { readonly controls: ReadonlyArray<Control>; readonly code: string }

const specs: Readonly<Record<string, Spec>> = configurators

const sizes = ["xs", "sm", "md", "lg", "xl"]

const swatches: ReadonlyArray<readonly [string, string]> = [
  ["dark", "#2e2e2e"],
  ["gray", "#868e96"],
  ["red", "#fa5252"],
  ["pink", "#e64980"],
  ["grape", "#be4bdb"],
  ["violet", "#7950f2"],
  ["indigo", "#4c6ef5"],
  ["blue", "#228be6"],
  ["cyan", "#15aabf"],
  ["teal", "#12b886"],
  ["green", "#40c057"],
  ["lime", "#82c91e"],
  ["yellow", "#fab005"],
  ["orange", "#fd7e14"]
]

const literal = (value: Value): string => (typeof value === "string" ? JSON.stringify(value) : String(value))

const propLiteral = (prop: string, value: Value): string =>
  prop === "children" ? `[${literal(value)}]` : literal(value)

const placeholder = (control: Control): string => `{{${control.prop}}}`

const valueOf = (control: Control, values: StoryArgs): Value => values[control.prop] ?? control.initial

export const codeOf = (spec: Spec, values: StoryArgs): string =>
  spec.controls
    .filter((control) => spec.code.includes(placeholder(control)))
    .reduce(
      (code, control) => code.replaceAll(placeholder(control), literal(valueOf(control, values))),
      spec.code.replace(
        "{{props}}",
        spec.controls
          .filter((control) => !spec.code.includes(placeholder(control)))
          .filter((control) => values[control.prop] !== control.library)
          .map((control) => `  ${control.prop}: ${propLiteral(control.prop, valueOf(control, values))},\n`)
          .join("")
      )
    )

const Field = ({
  label,
  value,
  children
}: {
  readonly label: string
  readonly value?: string
  readonly children: React.ReactNode
}) => (
  <div className={styles.control}>
    <span>
      <span className={styles.controlLabel}>{label}</span>
      {value === undefined ? null : <span className={styles.controlValue}>{value}</span>}
    </span>
    {children}
  </div>
)

const ControlInput = ({
  control,
  value,
  change
}: {
  readonly control: Control
  readonly value: Value
  readonly change: (value: Value) => void
}) => {
  if (control.type === "select")
    return (
      <select aria-label={control.prop} value={String(value)} onChange={(event) => change(event.target.value)}>
        {(control.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  if (control.type === "color")
    return (
      <div className={styles.swatches} role="radiogroup" aria-label={control.prop}>
        {swatches.map(([name, hex]) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={name === value}
            aria-label={name}
            title={name}
            className={styles.swatch}
            style={{ backgroundColor: hex }}
            onClick={() => change(name)}
          />
        ))}
      </div>
    )
  if (control.type === "size")
    return (
      <input
        type="range"
        aria-label={control.prop}
        aria-valuetext={String(value)}
        min={0}
        max={4}
        value={Math.max(0, sizes.indexOf(String(value)))}
        onChange={(event) => change(sizes[Number(event.target.value)] ?? "sm")}
      />
    )
  if (control.type === "boolean")
    return (
      <input
        type="checkbox"
        aria-label={control.prop}
        checked={value === true}
        onChange={(event) => change(event.target.checked)}
      />
    )
  if (control.type === "number")
    return (
      <input
        type="range"
        aria-label={control.prop}
        min={control.min}
        max={control.max}
        step={control.step ?? 1}
        value={Number(value)}
        onChange={(event) => change(Number(event.target.value))}
      />
    )

  return (
    <input
      type="text"
      aria-label={control.prop}
      value={String(value)}
      onChange={(event) => change(event.target.value)}
    />
  )
}

export const Configurator = ({ story, caption }: { readonly story: string; readonly caption?: string }) => {
  const spec = specs[story]
  const [values, setValues] = useState<StoryArgs>(() =>
    Object.fromEntries((spec?.controls ?? []).map((control) => [control.prop, control.initial]))
  )
  if (spec === undefined) return null

  return (
    <Example story={story} caption={caption ?? "Configurator"} args={values} code={codeOf(spec, values)}>
      <div className={styles.controls}>
        {spec.controls.map((control) => (
          <Field
            key={control.prop}
            label={control.prop}
            {...(control.type === "size" || control.type === "number" ? { value: String(values[control.prop]) } : {})}
          >
            <ControlInput
              control={control}
              value={values[control.prop] ?? control.initial}
              change={(value) => setValues({ ...values, [control.prop]: value })}
            />
          </Field>
        ))}
      </div>
    </Example>
  )
}
