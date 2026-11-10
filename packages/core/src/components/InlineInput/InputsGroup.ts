import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { InputWrapper } from "../Input/InputWrapper.ts"
import type { InputWrapperConfig, InputWrapperOptions, InputWrapperProps } from "../Input/InputWrapper.ts"
import type { InlineInputSize } from "./InlineInput.ts"

export type ControlProps<M> = {
  readonly id: string
  readonly value: string
  readonly checked: boolean
  readonly disabled: boolean
  readonly readOnly: boolean
  readonly size?: InlineInputSize
  readonly name?: string
  readonly onChange: (checked: boolean) => M
}

export type GroupControl<Props> = (value: string, props: Props) => Html

export type InputsGroupProps<M, Props> = Omit<InputWrapperProps, "input" | "labelElement" | "size"> & {
  readonly size?: InlineInputSize
  readonly value: ReadonlyArray<string>
  readonly onChange: (value: ReadonlyArray<string>) => M
  readonly maxSelectedValues?: number
  readonly disabled?: boolean
  readonly readOnly?: boolean
  readonly name?: string
  readonly children: (control: GroupControl<Props>) => ReadonlyArray<Child>
}

export type InputsGroupConfig = ComponentConfig<InputWrapperOptions, never>

const styles = stylex.create({
  group: { borderWidth: 0, padding: 0, margin: 0, minWidth: 0 },
  offsetTop: { paddingTop: `calc(${space.xs} / 2)` },
  offsetBottom: { paddingBottom: `calc(${space.xs} / 2)` }
})

const toggled = (value: ReadonlyArray<string>, item: string, checked: boolean): ReadonlyArray<string> =>
  checked ? [...value, item] : value.filter((existing) => existing !== item)

type ItemFlags = { readonly disabled?: boolean; readonly readOnly?: boolean }

export const inputsGroup =
  <Name extends string>(name: Name) =>
  <Props extends ItemFlags>(
    config: { readonly InputWrapper?: InputWrapperConfig } & { readonly [Key in Name]?: InputsGroupConfig },
    control: <M>(h: HtmlBuilder<M>, props: Props & ControlProps<M>) => Html
  ) => {
    const wrapper = InputWrapper(config)
    const own: InputsGroupConfig | undefined = config[name]

    return <M>(h: HtmlBuilder<M>, input: InputsGroupProps<M, Props>): Html => {
      const props = withDefaults(own, input)
      const full = props.maxSelectedValues !== undefined && props.value.length >= props.maxSelectedValues
      const groupControl: GroupControl<Props> = (value, item) => {
        const checked = props.value.includes(value)

        return control(h, {
          ...item,
          id: `${props.id}-${value}`,
          value,
          checked,
          ...(props.size === undefined ? {} : { size: props.size }),
          disabled: item.disabled === true || props.disabled === true || (full && !checked),
          readOnly: item.readOnly === true || props.readOnly === true,
          ...(props.name === undefined ? {} : { name: props.name }),
          onChange: (next: boolean) => props.onChange(toggled(props.value, value, next))
        })
      }
      const { children: _children, ...wrapperProps } = props

      return wrapper(h, {
        ...wrapperProps,
        labelElement: "div",
        input: (wiring) =>
          h.div(
            [
              ...sx(
                h,
                styles.group,
                wiring.offsetTop === true && styles.offsetTop,
                wiring.offsetBottom === true && styles.offsetBottom
              ),
              h.Role("group"),
              h.Id(props.id),
              ...(props.label === undefined ? [] : [h.AriaLabelledBy(`${props.id}-label`)]),
              ...(wiring.describedBy === undefined ? [] : [h.AriaDescribedBy(wiring.describedBy)])
            ],
            props.children(groupControl)
          )
      })
    }
  }
