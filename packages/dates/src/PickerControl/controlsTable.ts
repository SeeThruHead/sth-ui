import type { StyleXStyles } from "@stylexjs/stylex"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { GetStyles, PartStyles } from "@sth-ui/core/styles/StylesApi.ts"
import type { DateString } from "../date/date.ts"
import type { DaySize } from "../Day/Day.ts"
import type { PickerControlPart, PickerControlProps } from "./PickerControl.ts"

export type ControlState = {
  readonly selected?: boolean
  readonly inRange?: boolean
  readonly firstInRange?: boolean
  readonly lastInRange?: boolean
  readonly disabled?: boolean
}

type Control = <M>(h: HtmlBuilder<M>, props: PickerControlProps<M>) => Html

export type ControlsTable<M, Part extends string> = {
  readonly getStyles: GetStyles<M, Part>
  readonly tableStyle: StyleXStyles
  readonly parts: { readonly table: Part; readonly row: Part; readonly cell: Part }
  readonly rows: ReadonlyArray<ReadonlyArray<DateString>>
  readonly same: (a: DateString, b: DateString) => boolean
  readonly label: (value: DateString) => string
  readonly ariaLabel: (value: DateString) => string
  readonly disabled: (value: DateString) => boolean
  readonly size: DaySize
  readonly withCellSpacing: boolean
  readonly fullWidth: boolean
  readonly forwarded: { readonly styles?: PartStyles<Part | PickerControlPart>; readonly unstyled?: boolean }
  readonly today?: DateString
  readonly focusableDate?: DateString
  readonly controlProps?: (value: DateString) => ControlState
  readonly onClick?: (value: DateString) => M
  readonly onMouseEnter?: (value: DateString) => M
}

const styles = stylex.create({ cell: { padding: 0 }, spacing: { padding: "0.5px" }, fullWidth: { width: "100%" } })

const tabTarget = <M, Part extends string>(spec: ControlsTable<M, Part>, enabled: ReadonlyArray<DateString>) => {
  const matches = (target: DateString | undefined) => (value: DateString) =>
    target !== undefined && spec.same(value, target)
  const focusable = enabled.find(matches(spec.focusableDate))
  const selected = enabled.find((value) => spec.controlProps?.(value).selected === true)
  const today = enabled.find(matches(spec.today))

  return focusable ?? selected ?? today ?? enabled[0]
}

export const controlsTable = <M, Part extends string>(
  h: HtmlBuilder<M>,
  control: Control,
  spec: ControlsTable<M, Part>
): Html => {
  const disabled = (value: DateString) => spec.disabled(value) || spec.controlProps?.(value).disabled === true
  const target = tabTarget(
    spec,
    spec.rows.flat().filter((value) => !disabled(value))
  )
  const forwarded = {
    ...(spec.forwarded.styles === undefined ? {} : { styles: spec.forwarded.styles }),
    ...(spec.forwarded.unstyled === undefined ? {} : { unstyled: spec.forwarded.unstyled })
  }

  return h.table(
    [...spec.getStyles(spec.parts.table, spec.tableStyle, spec.fullWidth && styles.fullWidth)],
    [
      h.tbody(
        [],
        spec.rows.map((row) =>
          h.tr(
            spec.getStyles(spec.parts.row),
            row.map((value) =>
              h.td(spec.getStyles(spec.parts.cell, styles.cell, spec.withCellSpacing && styles.spacing), [
                control(h, {
                  ...forwarded,
                  ...spec.controlProps?.(value),
                  disabled: disabled(value),
                  size: spec.size,
                  fullWidth: spec.fullWidth,
                  value,
                  ariaLabel: spec.ariaLabel(value),
                  tabIndex: target !== undefined && spec.same(value, target) ? 0 : -1,
                  children: [spec.label(value)],
                  ...(spec.onClick === undefined ? {} : { onClick: spec.onClick(value) }),
                  ...(spec.onMouseEnter === undefined ? {} : { onMouseEnter: spec.onMouseEnter(value) })
                })
              ])
            )
          )
        )
      )
    ]
  )
}
