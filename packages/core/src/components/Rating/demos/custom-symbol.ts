import { Schema } from "effect"
import * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { SmileyIcon } from "@sth-ui/icons/icons/SmileyIcon.ts"
import { SmileyMehIcon } from "@sth-ui/icons/icons/SmileyMehIcon.ts"
import { SmileyNervousIcon } from "@sth-ui/icons/icons/SmileyNervousIcon.ts"
import { SmileySadIcon } from "@sth-ui/icons/icons/SmileySadIcon.ts"
import { SmileyWinkIcon } from "@sth-ui/icons/icons/SmileyWinkIcon.ts"
import { palette } from "../../../theme/palette.stylex.ts"
import * as Rating from "../Rating.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ first: Rating.Model, firstValue: Schema.Finite })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ GotFirst: { message: Rating.Message } })
export type Message = typeof Message.Type

export const init = (): Model => ({
  first: Rating.init({ id: "smileys" }),
  firstValue: 0
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, {
    GotFirst: ({ message: inner }) => {
      const result = Rating.update(model.first, inner)
      const changed = result.outMessage?._tag === "Changed" ? result.outMessage.value : model.firstValue

      return {
        model: { ...model, first: result.model, firstValue: changed },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotFirst({ message: lifted }))
        )
      }
    }
  })

const first = (model: Model) => ({
  model: model.first,
  value: model.firstValue,
  toParentMessage: (message: Rating.Message) => Message.GotFirst({ message })
})

const faces = [
  { icon: SmileySadIcon, color: palette.red7 },
  { icon: SmileyNervousIcon, color: palette.orange7 },
  { icon: SmileyIcon, color: palette.yellow7 },
  { icon: SmileyMehIcon, color: palette.lime7 },
  { icon: SmileyWinkIcon, color: palette.green7 }
]

const smiley = (h: HtmlBuilder<Message>, look: "dimmed" | "full") => (value: number) =>
  faces
    .slice(value - 1, value)
    .map((face) => face.icon(h, { size: 24, ...(look === "full" ? { color: face.color } : {}) }))[0] ?? ""

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Rating(h, {
    ...first(model),
    emptySymbol: smiley(h, "dimmed"),
    fullSymbol: smiley(h, "full"),
    highlightSelectedOnly: true
  })
