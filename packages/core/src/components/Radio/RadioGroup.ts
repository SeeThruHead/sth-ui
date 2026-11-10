import * as FoldkitRadioGroup from "@foldkit/ui/radioGroup"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig } from "../../styles/StylesApi.ts"
import type { InlineInputSize } from "../InlineInput/InlineInput.ts"
import { InputWrapper } from "../Input/InputWrapper.ts"
import type { InputWrapperConfig, InputWrapperOptions, InputWrapperProps } from "../Input/InputWrapper.ts"
import { radioView } from "./Radio.ts"
import type { RadioConfig, RadioLook } from "./Radio.ts"

const bundle = FoldkitRadioGroup.create()

export const { Message, OutMessage } = FoldkitRadioGroup

export const { update } = bundle

export const Model = FoldkitRadioGroup.Model

export type Model = FoldkitRadioGroup.Model

export type Message = FoldkitRadioGroup.Message

export type OutMessage = FoldkitRadioGroup.OutMessage

export const init = (config: FoldkitRadioGroup.InitConfig): Model => FoldkitRadioGroup.init(config)

export type RadioOption = Omit<RadioLook, "size"> & { readonly value: string }

export type RadioGroupProps<M> = Omit<InputWrapperProps, "input" | "labelElement" | "size" | "id"> & {
  readonly model: Model
  readonly toParentMessage: (message: Message) => M
  readonly value?: string
  readonly options: ReadonlyArray<RadioOption>
  readonly size?: InlineInputSize
  readonly orientation?: "horizontal" | "vertical"
  readonly disabled?: boolean
  readonly readOnly?: boolean
  readonly name?: string
  readonly ariaLabel?: string
  readonly children?: (radios: ReadonlyArray<Html>) => ReadonlyArray<Child>
}

export type RadioGroupConfig = ComponentConfig<InputWrapperOptions, never>

const orientations = { horizontal: "Horizontal", vertical: "Vertical" } as const

export const RadioGroup = (config: {
  readonly RadioGroup?: RadioGroupConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Radio?: RadioConfig
}) => {
  const wrapper = InputWrapper(config)

  return <M>(h: HtmlBuilder<M>, input: RadioGroupProps<M>): Html => {
    const props = withDefaults(config.RadioGroup, input)
    const id = props.model.id
    const optionAt = (index: number) => Option.getOrThrow(Option.fromNullishOr(props.options[index]))
    const layout = props.children ?? ((radios: ReadonlyArray<Html>) => radios)
    const { children: _children, model: _model, toParentMessage: _lift, options: _options, ...wrapperProps } = props

    return wrapper(h, {
      ...wrapperProps,
      id,
      labelElement: "div",
      input: (wiring) =>
        h.submodel({
          slotId: id,
          model: props.model,
          view: bundle.view,
          toParentMessage: props.toParentMessage,
          viewInputs: {
            options: props.options.map((option) => option.value),
            selectedValue: Option.fromNullishOr(props.value),
            ariaLabel: props.ariaLabel ?? "",
            orientation: orientations[props.orientation ?? "vertical"],
            isOptionDisabled: (_value, index) => optionAt(index).disabled === true,
            hasOptionDescription: (_value, index) => optionAt(index).description !== undefined,
            isDisabled: props.disabled === true,
            isReadOnly: props.readOnly === true,
            ...(props.name === undefined ? {} : { name: props.name }),
            toView: (render) =>
              h.div(
                [
                  ...render.group,
                  ...(props.label === undefined ? [] : [h.AriaLabelledBy(`${id}-label`)]),
                  ...(wiring.describedBy === undefined ? [] : [h.AriaDescribedBy(wiring.describedBy)])
                ],
                [
                  ...layout(
                    render.options.map((option) =>
                      radioView(
                        h,
                        config.Radio,
                        {
                          ...optionAt(option.index),
                          ...(props.size === undefined ? {} : { size: props.size }),
                          disabled: option.isDisabled
                        },
                        {
                          id: `${id}-option-${option.index}`,
                          checked: option.isSelected,
                          control: option.option,
                          labelAttributes: [...option.label, h.For(`${id}-option-${option.index}`)]
                        }
                      )
                    )
                  ),
                  ...(props.name === undefined ? [] : [h.input([h.Type("hidden"), ...render.hiddenInput])])
                ]
              )
          }
        })
    })
  }
}
