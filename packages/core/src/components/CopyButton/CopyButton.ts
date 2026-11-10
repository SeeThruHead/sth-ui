import type { Html, HtmlBuilder } from "foldkit/html"
import { Message } from "./model.ts"
import type { Model } from "./model.ts"

export { init, Message, Model, ResetAfter, update, WriteClipboard } from "./model.ts"
export type { CopyButtonContext } from "./model.ts"

export type CopyButtonProps<M> = {
  readonly model: Model
  readonly toParentMessage: (message: Message) => M
  readonly value: string
  readonly children: (payload: { readonly copied: boolean; readonly copy: M }) => Html
}

export const CopyButton =
  (_config: object) =>
  <M>(_h: HtmlBuilder<M>, props: CopyButtonProps<M>): Html =>
    props.children({ copied: props.model.copied, copy: props.toParentMessage(Message.Pressed({ value: props.value })) })
