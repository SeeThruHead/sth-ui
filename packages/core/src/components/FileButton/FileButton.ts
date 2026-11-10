import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { sx } from "../../styles/StylesApi.ts"
import { Message } from "../FileInput/FileInput.ts"
import type { Model } from "../FileInput/FileInput.ts"

export { init, Message, Model, OutMessage, update } from "../FileInput/FileInput.ts"

export type FileButtonProps<M> = {
  readonly model: Model
  readonly toParentMessage: (message: Message) => M
  readonly children: (open: M) => Child
  readonly multiple?: boolean
  readonly accept?: string
  readonly name?: string
  readonly form?: string
  readonly capture?: "user" | "environment"
  readonly disabled?: boolean
  readonly inputAttributes?: { readonly [attribute: string]: string }
}

const styles = stylex.create({ contents: { display: "contents" }, hidden: { display: "none" } })

export const FileButton =
  () =>
  <M>(h: HtmlBuilder<M>, props: FileButtonProps<M>): Html => {
    const lift = props.toParentMessage
    const model = props.model

    return h.div(sx(h, styles.contents), [
      props.children(lift(Message.Pressed())),
      h.keyed("input")(`${model.id}-${model.generation}`, [
        ...sx(h, styles.hidden),
        h.Id(`${model.id}-files`),
        h.Type("file"),
        ...(props.multiple === true ? [h.Attribute("multiple", "")] : []),
        ...(props.accept === undefined ? [] : [h.Attribute("accept", props.accept)]),
        ...(props.capture === undefined ? [] : [h.Attribute("capture", props.capture)]),
        ...(props.name === undefined ? [] : [h.Name(props.name)]),
        ...(props.form === undefined ? [] : [h.Attribute("form", props.form)]),
        ...(props.disabled === true ? [h.Disabled(true)] : []),
        ...Object.entries(props.inputAttributes ?? {}).map(([name, value]) => h.Attribute(name, value)),
        h.OnFileChange((files) => lift(Message.Picked({ files })))
      ])
    ])
  }
