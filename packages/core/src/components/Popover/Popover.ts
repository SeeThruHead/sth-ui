import * as stylex from "@stylexjs/stylex"
import * as FoldkitPopover from "@foldkit/ui/popover"
import { Predicate } from "effect"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, shadowValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { radius, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { arrowStyles, arrowVars } from "../Floating/FloatingArrow.ts"
import type { FloatingPlacement } from "../Floating/FloatingArrow.ts"
import { popoverVars } from "./Popover.stylex.ts"

export const { Message, OutMessage, update, open, close, buttonId } = FoldkitPopover

export const Model = FoldkitPopover.Model

export type Model = FoldkitPopover.Model

export type Message = FoldkitPopover.Message

export type OutMessage = FoldkitPopover.OutMessage

export const init = (config: FoldkitPopover.InitConfig): Model => FoldkitPopover.init({ isAnimated: true, ...config })

export type PopoverPart = "dropdown" | "arrow"

export type FloatingPosition = FloatingPlacement

export type PopoverOptions = {
  readonly position?: FloatingPosition
  readonly offset?: number
  readonly width?: "target" | "max-content" | number | (string & {})
  readonly withArrow?: boolean
  readonly arrowSize?: number
  readonly arrowOffset?: number
  readonly arrowRadius?: number
  readonly arrowPosition?: "side" | "center"
  readonly withinPortal?: boolean
  readonly zIndex?: number | string
  readonly radius?: StyleValue
  readonly shadow?: string
}

export type PopoverProps<M> = PopoverOptions &
  StylesApiProps<PopoverPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly target: (bind: ReadonlyArray<ChildAttribute>) => Html
    readonly disabled?: boolean
    readonly focusSelector?: string
    readonly children: ReadonlyArray<Child>
  }

export type PopoverConfig = ComponentConfig<PopoverOptions, PopoverPart>

const styles = stylex.create({
  frame: { display: "contents" }
})

export const dropdownStyles = stylex.create({
  dropdown: {
    position: "absolute",
    zIndex: popoverVars.zIndex,
    width: popoverVars.width,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderRadius: radius.default,
    outline: { default: null, ":focus": "none" },
    opacity: { default: 1, ":is([data-closed])": 0 },
    transitionProperty: "opacity",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease"
  }
})

export const dropdownWidth = (width: PopoverOptions["width"]): string => {
  if (width === undefined) return "max-content"
  if (width === "target") return "var(--button-width)"

  return Predicate.isNumber(width) ? rem(width) : width
}

export const Popover =
  (config: { readonly Popover?: PopoverConfig }) =>
  <M>(h: HtmlBuilder<M>, input: PopoverProps<M>): Html => {
    const props = withDefaults(config.Popover, input)
    const getStyles = stylesApi<M, PopoverPart>(h, props, config.Popover, "dropdown")
    const withArrow = props.withArrow === true
    const arrowSize = props.arrowSize ?? 7
    const position = props.position ?? "bottom"
    const dropdown = (render: FoldkitPopover.RenderInfo): Html =>
      h.div(
        [
          ...render.panel,
          ...getStyles(
            "dropdown",
            dropdownStyles.dropdown,
            stylex.defaultMarker(),
            setVars([popoverVars.zIndex, String(props.zIndex ?? 300)], [popoverVars.width, dropdownWidth(props.width)]),
            arrowVars({
              position,
              arrowSize,
              arrowOffset: props.arrowOffset ?? 5,
              arrowRadius: props.arrowRadius ?? 0,
              arrowPosition: props.arrowPosition ?? "side",
              centre: "anchor"
            }),
            setDefinedStyle(
              ["borderRadius", mapDefined(props.radius, radiusValue)],
              ["boxShadow", mapDefined(props.shadow, shadowValue)]
            )
          ),
          h.DataAttribute("position", position)
        ],
        [
          ...props.children,
          ...(withArrow
            ? [h.div([...render.arrow, ...getStyles("arrow", arrowStyles.arrow, arrowStyles.bordered)], [])]
            : [])
        ]
      )

    return h.submodel({
      slotId: props.model.id,
      model: props.model,
      view: FoldkitPopover.view,
      toParentMessage: props.toParentMessage,
      viewInputs: {
        anchor: {
          placement: position,
          gap: (props.offset ?? 8) + (withArrow ? arrowSize / 2 : 0),
          portal: props.withinPortal ?? true
        },
        isDisabled: props.disabled === true,
        arrowPadding: props.arrowOffset ?? 5,
        ...(props.focusSelector === undefined ? {} : { focusSelector: props.focusSelector }),
        toView: (render) =>
          h.div(sx(h, styles.frame), [props.target(render.button), ...(render.isVisible ? [dropdown(render)] : [])])
      }
    })
  }
