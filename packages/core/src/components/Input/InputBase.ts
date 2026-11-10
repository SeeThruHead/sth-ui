import { Struct } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { stylePropNames } from "../../styles/styleProps.ts"
import type { StyleProps } from "../../styles/styleProps.ts"
import { mergeStyles, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { Input } from "./Input.ts"
import type { InputConfig, InputOptions, InputPart, InputProps, InputWiring } from "./Input.ts"
import { InputWrapper } from "./InputWrapper.ts"
import type { InputWrapperConfig, InputWrapperOptions, InputWrapperPart } from "./InputWrapper.ts"

export type InputBasePart = InputPart | InputWrapperPart

export type InputBaseOptions = InputOptions & InputWrapperOptions

export type InputBaseProps<M> = InputBaseOptions &
  StyleProps &
  StylesApiProps<InputBasePart> &
  Omit<InputProps<M>, keyof InputOptions | keyof StyleProps | keyof StylesApiProps<InputPart> | keyof InputWiring> & {
    readonly id: string
    readonly label?: Child
    readonly description?: Child
    readonly success?: boolean | Child
    readonly withAsterisk?: boolean
  }

export type InputBaseConfig = ComponentConfig<InputBaseOptions, InputBasePart>

const inputParts: ReadonlyArray<InputPart> = ["wrapper", "input", "section", "bottomSection"]

const wrapperParts: ReadonlyArray<InputWrapperPart> = ["root", "label", "required", "description", "error", "success"]

type Configs = {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly CloseButton?: CloseButtonConfig
}

export const inputBase =
  <Name extends string>(name: Name) =>
  (config: Configs & { readonly [Key in Name]?: InputBaseConfig }) => {
    const input = Input(config)
    const wrapper = InputWrapper(config)
    const own: InputBaseConfig | undefined = config[name]

    return <M>(h: HtmlBuilder<M>, given: InputBaseProps<M>): Html => {
      const props = withDefaults(own, given)
      const field = Struct.omit(props, stylePropNames)

      return wrapper(h, {
        ...props,
        styles: mergeStyles(wrapperParts, own?.styles, props.styles),
        input: (wiring: InputWiring) =>
          input(h, { ...field, ...wiring, styles: mergeStyles(inputParts, own?.styles, props.styles) })
      })
    }
  }

export const InputBase = inputBase("InputBase")

export const TextInput = inputBase("TextInput")

export type TextareaProps<M> = Omit<InputBaseProps<M>, "component" | "multiline" | "type">

export const Textarea = (config: Configs & { readonly Textarea?: InputBaseConfig }) => {
  const base = inputBase("Textarea")(config)

  return <M>(h: HtmlBuilder<M>, props: TextareaProps<M>): Html =>
    base(h, { ...props, component: "textarea", multiline: true })
}
