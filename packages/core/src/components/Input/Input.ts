import * as stylex from "@stylexjs/stylex"
import { Option, Predicate } from "effect"
import type { ChildAttribute, Html, HtmlBuilder, TextareaAttribute } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, styleProps } from "../../styles/styleProps.ts"
import type { StyleProps, StyleValue } from "../../styles/styleProps.ts"
import { forwardPart, mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, ElementAttribute, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, font, fontSize, lineHeight, radius, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig, CloseButtonProps } from "../CloseButton/CloseButton.ts"
import { Loader } from "../Loader/Loader.ts"
import type { LoaderConfig, LoaderProps } from "../Loader/Loader.ts"
import { inputVars } from "./Input.stylex.ts"

export type InputPart = "wrapper" | "input" | "section" | "bottomSection"

export type InputSize = keyof typeof sizes

export type InputVariant = "default" | "filled" | "unstyled"

export type PointerEvents = "none" | "all" | "auto"

export type InputOptions = {
  readonly variant?: InputVariant
  readonly size?: InputSize
  readonly radius?: StyleValue
  readonly withErrorStyles?: boolean
  readonly withSuccessStyles?: boolean
  readonly withAria?: boolean
  readonly leftSectionPointerEvents?: PointerEvents
  readonly rightSectionPointerEvents?: PointerEvents
  readonly loadingPosition?: "left" | "right"
}

export type InputWiring = {
  readonly id: string
  readonly describedBy?: string
  readonly offsetTop?: boolean
  readonly offsetBottom?: boolean
}

export type InputProps<M> = InputOptions &
  StyleProps &
  StylesApiProps<InputPart> &
  Partial<InputWiring> & {
    readonly component?: "input" | "textarea" | "select" | "button" | "div"
    readonly fieldBind?: ReadonlyArray<ChildAttribute>
    readonly type?: string
    readonly name?: string
    readonly value?: string
    readonly placeholder?: string
    readonly autoComplete?: string
    readonly inputSize?: string
    readonly readOnly?: boolean
    readonly required?: boolean
    readonly disabled?: boolean
    readonly error?: boolean | Child
    readonly success?: boolean | Child
    readonly pointer?: boolean
    readonly multiline?: boolean
    readonly resize?: "none" | "both" | "horizontal" | "vertical"
    readonly autosize?: boolean
    readonly minRows?: number
    readonly maxRows?: number
    readonly bottomSection?: Child
    readonly leftSection?: Child
    readonly leftSectionWidth?: StyleValue
    readonly rightSection?: Child
    readonly rightSectionWidth?: StyleValue
    readonly loading?: boolean
    readonly loaderProps?: LoaderProps
    readonly onInput?: (value: string) => M
    readonly onChange?: (value: string) => M
    readonly onFocus?: M
    readonly onClick?: M
    readonly onBlur?: M
    readonly onKeyDown?: (key: string) => Option.Option<M>
    readonly onBeforeInput?: (inputType: string, data: Option.Option<string>) => Option.Option<M>
    readonly inputMode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url"
    readonly children?: ReadonlyArray<Child>
  }

export type InputConfig = ComponentConfig<InputOptions, InputPart>

const sizes = stylex.create({
  xs: { [inputVars.height]: "30px", [inputVars.fz]: fontSize.xs, [inputVars.paddingY]: "5px" },
  sm: { [inputVars.height]: "36px", [inputVars.fz]: fontSize.sm, [inputVars.paddingY]: "6px" },
  md: { [inputVars.height]: "42px", [inputVars.fz]: fontSize.md, [inputVars.paddingY]: "8px" },
  lg: { [inputVars.height]: "50px", [inputVars.fz]: fontSize.lg, [inputVars.paddingY]: "10px" },
  xl: { [inputVars.height]: "60px", [inputVars.fz]: fontSize.xl, [inputVars.paddingY]: "13px" }
})

const multilinePadding = stylex.create({
  xs: { [inputVars.paddingY]: "4.5px" },
  sm: { [inputVars.paddingY]: "5.5px" },
  md: { [inputVars.paddingY]: "7px" },
  lg: { [inputVars.paddingY]: "9.5px" },
  xl: { [inputVars.paddingY]: "13px" }
})

const variants = stylex.create({
  default: {
    [inputVars.bd]: `light-dark(${palette.gray4}, ${palette.dark4})`,
    [inputVars.bg]: `light-dark(${palette.white}, ${palette.dark6})`,
    [inputVars.bdFocus]: accent.filled
  },
  filled: {
    [inputVars.bd]: "transparent",
    [inputVars.bg]: `light-dark(${palette.gray1}, ${palette.dark5})`,
    [inputVars.bdFocus]: accent.filled
  },
  unstyled: { [inputVars.bd]: "transparent", [inputVars.bg]: "transparent", [inputVars.bdFocus]: "transparent" }
})

const sectionSize = `calc(${inputVars.height} - 2px)`

const styles = stylex.create({
  wrapper: {
    [inputVars.radius]: radius.default,
    [inputVars.leftSize]: sectionSize,
    [inputVars.rightSize]: sectionSize,
    [inputVars.color]: colors.text,
    [inputVars.placeholder]: colors.placeholder,
    [inputVars.section]: colors.dimmed,
    position: "relative",
    marginTop: 0,
    marginBottom: 0
  },
  offsetTop: { marginTop: `calc(${space.xs} / 2)` },
  offsetBottom: { marginBottom: `calc(${space.xs} / 2)` },
  error: {
    [inputVars.color]: colors.error,
    [inputVars.placeholder]: colors.error,
    [inputVars.section]: colors.error
  },
  errorBorder: { [inputVars.bd]: colors.error, [inputVars.bdFocus]: colors.error },
  successBorder: { [inputVars.bd]: colors.success, [inputVars.bdFocus]: colors.success },
  success: { [inputVars.section]: colors.success },
  input: {
    WebkitTapHighlightColor: "transparent",
    appearance: "none",
    resize: inputVars.resize,
    display: "block",
    width: "100%",
    transition: "border-color 100ms ease",
    textAlign: "start",
    color: inputVars.color,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: { default: inputVars.bd, ":focus": inputVars.bdFocus, ":focus-within": inputVars.bdFocus },
    outline: { default: null, ":focus": "none", ":focus-within": "none" },
    backgroundColor: inputVars.bg,
    fontFamily: font.body,
    height: inputVars.height,
    minHeight: inputVars.height,
    lineHeight: `calc(${inputVars.height} - 2px)`,
    fontSize: inputVars.fz,
    borderRadius: inputVars.radius,
    paddingInlineStart: `calc(${inputVars.height} / 3)`,
    paddingInlineEnd: `calc(${inputVars.height} / 3)`,
    paddingTop: 0,
    paddingBottom: 0,
    cursor: "text",
    caretColor: { default: null, ":read-only": "transparent" },
    "::placeholder": { color: inputVars.placeholder, opacity: 1 },
    "::-webkit-inner-spin-button": { appearance: "none" },
    "::-webkit-outer-spin-button": { appearance: "none" },
    "::-webkit-search-cancel-button": { appearance: "none" }
  },
  withLeft: { paddingInlineStart: inputVars.leftSize },
  withRight: { paddingInlineEnd: inputVars.rightSize },
  unstyled: { paddingInlineStart: 0, paddingInlineEnd: 0 },
  multiline: {
    height: "auto",
    lineHeight: lineHeight.md,
    paddingTop: inputVars.paddingY,
    paddingBottom: inputVars.paddingY
  },
  autosize: {
    fieldSizing: "content",
    minHeight: `calc(${inputVars.minRows} * 1lh + 2 * ${inputVars.paddingY} + 2px + ${inputVars.bottomExtra})`,
    maxHeight: `calc(${inputVars.maxRows} * 1lh + 2 * ${inputVars.paddingY} + 2px + ${inputVars.bottomExtra})`
  },
  withBottom: {
    [inputVars.bottomExtra]: inputVars.bottomSize,
    paddingBottom: `calc(${inputVars.paddingY} + ${inputVars.bottomSize})`
  },
  bottomSection: {
    position: "absolute",
    bottom: "1px",
    left: "1px",
    right: "1px",
    height: inputVars.bottomSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingInline: `calc(${inputVars.height} / 3)`,
    borderEndStartRadius: inputVars.radius,
    borderEndEndRadius: inputVars.radius,
    pointerEvents: "all",
    color: colors.dimmed,
    fontSize: inputVars.fz
  },
  pointer: { cursor: "pointer" },
  disabled: {
    cursor: "not-allowed",
    opacity: 0.6,
    backgroundColor: colors.disabled,
    color: colors.disabledColor
  },
  section: {
    position: "absolute",
    zIndex: 1,
    top: "1px",
    bottom: "1px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: inputVars.section
  },
  left: {
    insetInlineStart: "1px",
    width: inputVars.leftSize,
    pointerEvents: inputVars.leftPointer,
    borderStartStartRadius: inputVars.radius,
    borderEndStartRadius: inputVars.radius
  },
  right: {
    insetInlineEnd: "1px",
    width: inputVars.rightSize,
    pointerEvents: inputVars.rightPointer,
    borderStartEndRadius: inputVars.radius,
    borderEndEndRadius: inputVars.radius
  },
  placeholder: { color: inputVars.placeholder },
  placeholderAlone: { color: colors.placeholder },
  clear: { pointerEvents: "all", backgroundColor: inputVars.bg }
})

const isTextareaAttribute = <M>(attribute: ElementAttribute<M>): attribute is TextareaAttribute<M> | ChildAttribute =>
  !Predicate.isTagged(attribute, "InnerHTML")

export const isShown = (value: boolean | Child | undefined): boolean => value !== undefined && value !== false

const sizeOf = (size: InputSize | undefined): InputSize => size ?? "sm"

const lengthOf = (value: StyleValue): string => (Predicate.isNumber(value) ? rem(value) : value)

const sectionView = <M>(
  h: HtmlBuilder<M>,
  attributes: ReadonlyArray<ElementAttribute<M>>,
  position: "left" | "right",
  content: Option.Option<Child>
): ReadonlyArray<Html> =>
  Option.match(content, {
    onNone: () => [],
    onSome: (child) => [h.div([...attributes, h.DataAttribute("position", position)], [child])]
  })

export const Input = (config: { readonly Input?: InputConfig; readonly Loader?: LoaderConfig }) => {
  const loader = Loader(config)

  return <M>(h: HtmlBuilder<M>, input: InputProps<M>): Html => {
    const props = withDefaults(config.Input, input)
    const { id: _id, ...rootProps } = props
    const getStyles = stylesApi<M, InputPart>(h, rootProps, config.Input, "wrapper")
    const size = sizeOf(props.size)
    const variant = props.variant ?? "default"
    const error = isShown(props.error) && props.withErrorStyles !== false
    const success = isShown(props.success) && !isShown(props.error) && props.withSuccessStyles !== false
    const disabled = props.disabled === true
    const loadingLeft = props.loading === true && props.loadingPosition === "left"
    const loadingRight = props.loading === true && props.loadingPosition !== "left"
    const spinner = (side: "left" | "right") =>
      loader(h, {
        size: `calc(${side === "left" ? inputVars.leftSize : inputVars.rightSize} / 2)`,
        ...props.loaderProps
      })
    const left = loadingLeft ? Option.some<Child>(spinner("left")) : Option.fromNullishOr(props.leftSection)
    const right = loadingRight ? Option.some<Child>(spinner("right")) : Option.fromNullishOr(props.rightSection)
    const withAria = props.withAria !== false
    const component = props.component ?? "input"
    const fieldAttributes: ReadonlyArray<ElementAttribute<M>> = [
      ...getStyles(
        "input",
        styles.input,
        Option.isSome(left) && styles.withLeft,
        Option.isSome(right) && styles.withRight,
        variant === "unstyled" && styles.unstyled,
        props.multiline === true && styles.multiline,
        props.autosize === true && styles.autosize,
        props.bottomSection !== undefined && styles.withBottom,
        props.pointer === true && styles.pointer,
        disabled && styles.disabled
      ),
      ...(component === "button" ? [h.Type("button")] : []),
      ...(props.type === undefined ? [] : [h.Type(props.type)]),
      ...(props.name === undefined ? [] : [h.Name(props.name)]),
      ...(props.value === undefined ? [] : [h.Value(props.value)]),
      ...(props.placeholder === undefined ? [] : [h.Placeholder(props.placeholder)]),
      ...(props.autoComplete === undefined ? [] : [h.Autocomplete(props.autoComplete)]),
      ...(props.inputSize === undefined ? [] : [h.Attribute("size", props.inputSize)]),
      ...(props.readOnly === true ? [h.Readonly(true)] : []),
      ...(withAria
        ? [
            h.Required(props.required === true),
            h.Disabled(disabled),
            ...(isShown(props.error) ? [h.AriaInvalid(true)] : []),
            ...(props.describedBy === undefined ? [] : [h.AriaDescribedBy(props.describedBy)]),
            ...(props.id === undefined ? [] : [h.Id(props.id)])
          ]
        : []),
      h.DataAttribute("variant", variant),
      ...(disabled ? [h.DataAttribute("disabled", "")] : []),
      ...(error ? [h.DataAttribute("error", "")] : []),
      ...(success ? [h.DataAttribute("success", "")] : []),
      ...(props.onInput === undefined ? [] : [h.OnInput(props.onInput)]),
      ...(props.onChange === undefined ? [] : [h.OnChange(props.onChange)]),
      ...(props.onFocus === undefined ? [] : [h.OnFocus(props.onFocus)]),
      ...(props.onClick === undefined ? [] : [h.OnClick(props.onClick)]),
      ...(props.onBlur === undefined ? [] : [h.OnBlur(props.onBlur)]),
      ...(props.onKeyDown === undefined ? [] : [h.OnKeyDownPreventDefault(props.onKeyDown)]),
      ...(props.onBeforeInput === undefined ? [] : [h.OnBeforeInputPreventDefault(props.onBeforeInput)]),
      ...(props.inputMode === undefined ? [] : [h.Attribute("inputmode", props.inputMode)]),
      ...(props.fieldBind ?? [])
    ]
    const children = props.children ?? []
    const fields = {
      input: () => h.input(fieldAttributes),
      textarea: () => h.textarea(fieldAttributes.filter(isTextareaAttribute)),
      select: () => h.select(fieldAttributes, children),
      button: () => h.button(fieldAttributes, children),
      div: () => h.div(fieldAttributes, children)
    }
    const field = fields[component]()

    return h.div(
      [
        ...getStyles(
          "wrapper",
          styles.wrapper,
          sizes[size],
          props.multiline === true && multilinePadding[size],
          variants[variant],
          props.offsetTop === true && styles.offsetTop,
          props.offsetBottom === true && styles.offsetBottom,
          error && styles.error,
          error && variant !== "unstyled" && styles.errorBorder,
          success && styles.success,
          success && variant !== "unstyled" && styles.successBorder,
          setDefinedVars(
            [inputVars.radius, mapDefined(props.radius, radiusValue)],
            [inputVars.leftSize, mapDefined(props.leftSectionWidth, lengthOf)],
            [inputVars.rightSize, mapDefined(props.rightSectionWidth, lengthOf)],
            [inputVars.leftPointer, props.leftSectionPointerEvents],
            [inputVars.rightPointer, props.rightSectionPointerEvents],
            [inputVars.resize, props.resize],
            [inputVars.minRows, mapDefined(props.minRows, String)],
            [inputVars.maxRows, mapDefined(props.maxRows, String)]
          ),
          ...styleProps(props)
        ),
        h.DataAttribute("variant", variant),
        h.DataAttribute("size", size),
        ...(error ? [h.DataAttribute("error", "")] : []),
        ...(success ? [h.DataAttribute("success", "")] : []),
        ...(props.pointer === true ? [h.DataAttribute("pointer", "")] : []),
        ...(disabled ? [h.DataAttribute("disabled", "")] : []),
        ...(props.multiline === true ? [h.DataAttribute("multiline", "")] : []),
        ...(Option.isSome(left) ? [h.DataAttribute("with-left-section", "")] : []),
        ...(Option.isSome(right) ? [h.DataAttribute("with-right-section", "")] : []),
        ...(props.bottomSection === undefined ? [] : [h.DataAttribute("with-bottom-section", "")]),
        ...(props.autosize === true && props.maxRows === undefined ? [h.DataAttribute("no-overflow", "")] : [])
      ],
      [
        ...sectionView(h, getStyles("section", styles.section, styles.left), "left", left),
        field,
        ...sectionView(h, getStyles("section", styles.section, styles.right), "right", right),
        ...(props.bottomSection === undefined
          ? []
          : [h.div(getStyles("bottomSection", styles.bottomSection), [props.bottomSection])])
      ]
    )
  }
}

export type InputPlaceholderProps = StylesApiProps<"placeholder"> & {
  readonly error?: boolean
  readonly children: ReadonlyArray<Child>
}

export const InputPlaceholder =
  (config: { readonly InputPlaceholder?: ComponentConfig<object, "placeholder"> }) =>
  <M>(h: HtmlBuilder<M>, input: InputPlaceholderProps): Html => {
    const props = withDefaults(config.InputPlaceholder, input)
    const getStyles = stylesApi<M, "placeholder">(h, props, config.InputPlaceholder, "placeholder")

    return h.span(
      [
        ...getStyles("placeholder", styles.placeholderAlone, styles.placeholder),
        ...(props.error === true ? [h.DataAttribute("error", "")] : [])
      ],
      props.children
    )
  }

export const InputClearButton = (config: { readonly CloseButton?: CloseButtonConfig }) => {
  const closeButton = CloseButton(config)

  return <M>(h: HtmlBuilder<M>, props: CloseButtonProps<M>): Html =>
    closeButton(h, {
      variant: "transparent",
      size: "sm",
      ...props,
      ...forwardPart({}, undefined, "root", props, styles.clear)
    })
}

export const inputLook = { sizes, variants, styles }
