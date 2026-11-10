import type { Html, HtmlBuilder } from "foldkit/html"
import * as NavigationProgress from "../NavigationProgress.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = NavigationProgress.Model
export type Model = typeof Model.Type

export const Message = NavigationProgress.Message
export type Message = typeof Message.Type

export const init = (): Model => NavigationProgress.init()

export const update = NavigationProgress.update

const controls: ReadonlyArray<readonly [string, Message]> = [
  ["Start", Message.Started()],
  ["Stop", Message.Stopped()],
  ["Increment", Message.Incremented()],
  ["Decrement", Message.Decremented()],
  ["Set 50%", Message.Set({ value: 50 })],
  ["Reset", Message.Reset()],
  ["Complete", Message.Completed()]
]

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(
    [],
    [
      ui.NavigationProgress(h, { model }),
      ui.Group(h, {
        justify: "center",
        children: controls.map(([label, message]) =>
          ui.Button(h, { variant: "default", onClick: message, children: [label] })
        )
      }),
      ui.Text(h, {
        ta: "center",
        mt: "sm",
        size: "sm",
        c: "dimmed",
        children: [`Progress: ${Math.round(model.progress)}%`]
      })
    ]
  )
