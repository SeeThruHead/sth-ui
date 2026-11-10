import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ active: Schema.Int, highest: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Clicked: { step: Schema.Int }, Next: {}, Back: {} })
export type Message = typeof Message.Type

export const init = (): Model => ({ active: 0, highest: 0 })

const moved = (model: Model, active: number): Model => ({ active, highest: Math.max(model.highest, active) })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: Message.match(message, {
    Clicked: ({ step }) => moved(model, step),
    Next: () => moved(model, Math.min(model.active + 1, 3)),
    Back: () => moved(model, Math.max(model.active - 1, 0))
  }),
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: 0,
    children: [
      ui.Stepper(h, {
        active: model.active,
        onStepClick: (step) => Message.Clicked({ step }),
        completed: ["Completed, click back button to get to previous step"],
        allowNextStepsSelect: false,
        steps: [
          { label: "First step", description: "Create an account", children: ["Step 1 content: Create an account"] },
          { label: "Second step", description: "Verify email", children: ["Step 2 content: Verify email"] },
          { label: "Final step", description: "Get full access", children: ["Step 3 content: Get full access"] }
        ]
      }),
      ui.Group(h, {
        justify: "center",
        mt: "xl",
        children: [
          ui.Button(h, { variant: "default", onClick: Message.Back(), children: ["Back"] }),
          ui.Button(h, { onClick: Message.Next(), children: ["Next step"] })
        ]
      })
    ]
  })
