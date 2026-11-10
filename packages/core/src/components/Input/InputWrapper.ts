import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { styleProps } from "../../styles/styleProps.ts"
import type { StyleProps } from "../../styles/styleProps.ts"
import { stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "../../styles/StylesApi.ts"
import { colors, fontSize, fontWeight, lineHeight } from "../../theme/tokens.stylex.ts"
import { isShown } from "./Input.ts"
import type { InputSize, InputWiring } from "./Input.ts"

export type InputWrapperPart = "root" | "label" | "required" | "description" | "error" | "success"

export type InputWrapperSlot = "label" | "input" | "description" | "error"

export type InputWrapperOptions = {
  readonly size?: InputSize
  readonly inputWrapperOrder?: ReadonlyArray<InputWrapperSlot>
  readonly labelElement?: "label" | "div"
}

export type InputWrapperProps = InputWrapperOptions &
  StyleProps &
  StylesApiProps<InputWrapperPart> & {
    readonly id: string
    readonly label?: Child
    readonly description?: Child
    readonly error?: boolean | Child
    readonly success?: boolean | Child
    readonly required?: boolean
    readonly withAsterisk?: boolean
    readonly input: (wiring: InputWiring) => Html
  }

export type InputWrapperConfig = ComponentConfig<InputWrapperOptions, InputWrapperPart>

const labelSizes = stylex.create({
  xs: { fontSize: fontSize.xs },
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
  xl: { fontSize: fontSize.xl }
})

const noteSizes = stylex.create({
  xs: { fontSize: `calc(${fontSize.xs} - 2px)` },
  sm: { fontSize: `calc(${fontSize.sm} - 2px)` },
  md: { fontSize: `calc(${fontSize.md} - 2px)` },
  lg: { fontSize: `calc(${fontSize.lg} - 2px)` },
  xl: { fontSize: `calc(${fontSize.xl} - 2px)` }
})

const styles = stylex.create({
  root: { lineHeight: lineHeight.md },
  label: {
    display: "inline-block",
    fontWeight: fontWeight.medium,
    overflowWrap: "break-word",
    cursor: "default",
    WebkitTapHighlightColor: "transparent"
  },
  required: { color: colors.error },
  note: { overflowWrap: "break-word", lineHeight: 1.2, display: "block", margin: 0, padding: 0 },
  description: { color: colors.dimmed },
  error: { color: colors.error },
  success: { color: colors.success }
})

const defaultOrder: ReadonlyArray<InputWrapperSlot> = ["label", "description", "input", "error"]

const hasText = (value: boolean | Child | undefined): value is Child => isShown(value) && value !== true

export const inputWiring = (
  id: string,
  order: ReadonlyArray<InputWrapperSlot>,
  shown: { readonly description: boolean; readonly error: boolean; readonly success: boolean }
): InputWiring => {
  const at = order.indexOf("input")
  const above = order.slice(0, Math.max(at, 0))
  const below = order.slice(at + 1)
  const note = (part: InputWrapperSlot, present: boolean) => present && order.includes(part)
  const describedBy = [
    note("error", shown.error) ? `${id}-error` : "",
    note("error", shown.success) ? `${id}-success` : "",
    note("description", shown.description) ? `${id}-description` : ""
  ]
    .filter((part) => part !== "")
    .join(" ")
  const offset = (side: ReadonlyArray<InputWrapperSlot>) =>
    (shown.description && side.includes("description")) || ((shown.error || shown.success) && side.includes("error"))

  return {
    id,
    ...(describedBy === "" ? {} : { describedBy }),
    offsetTop: offset(above),
    offsetBottom: offset(below)
  }
}

type NoteKind = "description" | "error" | "success"

const note = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, InputWrapperPart>,
  kind: NoteKind,
  size: InputSize,
  id: string | undefined,
  child: Child
): Html =>
  h.p(
    [...getStyles(kind, styles.note, styles[kind], noteSizes[size]), ...(id === undefined ? [] : [h.Id(id)])],
    [child]
  )

const label = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, InputWrapperPart>,
  options: {
    readonly size: InputSize
    readonly element: "label" | "div"
    readonly id?: string
    readonly htmlFor?: string
    readonly required: boolean
  },
  child: Child
): Html =>
  h[options.element](
    [
      ...getStyles("label", styles.label, labelSizes[options.size]),
      ...(options.id === undefined ? [] : [h.Id(options.id)]),
      ...(options.htmlFor !== undefined && options.element === "label" ? [h.For(options.htmlFor)] : []),
      ...(options.required ? [h.DataAttribute("required", "")] : [])
    ],
    [
      child,
      ...(options.required ? [h.span([...getStyles("required", styles.required), h.AriaHidden(true)], [" *"])] : [])
    ]
  )

export const InputWrapper =
  (config: { readonly InputWrapper?: InputWrapperConfig }) =>
  <M>(h: HtmlBuilder<M>, input: InputWrapperProps): Html => {
    const props = withDefaults(config.InputWrapper, input)
    const { id: _id, ...rootProps } = props
    const getStyles = stylesApi<M, InputWrapperPart>(h, rootProps, config.InputWrapper, "root")
    const size = props.size ?? "sm"
    const order = props.inputWrapperOrder ?? defaultOrder
    const error = hasText(props.error) ? props.error : undefined
    const success = error === undefined && hasText(props.success) ? props.success : undefined
    const wiring = inputWiring(props.id, order, {
      description: props.description !== undefined,
      error: error !== undefined,
      success: success !== undefined
    })
    const parts: { readonly [Slot in InputWrapperSlot]: ReadonlyArray<Html> } = {
      label:
        props.label === undefined
          ? []
          : [
              label(
                h,
                getStyles,
                {
                  size,
                  element: props.labelElement ?? "label",
                  id: `${props.id}-label`,
                  htmlFor: props.id,
                  required: props.withAsterisk ?? props.required === true
                },
                props.label
              )
            ],
      description:
        props.description === undefined
          ? []
          : [note(h, getStyles, "description", size, `${props.id}-description`, props.description)],
      input: [props.input(wiring)],
      error: [
        ...(error === undefined ? [] : [note(h, getStyles, "error", size, `${props.id}-error`, error)]),
        ...(success === undefined ? [] : [note(h, getStyles, "success", size, `${props.id}-success`, success)])
      ]
    }

    return h.div(
      [
        ...getStyles("root", styles.root, ...styleProps(props)),
        ...(isShown(props.error) ? [h.DataAttribute("error", "")] : []),
        ...(success === undefined ? [] : [h.DataAttribute("success", "")])
      ],
      order.flatMap((slot) => parts[slot])
    )
  }

export type InputNoteConfig<Part extends string> = ComponentConfig<object, Part>

export type InputLabelProps = StylesApiProps<"label" | "required"> & {
  readonly size?: InputSize
  readonly labelElement?: "label" | "div"
  readonly htmlFor?: string
  readonly required?: boolean
  readonly children: ReadonlyArray<Child>
}

export const InputLabel =
  (config: { readonly InputLabel?: InputNoteConfig<"label" | "required"> }) =>
  <M>(h: HtmlBuilder<M>, input: InputLabelProps): Html => {
    const props = withDefaults(config.InputLabel, input)
    const getStyles = stylesApi<M, InputWrapperPart>(h, props, config.InputLabel, "label")

    return label(
      h,
      getStyles,
      {
        size: props.size ?? "sm",
        element: props.labelElement ?? "label",
        ...(props.htmlFor === undefined ? {} : { htmlFor: props.htmlFor }),
        required: props.required === true
      },
      h.span([], props.children)
    )
  }

export type InputNoteProps = StylesApiProps<NoteKind> & {
  readonly size?: InputSize
  readonly id?: string
  readonly children: ReadonlyArray<Child>
}

const standaloneNote =
  <Name extends "InputDescription" | "InputError" | "InputSuccess">(name: Name, kind: NoteKind) =>
  (config: { readonly [Key in Name]?: InputNoteConfig<NoteKind> }) =>
  <M>(h: HtmlBuilder<M>, input: InputNoteProps): Html => {
    const own = config[name]
    const props = withDefaults(own, input)
    const getStyles = stylesApi<M, InputWrapperPart>(h, props, own, kind)

    return note(h, getStyles, kind, props.size ?? "sm", props.id, h.span([], props.children))
  }

export const InputDescription = standaloneNote("InputDescription", "description")

export const InputError = standaloneNote("InputError", "error")

export const InputSuccess = standaloneNote("InputSuccess", "success")
