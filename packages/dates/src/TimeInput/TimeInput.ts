import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { InputConfig } from "@sth-ui/core/components/Input/Input.ts"
import { inputBase } from "@sth-ui/core/components/Input/InputBase.ts"
import { mergeStyles } from "@sth-ui/core/styles/StylesApi.ts"
import type { InputBaseConfig, InputBaseProps } from "@sth-ui/core/components/Input/InputBase.ts"
import type { InputWrapperConfig } from "@sth-ui/core/components/Input/InputWrapper.ts"
import { clampTime } from "../time/time.ts"

export type TimeInputProps<M> = Omit<InputBaseProps<M>, "type" | "value" | "onInput" | "onChange" | "component"> & {
  readonly value: string
  readonly onChange?: (value: string) => M
  readonly withSeconds?: boolean
  readonly minTime?: string
  readonly maxTime?: string
  readonly step?: number
}

export type TimeInputConfig = InputBaseConfig

const styles = stylex.create({
  input: {
    paddingTop: 0,
    paddingBottom: 0,
    appearance: "none",
    "::-webkit-calendar-picker-indicator": { display: "none" },
    "::-webkit-clear-button": { display: "none" }
  }
})

export const TimeInput = (config: {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly TimeInput?: TimeInputConfig
}) => {
  const base = inputBase("TimeInput")(config)

  return <M>(h: HtmlBuilder<M>, props: TimeInputProps<M>): Html => {
    const limits = {
      ...(props.minTime === undefined ? {} : { minTime: props.minTime }),
      ...(props.maxTime === undefined ? {} : { maxTime: props.maxTime }),
      withSeconds: props.withSeconds === true
    }
    const clamped = clampTime(props.value, limits)
    const onChange = props.onChange
    const blur = Option.isSome(clamped) && onChange !== undefined ? Option.some(onChange(clamped.value)) : Option.none()
    const {
      withSeconds: _withSeconds,
      minTime: _minTime,
      maxTime: _maxTime,
      step,
      onChange: _onChange,
      ...rest
    } = props

    return base(h, {
      ...rest,
      type: "time",
      value: props.value,
      styles: { ...props.styles, ...mergeStyles(["input"], { input: [styles.input] }, props.styles) },
      attributes: {
        ...props.attributes,
        input: { ...props.attributes?.input, step: String(step ?? (props.withSeconds === true ? 1 : 60)) }
      },
      ...(onChange === undefined ? {} : { onInput: onChange }),
      ...Option.match(blur, { onNone: () => ({}), onSome: (message) => ({ onBlur: message }) })
    })
  }
}
