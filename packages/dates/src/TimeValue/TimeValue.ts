import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { formattedTime } from "../time/clock.ts"
import type { AmPmLabels, TimeFormat } from "../time/clock.ts"

export type TimeValueProps = {
  readonly value: string
  readonly format?: TimeFormat
  readonly amPmLabels?: AmPmLabels
  readonly withSeconds?: boolean
}

export const timeValue = (props: TimeValueProps): string =>
  Option.getOrElse(
    formattedTime(props.value, {
      ...(props.format === undefined ? {} : { format: props.format }),
      ...(props.amPmLabels === undefined ? {} : { amPmLabels: props.amPmLabels }),
      ...(props.withSeconds === undefined ? {} : { withSeconds: props.withSeconds })
    }),
    () => ""
  )

export const TimeValue =
  (_config: object) =>
  <M>(h: HtmlBuilder<M>, props: TimeValueProps): Html =>
    h.span([], [timeValue(props)])
