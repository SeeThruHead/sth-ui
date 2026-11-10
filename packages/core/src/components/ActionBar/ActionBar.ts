import * as stylex from "@stylexjs/stylex"
import { Effect, Queue, Stream, Struct } from "effect"
import type { Cause } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { listOf, mergeStyles, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { colors, space } from "../../theme/tokens.stylex.ts"
import { Affix } from "../Affix/Affix.ts"
import type { AffixConfig, AffixPosition } from "../Affix/Affix.ts"
import { CloseButton } from "../CloseButton/CloseButton.ts"
import type { CloseButtonConfig, CloseButtonProps } from "../CloseButton/CloseButton.ts"
import { Paper } from "../Paper/Paper.ts"
import type { PaperConfig } from "../Paper/Paper.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import * as Transition from "../Transition/Transition.ts"
import type { TransitionOptions } from "../Transition/Transition.ts"

export const Model = Transition.Model

export type Model = Transition.Model

export const Message = defineMessageUnion({ GotTransition: { message: Transition.Message }, RequestedClose: {} })

export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({ Opened: {}, Closed: {}, CloseRequested: {} })

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

export const setOpened = (model: Model, opened: boolean): Result => (opened ? open(model) : close(model))

export const update = (model: Model, message: Message): Result =>
  Message.match(message, {
    GotTransition: ({ message: inner }) => lifted(Transition.update(model, inner)),
    RequestedClose: () => ({ model, commands: [], outMessages: [OutMessage.CloseRequested()] })
  })

const closesOnEscape = (event: KeyboardEvent): boolean => event.key === "Escape" && !event.isComposing

const escapeListener =
  (queue: Queue.Queue<typeof Message.RequestedClose.Type, Cause.Done>) =>
  (event: KeyboardEvent): void => {
    if (!closesOnEscape(event)) return
    Queue.offerUnsafe(queue, Message.RequestedClose())
  }

const CloseOnEscape = Mount.defineStream("ActionBarCloseOnEscape", {
  messages: [Message.RequestedClose],
  execute: () =>
    Stream.callback<typeof Message.RequestedClose.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const onKeyDown = escapeListener(queue)
          window.addEventListener("keydown", onKeyDown)

          return () => window.removeEventListener("keydown", onKeyDown)
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export type ActionBarPart = "root"

export type ActionBarOptions = {
  readonly shadow?: string
  readonly radius?: string | number
  readonly withBorder?: boolean
  readonly position?: AffixPosition
  readonly zIndex?: number | string
  readonly withinPortal?: boolean
  readonly transitionProps?: TransitionOptions
  readonly closeOnEscape?: boolean
}

export type ActionBarProps<M> = ActionBarOptions &
  StylesApiProps<ActionBarPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly ariaLabel?: string
    readonly keepMounted?: boolean
    readonly children: ReadonlyArray<Child>
  }

export type ActionBarConfig = ComponentConfig<ActionBarOptions, ActionBarPart>

const styles = stylex.create({
  root: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    width: "fit-content",
    marginInline: "auto",
    paddingBlock: space.xs,
    paddingInline: space.sm
  },
  divider: { width: "1px", alignSelf: "stretch", backgroundColor: colors.defaultBorder }
})

export const ActionBar = (config: {
  readonly ActionBar?: ActionBarConfig
  readonly Affix?: AffixConfig
  readonly Portal?: PortalConfig
  readonly Paper?: PaperConfig
}) => {
  const affix = Affix(config)
  const paper = Paper(config)

  return <M>(h: HtmlBuilder<M>, input: ActionBarProps<M>): Html => {
    const props = withDefaults(config.ActionBar, input)
    const parts = mergeStyles(["root"], config.ActionBar?.styles, props.styles)
    const escape =
      props.closeOnEscape === true && props.model.isShowing
        ? [h.span([h.Hidden(true), h.OnMount(Mount.mapMessage(CloseOnEscape(), props.toParentMessage))], [])]
        : []

    return affix(h, {
      position: props.position ?? { bottom: 30, left: 0, right: 0 },
      zIndex: props.zIndex ?? 200,
      ...Struct.pick(props, ["withinPortal"]),
      children: [
        Transition.Transition(h, {
          ...(props.transitionProps ?? { transition: "pop", duration: 200 }),
          ...Struct.pick(props, ["keepMounted"]),
          model: props.model,
          children: [
            paper(h, {
              withBorder: props.withBorder ?? true,
              ...Struct.pick(props, ["shadow", "radius"]),
              styles: { root: [styles.root, ...listOf(parts.root)] },
              attributes: {
                root: { role: "group", "aria-label": props.ariaLabel ?? "Actions", ...props.attributes?.root }
              },
              children: [...props.children, ...escape]
            })
          ]
        })
      ]
    })
  }
}

export type ActionBarDividerConfig = ComponentConfig<object, "root">

export const ActionBarDivider =
  (config: { readonly ActionBarDivider?: ActionBarDividerConfig }) =>
  <M>(h: HtmlBuilder<M>, input: StylesApiProps<"root"> = {}): Html => {
    const getStyles = stylesApi<M, "root">(h, input, config.ActionBarDivider, "root")

    return h.div([h.Role("separator"), h.AriaOrientation("vertical"), ...getStyles("root", styles.divider)], [])
  }

export type ActionBarCloseButtonProps<M> = Omit<CloseButtonProps<M>, "onClick" | "label"> & {
  readonly onClose: M
  readonly label?: string
}

export const ActionBarCloseButton = (config: { readonly CloseButton?: CloseButtonConfig }) => {
  const closeButton = CloseButton(config)

  return <M>(h: HtmlBuilder<M>, input: ActionBarCloseButtonProps<M>): Html =>
    closeButton(h, { ...Struct.omit(input, ["onClose"]), label: input.label ?? "Close", onClick: input.onClose })
}
