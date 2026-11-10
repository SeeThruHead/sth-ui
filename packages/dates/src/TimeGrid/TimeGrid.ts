import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { radiusValue, spacing } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize } from "@sth-ui/core/theme/tokens.stylex.ts"
import { isSameTime } from "../time/clock.ts"
import type { AmPmLabels, TimeFormat } from "../time/clock.ts"
import { gridPick, timeDisabled } from "../time/grid.ts"
import type { DisableTime } from "../time/grid.ts"
import { timeValue } from "../TimeValue/TimeValue.ts"
import { timeGridVars } from "./timeGrid.stylex.ts"

export type TimeGridPart = "root" | "control" | "simpleGrid"

export type TimeGridSize = "xs" | "sm" | "md" | "lg" | "xl"

export type TimeGridOptions = {
  readonly format?: TimeFormat
  readonly amPmLabels?: AmPmLabels
  readonly withSeconds?: boolean
  readonly size?: TimeGridSize
  readonly radius?: StyleValue
  readonly cols?: number
  readonly spacing?: StyleValue
  readonly allowDeselect?: boolean
}

export type TimeGridControlProps = {
  readonly attributes?: Readonly<Record<string, string>>
}

export type TimeGridProps<M> = TimeGridOptions &
  StylesApiProps<TimeGridPart> & {
    readonly data: ReadonlyArray<string>
    readonly value: string | null
    readonly onChange?: (value: string | null) => M
    readonly minTime?: string
    readonly maxTime?: string
    readonly disableTime?: DisableTime
    readonly disabled?: boolean
    readonly getControlProps?: (time: string) => TimeGridControlProps
  }

export type TimeGridConfig = ComponentConfig<TimeGridOptions, TimeGridPart>

const sizes = stylex.create({
  xs: { fontSize: fontSize.xs },
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
  xl: { fontSize: fontSize.xl }
})

const styles = stylex.create({
  root: {},
  simpleGrid: { display: "grid" },
  control: {
    textAlign: "center",
    paddingInline: "1em",
    paddingBlock: "0.25em",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.defaultBorder,
    backgroundColor: { default: colors.default, ":hover:not([data-disabled])": colors.defaultHover },
    color: colors.defaultColor,
    borderRadius: timeGridVars.radius,
    fontSize: "inherit"
  },
  active: {
    backgroundColor: { default: accent.filled, ":hover:not([data-disabled])": accent.filledHover },
    color: palette.white,
    borderColor: "transparent"
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" }
})

export const TimeGrid =
  (config: { readonly TimeGrid?: TimeGridConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TimeGridProps<M>): Html => {
    const props = withDefaults(config.TimeGrid, input)
    const getStyles = stylesApi<M, TimeGridPart>(h, props, config.TimeGrid, "root")
    const withSeconds = props.withSeconds === true
    const options = {
      ...(props.allowDeselect === undefined ? {} : { allowDeselect: props.allowDeselect }),
      withSeconds
    }
    const limits = {
      ...(props.disabled === undefined ? {} : { disabled: props.disabled }),
      ...(props.minTime === undefined ? {} : { minTime: props.minTime }),
      ...(props.maxTime === undefined ? {} : { maxTime: props.maxTime }),
      ...(props.disableTime === undefined ? {} : { disableTime: props.disableTime }),
      withSeconds
    }
    const control = (time: string) => {
      const active = props.value !== null && isSameTime(time, props.value, withSeconds)
      const disabled = timeDisabled(time, limits)
      const message = Option.flatMap(Option.fromNullishOr(props.onChange), (onChange) =>
        Option.map(gridPick(props.value, time, options), onChange)
      )

      return h.button(
        [
          ...getStyles(
            "control",
            unstyledButtonStyles.root,
            styles.control,
            active && styles.active,
            disabled && styles.disabled
          ),
          h.Type("button"),
          ...(active ? [h.DataAttribute("active", "")] : []),
          ...(disabled ? [h.Disabled(true), h.DataAttribute("disabled", "")] : []),
          ...Option.match(message, { onNone: () => [], onSome: (change) => (disabled ? [] : [h.OnClick(change)]) }),
          ...Object.entries(props.getControlProps?.(time).attributes ?? {}).map(([name, value]) =>
            h.Attribute(name, value)
          )
        ],
        [
          timeValue({
            value: time,
            withSeconds,
            ...(props.format === undefined ? {} : { format: props.format }),
            ...(props.amPmLabels === undefined ? {} : { amPmLabels: props.amPmLabels })
          })
        ]
      )
    }

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          sizes[props.size ?? "sm"],
          setDefinedVars([timeGridVars.radius, mapDefined(props.radius, radiusValue)])
        )
      ],
      [
        h.div(
          [
            ...getStyles("simpleGrid", styles.simpleGrid),
            h.Style({
              gridTemplateColumns: `repeat(${props.cols ?? 3}, minmax(0, 1fr))`,
              gap: spacing(props.spacing ?? "xs")
            })
          ],
          props.data.map(control)
        )
      ]
    )
  }
