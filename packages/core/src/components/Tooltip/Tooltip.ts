import * as stylex from "@stylexjs/stylex"
import * as FoldkitTooltip from "@foldkit/ui/tooltip"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { arrowStyles, arrowVars } from "../Floating/FloatingArrow.ts"
import type { FloatingPlacement } from "../Floating/FloatingArrow.ts"
import { Message } from "./model.ts"
import type { Model } from "./model.ts"
import { tooltipVars } from "./Tooltip.stylex.ts"

export const { triggerId } = FoldkitTooltip

export {
  init,
  interactiveGrace,
  isOpen,
  Message,
  Model,
  OutMessage,
  update,
  updateGroup,
  WaitBeforeClosing
} from "./model.ts"
export type { GroupDelays, InitConfig, Result } from "./model.ts"

export type TooltipPart = "tooltip" | "arrow"

export type TooltipOptions = {
  readonly position?: FloatingPlacement
  readonly offset?: number
  readonly color?: string
  readonly autoContrast?: boolean
  readonly radius?: StyleValue
  readonly multiline?: boolean
  readonly withArrow?: boolean
  readonly arrowSize?: number
  readonly arrowOffset?: number
  readonly arrowRadius?: number
  readonly arrowPosition?: "side" | "center"
  readonly withinPortal?: boolean
  readonly zIndex?: number | string
  readonly keepMounted?: boolean
  readonly transitionProps?: { readonly duration?: number }
}

export type TooltipProps<M> = TooltipOptions &
  StylesApiProps<TooltipPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly label: Child
    readonly target: (bind: ReadonlyArray<ChildAttribute>) => Html
    readonly opened?: boolean
    readonly disabled?: boolean
  }

export type TooltipConfig = ComponentConfig<TooltipOptions, TooltipPart>

const fadeIn = stylex.keyframes({ "0%": { opacity: 0 }, "100%": { opacity: 1 } })

const styles = stylex.create({
  frame: { display: "contents" },
  tooltip: {
    position: "absolute",
    zIndex: tooltipVars.zIndex,
    paddingBlock: `calc(${space.xs} / 2)`,
    paddingInline: space.xs,
    pointerEvents: "none",
    fontSize: fontSize.sm,
    whiteSpace: "nowrap",
    borderRadius: radius.default,
    backgroundColor: `light-dark(${palette.gray9}, ${palette.gray2})`,
    color: `light-dark(${palette.white}, ${palette.black})`,
    animationName: fadeIn,
    animationDuration: "100ms",
    animationTimingFunction: "ease"
  },
  colored: { backgroundColor: accent.filled, color: palette.white },
  contrast: { color: accent.contrast },
  multiline: { whiteSpace: "normal" },
  hidden: { display: "none" }
})

export const Tooltip =
  (config: { readonly Tooltip?: TooltipConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TooltipProps<M>): Html => {
    const props = withDefaults(config.Tooltip, input)
    const getStyles = stylesApi<M, TooltipPart>(h, props, config.Tooltip, "tooltip")
    const withArrow = props.withArrow === true
    const arrowSize = props.arrowSize ?? 4
    const position = props.position ?? "top"
    const colored = props.color !== undefined
    const multiline = props.multiline === true
    const panel = (attributes: ReadonlyArray<ChildAttribute>, visible: boolean): Html =>
      h.div(
        [
          ...attributes,
          ...(interactive
            ? [
                h.OnMouseEnter(props.toParentMessage(Message.EnteredPanel())),
                h.OnMouseLeave(props.toParentMessage(Message.LeftPanel()))
              ]
            : []),
          ...getStyles(
            "tooltip",
            styles.tooltip,
            ...accentStyle(props.color, customAccent),
            colored && styles.colored,
            colored && props.autoContrast === true && styles.contrast,
            multiline && styles.multiline,
            !visible && styles.hidden,
            stylex.defaultMarker(),
            setVars([tooltipVars.zIndex, String(props.zIndex ?? 300)]),
            arrowVars({
              position,
              arrowSize,
              arrowOffset: props.arrowOffset ?? 5,
              arrowRadius: props.arrowRadius ?? 0,
              arrowPosition: props.arrowPosition ?? "side",
              centre: "self"
            }),
            setDefinedStyle(
              ["borderRadius", mapDefined(props.radius, radiusValue)],
              ["animationDuration", mapDefined(props.transitionProps?.duration, (duration) => `${duration}ms`)],
              ["pointerEvents", interactive ? "auto" : undefined]
            )
          ),
          ...(multiline ? [h.DataAttribute("multiline", "")] : [])
        ],
        [
          props.label,
          ...(withArrow
            ? [h.div([...getStyles("arrow", arrowStyles.arrow, arrowStyles.borderless), h.AriaHidden(true)], [])]
            : [])
        ]
      )
    const tooltip = props.opened === undefined ? props.model.tooltip : { ...props.model.tooltip, isOpen: props.opened }
    const interactive = props.model.interactive
    const shown = (render: { readonly panel: ReadonlyArray<ChildAttribute>; readonly isVisible: boolean }) => {
      if (props.disabled === true) return []
      if (render.isVisible) return [panel(render.panel, true)]
      if (props.keepMounted === true) return [panel(render.panel, false)]

      return []
    }

    return h.submodel({
      slotId: tooltip.id,
      model: tooltip,
      view: FoldkitTooltip.view,
      toParentMessage: (message: FoldkitTooltip.Message) => props.toParentMessage(Message.GotTooltip({ message })),
      viewInputs: {
        anchor: {
          placement: position,
          gap: (props.offset ?? 5) + (withArrow ? arrowSize / 2 : 0),
          portal: props.withinPortal ?? true
        },
        isDisabled: props.disabled === true,
        toView: (render) => h.div(sx(h, styles.frame), [props.target(render.trigger), ...shown(render)])
      }
    })
  }
