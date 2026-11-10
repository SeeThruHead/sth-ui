import * as stylex from "@stylexjs/stylex"
import { anchorSetup } from "@foldkit/ui/anchor"
import { Effect, Option, Schema, Struct } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Child } from "../../content.ts"
import { listOf, mergeStyles, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, PartStyles } from "../../styles/StylesApi.ts"
import { ActionIcon } from "../ActionIcon/ActionIcon.ts"
import type { ActionIconConfig } from "../ActionIcon/ActionIcon.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { isColorValid } from "../ColorPicker/color.ts"
import type { ColorFormat } from "../ColorPicker/color.ts"
import { ColorPicker, subscriptions as pickerSubscriptions } from "../ColorPicker/ColorPicker.ts"
import type { ColorPickerConfig, ColorPickerPart } from "../ColorPicker/ColorPicker.ts"
import { ColorSwatch } from "../ColorSwatch/ColorSwatch.ts"
import type { ColorSwatchConfig } from "../ColorSwatch/ColorSwatch.ts"
import type { InputConfig } from "../Input/Input.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputBaseOptions, InputBasePart, InputBaseProps } from "../Input/InputBase.ts"
import type { InputWrapperConfig } from "../Input/InputWrapper.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { dropdownStyles } from "../Popover/Popover.ts"
import { popoverVars } from "../Popover/Popover.stylex.ts"
import { colorInputVars } from "./ColorInput.stylex.ts"
import { Message, update as updateModel } from "./model.ts"
import type { ColorInputContext, Model, OutMessage } from "./model.ts"

export { init, isRemembered, Message, Model, OpenEyeDropper, OutMessage, setValue } from "./model.ts"
export type { ColorInputContext } from "./model.ts"

export type ColorInputPart =
  | InputBasePart
  | "dropdown"
  | "colorPreview"
  | "eyeDropperButton"
  | "eyeDropperIcon"
  | Exclude<ColorPickerPart, "wrapper">

export type ColorInputOptions = InputBaseOptions & {
  readonly format?: ColorFormat
  readonly disallowInput?: boolean
  readonly fixOnBlur?: boolean
  readonly withPreview?: boolean
  readonly withEyeDropper?: boolean
  readonly withPicker?: boolean
  readonly closeOnColorSwatchClick?: boolean
  readonly swatchesPerRow?: number
  readonly withinPortal?: boolean
  readonly fullWidth?: boolean
}

export type ColorInputProps<M> = Omit<
  InputBaseProps<M>,
  "component" | "multiline" | "type" | "value" | "onInput" | "onChange" | "onFocus" | "onBlur" | "onClick" | "styles"
> &
  ColorInputOptions & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly value: string
    readonly swatches?: ReadonlyArray<string>
    readonly eyeDropperIcon?: Child
    readonly styles?: PartStyles<ColorInputPart>
  }

export type ColorInputConfig = ComponentConfig<ColorInputOptions, ColorInputPart>

export const colorInputContext = (
  props: Pick<ColorInputProps<never>, "value" | "format" | "fixOnBlur" | "closeOnColorSwatchClick">
): ColorInputContext => Struct.pick(props, ["value", "format", "fixOnBlur", "closeOnColorSwatchClick"])

export const update = (
  model: Model,
  message: Message,
  context: ColorInputContext
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
} => updateModel(model, message, context)

export const subscriptions = Subscription.lift(pickerSubscriptions)<Model, Message>({
  read: (model) => Option.some(model.picker),
  toParentMessage: (message) => Message.GotPicker({ message })
})

const keepFocus = (event: Event) => event.preventDefault()

const AnchorDropdown = Mount.define("ColorInputDropdown", {
  args: { inputId: Schema.String, portal: Schema.Boolean },
  messages: [Message.Anchored],
  execute: Effect.fn("ColorInputDropdown")(function* ({ element, inputId, portal }) {
    yield* Effect.acquireRelease(
      Effect.sync(() => {
        const cleanup = anchorSetup(element, {
          buttonId: inputId,
          anchor: { placement: "bottom-start", gap: 5, padding: 8, portal },
          interceptTab: false,
          focusAfterPosition: false
        })
        element.addEventListener("mousedown", keepFocus)

        return () => {
          element.removeEventListener("mousedown", keepFocus)
          cleanup()
        }
      }),
      (stop) => Effect.sync(stop)
    )

    return Message.Anchored()
  })
})

const fade = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })

const sizes = stylex.create({
  xs: {
    [colorInputVars.previewSize]: "16px",
    [colorInputVars.buttonSize]: "22px",
    [colorInputVars.iconSize]: "14px"
  },
  sm: {
    [colorInputVars.previewSize]: "18px",
    [colorInputVars.buttonSize]: "26px",
    [colorInputVars.iconSize]: "16px"
  },
  md: {
    [colorInputVars.previewSize]: "22px",
    [colorInputVars.buttonSize]: "28px",
    [colorInputVars.iconSize]: "18px"
  },
  lg: {
    [colorInputVars.previewSize]: "28px",
    [colorInputVars.buttonSize]: "32px",
    [colorInputVars.iconSize]: "20px"
  },
  xl: {
    [colorInputVars.previewSize]: "36px",
    [colorInputVars.buttonSize]: "40px",
    [colorInputVars.iconSize]: "22px"
  }
})

const styles = stylex.create({
  dropdown: {
    paddingBlock: "8px",
    paddingInline: "8px",
    animationName: fade,
    animationDuration: "150ms",
    animationTimingFunction: "ease"
  },
  fullWidth: { width: "var(--button-width)", boxSizing: "border-box" },
  eyeDropperButton: {
    width: colorInputVars.buttonSize,
    height: colorInputVars.buttonSize,
    minWidth: colorInputVars.buttonSize,
    minHeight: colorInputVars.buttonSize
  },
  eyeDropperIcon: { width: colorInputVars.iconSize, height: colorInputVars.iconSize }
})

const eyeDropperPaths = [
  "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
  "M12 3l0 4",
  "M12 21l0 -3",
  "M3 12l4 0",
  "M21 12l-3 0",
  "M12 12l0 .01"
]

const pickerParts = [
  "preview",
  "body",
  "sliders",
  "slider",
  "sliderOverlay",
  "thumb",
  "saturation",
  "saturationOverlay",
  "swatches",
  "swatch"
] as const

const inputParts = [
  "root",
  "label",
  "required",
  "description",
  "error",
  "success",
  "wrapper",
  "input",
  "section",
  "bottomSection"
] as const

const ownKeys = [
  "model",
  "toParentMessage",
  "format",
  "disallowInput",
  "fixOnBlur",
  "withPreview",
  "withEyeDropper",
  "withPicker",
  "closeOnColorSwatchClick",
  "swatches",
  "swatchesPerRow",
  "withinPortal",
  "fullWidth",
  "eyeDropperIcon",
  "styles"
] as const

const popoverDisabled = <M>(props: ColorInputProps<M>): boolean =>
  props.readOnly === true || (props.withPicker === false && (props.swatches ?? []).length === 0)

const showsPreview = <M>(props: ColorInputProps<M>): boolean =>
  props.leftSection === undefined && props.withPreview !== false

const showsEyeDropper = <M>(props: ColorInputProps<M>): boolean => {
  if (props.withEyeDropper === false) return false
  if (props.disabled === true) return false
  if (props.readOnly === true) return false

  return props.model.eyeDropperSupported
}

export const ColorInput = (config: {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly CloseButton?: CloseButtonConfig
  readonly ActionIcon?: ActionIconConfig
  readonly ColorSwatch?: ColorSwatchConfig
  readonly ColorPicker?: ColorPickerConfig
  readonly ColorInput?: ColorInputConfig
}) => {
  const base = inputBase("ColorInput")({
    ...Struct.omit(config, ["ColorInput"]),
    ColorInput: { styles: Struct.pick(config.ColorInput?.styles ?? {}, inputParts) }
  })
  const picker = ColorPicker(config)
  const swatch = ColorSwatch(config)
  const actionIcon = ActionIcon(config)

  return <M>(h: HtmlBuilder<M>, input: ColorInputProps<M>): Html => {
    const props = withDefaults<ColorInputOptions, ColorInputProps<M>>(config.ColorInput, input)
    const lift = props.toParentMessage
    const own = Struct.pick(props.styles ?? {}, ["dropdown", "colorPreview", "eyeDropperButton", "eyeDropperIcon"])
    const getStyles = stylesApi<M, "dropdown" | "eyeDropperIcon">(
      h,
      { ...Struct.pick(props, ["unstyled"]), styles: own },
      { styles: Struct.pick(config.ColorInput?.styles ?? {}, ["dropdown", "eyeDropperIcon"]) },
      "dropdown"
    )
    const parts = mergeStyles(["colorPreview", "eyeDropperButton"], config.ColorInput?.styles, own)
    const size = props.size ?? "sm"
    const preview = swatch(h, {
      color: isColorValid(props.value) ? props.value : "#fff",
      size: colorInputVars.previewSize,
      styles: { root: [sizes[size], ...listOf(parts.colorPreview)] },
      attributes: { root: { "data-color-preview": "" } }
    })
    const eyeDropper = actionIcon(h, {
      variant: "subtle",
      color: "gray",
      label: "Pick a colour from the screen",
      onClick: lift(Message.PressedEyeDropper()),
      styles: { root: [sizes[size], styles.eyeDropperButton, ...listOf(parts.eyeDropperButton)] },
      children: [
        props.eyeDropperIcon ??
          h.svg(
            [
              ...getStyles("eyeDropperIcon", sizes[size], styles.eyeDropperIcon),
              h.Attribute("viewBox", "0 0 24 24"),
              h.Attribute("stroke-width", "1.5"),
              h.Attribute("stroke", "currentColor"),
              h.Attribute("fill", "none"),
              h.Attribute("stroke-linecap", "round"),
              h.Attribute("stroke-linejoin", "round"),
              h.AriaHidden(true)
            ],
            eyeDropperPaths.map((path) => h.path([h.Attribute("d", path)], []))
          )
      ]
    })
    const dropdown =
      props.model.opened && !popoverDisabled(props)
        ? [
            h.div(
              [
                ...getStyles(
                  "dropdown",
                  dropdownStyles.dropdown,
                  styles.dropdown,
                  props.fullWidth === true && styles.fullWidth,
                  setVars([popoverVars.zIndex, "300"])
                ),
                h.DataAttribute("color-input-dropdown", ""),
                h.OnMount(
                  Mount.mapMessage(AnchorDropdown({ inputId: props.id, portal: props.withinPortal ?? true }), lift)
                )
              ],
              [
                picker(h, {
                  model: props.model.picker,
                  toParentMessage: (message) => lift(Message.GotPicker({ message })),
                  value: props.value,
                  format: props.format ?? "hex",
                  size,
                  focusable: false,
                  ...Struct.pick(props, ["withPicker", "swatches", "swatchesPerRow", "fullWidth"]),
                  styles: Struct.pick(props.styles ?? {}, pickerParts)
                })
              ]
            )
          ]
        : []

    return h.div(
      [],
      [
        base(h, {
          ...Struct.omit(props, ownKeys),
          styles: Struct.pick(props.styles ?? {}, inputParts),
          autoComplete: "off",
          value: props.value,
          readOnly: props.disallowInput === true || props.readOnly === true,
          pointer: props.pointer === true || props.disallowInput === true,
          onInput: (value) => lift(Message.Typed({ value })),
          onFocus: lift(Message.Focused()),
          onBlur: lift(Message.Blurred()),
          onClick: lift(Message.Clicked()),
          attributes: { ...props.attributes, input: { ...props.attributes?.input, spellcheck: "false" } },
          ...(showsPreview(props) ? { leftSection: preview } : {}),
          ...(props.rightSection === undefined && showsEyeDropper(props)
            ? { rightSection: eyeDropper, rightSectionPointerEvents: props.rightSectionPointerEvents ?? "all" }
            : {})
        }),
        ...dropdown
      ]
    )
  }
}
