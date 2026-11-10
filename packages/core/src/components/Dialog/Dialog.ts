import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Child } from "../../content.ts"
import { listOf, mergeStyles, setVars, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { Affix } from "../Affix/Affix.ts"
import type { AffixConfig, AffixPosition } from "../Affix/Affix.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { Paper } from "../Paper/Paper.ts"
import type { PaperConfig } from "../Paper/Paper.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import * as Transition from "../Transition/Transition.ts"
import type { TransitionOptions } from "../Transition/Transition.ts"
import { dialogVars } from "./Dialog.stylex.ts"

export const Model = Transition.Model

export type Model = Transition.Model

export const Message = defineMessageUnion({ GotTransition: { message: Transition.Message }, RequestedClose: {} })

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Opened: {}, Closed: {} })

export type OutMessage = typeof OutMessage.Type

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const init = (config: { readonly id: string; readonly opened?: boolean }): Model =>
  Transition.init({ id: config.id, mounted: config.opened === true })

const outOf = (out: Transition.OutMessage): ReadonlyArray<OutMessage> =>
  Transition.OutMessage.match(out, {
    Entering: () => [OutMessage.Opened()],
    Entered: () => [],
    Exiting: () => [OutMessage.Closed()],
    Exited: () => []
  })

const lifted = (result: Transition.Result): Result => ({
  model: result.model,
  commands: Transition.liftCommands(result.commands, (message) => Message.GotTransition({ message })),
  outMessages: result.outMessages.flatMap(outOf)
})

export const open = (model: Model): Result => lifted(Transition.mounted(model, true))

export const close = (model: Model): Result => lifted(Transition.mounted(model, false))

export const toggle = (model: Model): Result => (model.isShowing ? close(model) : open(model))

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    GotTransition: ({ message: inner }) => lifted(Transition.update(model, inner)),
    RequestedClose: () => close(model)
  })

export type DialogPart = "root" | "closeButton"

export type DialogSize = keyof typeof sizes

export type DialogOptions = {
  readonly size?: DialogSize | number
  readonly shadow?: string
  readonly radius?: string | number
  readonly withBorder?: boolean
  readonly position?: AffixPosition
  readonly zIndex?: number | string
  readonly withinPortal?: boolean
  readonly transitionProps?: TransitionOptions
}

export type DialogProps<M> = DialogOptions &
  StylesApiProps<DialogPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly withCloseButton?: boolean
    readonly keepMounted?: boolean
    readonly children: ReadonlyArray<Child>
  }

export type DialogConfig = ComponentConfig<DialogOptions, DialogPart>

const sizes = stylex.create({
  xs: { [dialogVars.size]: "160px" },
  sm: { [dialogVars.size]: "200px" },
  md: { [dialogVars.size]: "340px" },
  lg: { [dialogVars.size]: "400px" },
  xl: { [dialogVars.size]: "500px" }
})

const styles = stylex.create({
  root: {
    position: "relative",
    width: dialogVars.size,
    maxWidth: `calc(100vw - ${space.xl} * 2)`,
    minHeight: "50px",
    padding: space.md
  },
  closeButton: { position: "absolute", top: `calc(${space.md} / 2)`, insetInlineEnd: `calc(${space.md} / 2)` }
})

export const Dialog = (config: {
  readonly Dialog?: DialogConfig
  readonly Affix?: AffixConfig
  readonly Portal?: PortalConfig
  readonly Paper?: PaperConfig
  readonly CloseButton?: CloseButtonConfig
}) => {
  const affix = Affix(config)
  const paper = Paper(config)
  const closeButton = CloseButton(config)

  return <M>(h: HtmlBuilder<M>, input: DialogProps<M>): Html => {
    const props = withDefaults(config.Dialog, input)
    const parts = mergeStyles(["root", "closeButton"], config.Dialog?.styles, props.styles)
    const size = props.size ?? "md"
    const transition = props.transitionProps ?? { transition: "pop-top-right", duration: 200 }

    return affix(h, {
      position: props.position ?? { bottom: 30, right: 30 },
      ...(props.zIndex === undefined ? {} : { zIndex: props.zIndex }),
      ...(props.withinPortal === undefined ? {} : { withinPortal: props.withinPortal }),
      children: [
        Transition.Transition(h, {
          ...transition,
          ...(props.keepMounted === undefined ? {} : { keepMounted: props.keepMounted }),
          model: props.model,
          children: [
            paper(h, {
              shadow: props.shadow ?? "md",
              withBorder: props.withBorder ?? true,
              ...(props.radius === undefined ? {} : { radius: props.radius }),
              styles: {
                root: [
                  styles.root,
                  Predicate.isNumber(size) ? setVars([dialogVars.size, rem(size)]) : sizes[size],
                  ...listOf(parts.root)
                ]
              },
              ...(props.attributes?.root === undefined ? {} : { attributes: { root: props.attributes.root } }),
              children: [
                ...(props.withCloseButton === true
                  ? [
                      closeButton(h, {
                        label: "Close",
                        onClick: props.toParentMessage(Message.RequestedClose()),
                        styles: { root: [styles.closeButton, ...listOf(parts.closeButton)] }
                      })
                    ]
                  : []),
                ...props.children
              ]
            })
          ]
        })
      ]
    })
  }
}
