import * as stylex from "@stylexjs/stylex"
import { anchorSetup, AnchorConfig } from "@foldkit/ui/anchor"
import * as HoverIntent from "@foldkit/ui/hoverIntent"
import { Effect, Schema } from "effect"
import * as Command from "foldkit/command"
import { childAttributes } from "foldkit/html"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { radiusValue, shadowValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { arrowStyles, arrowVars } from "../Floating/FloatingArrow.ts"
import { dropdownStyles, dropdownWidth } from "../Popover/Popover.ts"
import type { PopoverOptions } from "../Popover/Popover.ts"
import { popoverVars } from "../Popover/Popover.stylex.ts"

export const Model = Schema.Struct({ id: Schema.String, intent: HoverIntent.Model })

export type Model = typeof Model.Type

export type InitConfig = {
  readonly id: string
  readonly openDelay?: number
  readonly closeDelay?: number
  readonly initiallyOpened?: boolean
}

export const init = (config: InitConfig): Model => {
  const intent = HoverIntent.init({ openDelay: config.openDelay ?? 0, closeDelay: config.closeDelay ?? 150 })

  return { id: config.id, intent: config.initiallyOpened === true ? { ...intent, isOpen: true } : intent }
}

export const Message = defineMessageUnion({
  GotIntent: { message: HoverIntent.Message },
  CompletedAnchor: {}
})

export type Message = typeof Message.Type

export const { OutMessage } = HoverIntent

export type OutMessage = HoverIntent.OutMessage

export const update = (
  model: Model,
  message: Message
): {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessage?: OutMessage
} =>
  Message.match(message, {
    GotIntent: ({ message: inner }) => {
      const result = HoverIntent.update(model.intent, inner)

      return {
        model: { ...model, intent: result.model },
        commands: (result.commands ?? []).map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotIntent({ message: lifted }))
        ),
        ...(result.outMessage === undefined ? {} : { outMessage: result.outMessage })
      }
    },
    CompletedAnchor: () => ({ model, commands: [] })
  })

const AnchorHoverCard = Mount.define("AnchorHoverCard", {
  args: { buttonId: Schema.String, anchor: AnchorConfig },
  messages: [Message.CompletedAnchor],
  execute: Effect.fn("AnchorHoverCard")(function* ({ element, buttonId, anchor }) {
    yield* Effect.acquireRelease(
      Effect.sync(() => anchorSetup(element, { buttonId, anchor, interceptTab: false })),
      (cleanup) => Effect.sync(cleanup)
    )

    return Message.CompletedAnchor()
  })
})

export type HoverCardPart = "dropdown" | "arrow"

export type HoverCardOptions = PopoverOptions & {
  readonly role?: string
  readonly withRoles?: boolean
}

export type HoverCardProps<M> = HoverCardOptions &
  StylesApiProps<HoverCardPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly target: (bind: ReadonlyArray<ChildAttribute>) => Html
    readonly disabled?: boolean
    readonly children: ReadonlyArray<Child>
  }

export type HoverCardConfig = ComponentConfig<HoverCardOptions, HoverCardPart>

const styles = stylex.create({ frame: { display: "contents" } })

export const triggerId = (model: Model): string => `${model.id}-target`

export const dropdownId = (model: Model): string => `${model.id}-dropdown`

export const HoverCard =
  (config: { readonly HoverCard?: HoverCardConfig }) =>
  <M>(h: HtmlBuilder<M>, input: HoverCardProps<M>): Html => {
    const props = withDefaults(config.HoverCard, input)
    const getStyles = stylesApi<M, HoverCardPart>(h, props, config.HoverCard, "dropdown")
    const { model } = props
    const withArrow = props.withArrow === true
    const arrowSize = props.arrowSize ?? 7
    const position = props.position ?? "bottom"
    const roles = props.withRoles !== false
    const role = props.role ?? "dialog"
    const dropdown = (panel: ReadonlyArray<ChildAttribute>): Html =>
      h.div(
        [
          ...panel,
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
              centre: "self"
            }),
            setDefinedStyle(
              ["borderRadius", mapDefined(props.radius, radiusValue)],
              ["boxShadow", mapDefined(props.shadow, shadowValue)]
            )
          ),
          h.Id(dropdownId(model)),
          h.DataAttribute("position", position),
          ...(roles ? [h.Role(role)] : []),
          h.OnMount(
            Mount.mapMessage(
              AnchorHoverCard({
                buttonId: triggerId(model),
                anchor: {
                  placement: position,
                  gap: (props.offset ?? 8) + (withArrow ? arrowSize / 2 : 0),
                  portal: props.withinPortal ?? true
                }
              }),
              props.toParentMessage
            )
          )
        ],
        [
          ...props.children,
          ...(withArrow
            ? [h.div([...getStyles("arrow", arrowStyles.arrow, arrowStyles.bordered), h.AriaHidden(true)], [])]
            : [])
        ]
      )

    return h.submodel({
      slotId: model.id,
      model: model.intent,
      view: HoverIntent.view,
      toParentMessage: (message) => props.toParentMessage(Message.GotIntent({ message })),
      viewInputs: {
        focusTriggerSelector: `#${triggerId(model)}`,
        toView: (render) => {
          const visible = render.isVisible && props.disabled !== true

          return h.div(sx(h, styles.frame), [
            props.target([
              ...(props.disabled === true ? [] : render.trigger),
              ...childAttributes([
                h.Id(triggerId(model)),
                ...(roles
                  ? [
                      h.AriaHasPopup(role),
                      h.AriaExpanded(visible),
                      ...(visible ? [h.AriaControls(dropdownId(model))] : [])
                    ]
                  : [])
              ])
            ]),
            ...(visible ? [dropdown(render.panel)] : [])
          ])
        }
      }
    })
  }
