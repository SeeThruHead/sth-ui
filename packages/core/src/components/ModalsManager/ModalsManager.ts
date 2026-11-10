import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { sx } from "../../styles/StylesApi.ts"
import { space } from "../../theme/tokens.stylex.ts"
import { Button } from "../Button/Button.ts"
import type { ButtonConfig, ButtonProps } from "../Button/Button.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import { Group } from "../Group/Group.ts"
import type { GroupConfig } from "../Group/Group.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { Modal } from "../Modal/Modal.ts"
import type { ModalConfig, ModalOptions } from "../Modal/Modal.ts"
import type { OverlayConfig } from "../Overlay/Overlay.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import { current, Message } from "./model.ts"
import type { Entry, Model } from "./model.ts"

export type ModalContent<M> = (
  h: HtmlBuilder<M>,
  context: { readonly id: string; readonly innerProps: Readonly<Record<string, unknown>>; readonly close: M }
) => ReadonlyArray<Child>

export type ConfirmLabels = { readonly confirm: string; readonly cancel: string }

export type ModalsManagerProps<M> = {
  readonly model: Model
  readonly toParentMessage: (message: Message) => M
  readonly modals?: Readonly<Record<string, ModalContent<M>>>
  readonly contents?: Readonly<Record<string, ModalContent<M>>>
  readonly modalProps?: ModalOptions
  readonly labels?: ConfirmLabels
  readonly confirmProps?: Omit<ButtonProps<M>, "onClick" | "children">
  readonly cancelProps?: Omit<ButtonProps<M>, "onClick" | "children">
}

type Configs = {
  readonly Modal?: ModalConfig
  readonly Button?: ButtonConfig
  readonly Group?: GroupConfig
  readonly CloseButton?: CloseButtonConfig
  readonly Overlay?: OverlayConfig
  readonly Portal?: PortalConfig
  readonly Loader?: LoaderConfig
}

const styles = stylex.create({
  body: { marginBottom: space.md },
  actions: { marginTop: space.md }
})

const definedSettings = (entry: Entry): ModalOptions => ({
  ...(entry.settings.size === undefined ? {} : { size: entry.settings.size }),
  ...(entry.settings.centered === undefined ? {} : { centered: entry.settings.centered }),
  ...(entry.settings.fullScreen === undefined ? {} : { fullScreen: entry.settings.fullScreen }),
  ...(entry.settings.withCloseButton === undefined ? {} : { withCloseButton: entry.settings.withCloseButton }),
  ...(entry.settings.closeOnClickOutside === undefined
    ? {}
    : { closeOnClickOutside: entry.settings.closeOnClickOutside }),
  ...(entry.settings.closeOnEscape === undefined ? {} : { closeOnEscape: entry.settings.closeOnEscape })
})

export const ModalsManager = (config: Configs) => {
  const modal = Modal(config)
  const button = Button(config)
  const group = Group(config)

  return <M>(h: HtmlBuilder<M>, props: ModalsManagerProps<M>): Html => {
    const send = props.toParentMessage
    const labels = { confirm: "", cancel: "", ...props.labels }
    const content = (entry: Entry): ReadonlyArray<Child> => {
      const context = {
        id: entry.id,
        innerProps: entry.innerProps,
        close: send(Message.Closed({ modalId: entry.id, canceled: false }))
      }
      const render = (registry: Readonly<Record<string, ModalContent<M>>> | undefined) =>
        Option.match(Option.fromNullishOr(registry?.[entry.key]), {
          onNone: () => [],
          onSome: (draw) => draw(h, context)
        })
      if (entry.kind === "context") return render(props.modals)
      if (entry.kind === "content") return render(props.contents)
      const body = [...(entry.confirm.body === undefined ? [] : [entry.confirm.body]), ...render(props.contents)]

      return [
        ...(body.length === 0 ? [] : [h.div(sx(h, styles.body), body)]),
        h.div(sx(h, body.length === 0 && styles.actions), [
          group(h, {
            justify: "flex-end",
            children: [
              button(h, {
                variant: "default",
                ...props.cancelProps,
                onClick: send(Message.Cancelled({ modalId: entry.id })),
                children: [entry.confirm.cancelLabel ?? labels.cancel]
              }),
              button(h, {
                ...props.confirmProps,
                onClick: send(Message.Confirmed({ modalId: entry.id })),
                children: [entry.confirm.confirmLabel ?? labels.confirm]
              })
            ]
          })
        ])
      ]
    }

    return Option.match(current(props.model), {
      onNone: () => h.empty,
      onSome: (entry) =>
        modal(h, {
          ...props.modalProps,
          ...definedSettings(entry),
          model: entry.modal,
          toParentMessage: (message) => send(Message.GotModal({ modalId: entry.id, message })),
          ...(entry.settings.title === undefined ? {} : { title: entry.settings.title }),
          children: content(entry)
        })
    })
  }
}
