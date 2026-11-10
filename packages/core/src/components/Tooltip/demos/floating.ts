import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import * as TooltipFloating from "../TooltipFloating.ts"
import type { Ui } from "../../../Ui.ts"
import { sx } from "../../../styles/StylesApi.ts"
import { accent, space } from "../../../theme/tokens.stylex.ts"

const styles = stylex.create({
  box: {
    paddingBlock: space.xl,
    paddingInline: space.xl,
    maxWidth: "400px",
    marginInline: "auto",
    backgroundColor: accent.light,
    cursor: "default"
  }
})

const positions = ["top", "right", "bottom", "left"] as const

const Position = Schema.Literals(positions)

export const Model = Schema.Struct({
  floating: TooltipFloating.FloatingModel,
  colored: TooltipFloating.FloatingModel,
  position: Position,
  disabled: Schema.Boolean
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  GotFloating: { message: TooltipFloating.FloatingMessage },
  GotColored: { message: TooltipFloating.FloatingMessage },
  Placed: { position: Position },
  Toggled: {}
})
export type Message = typeof Message.Type

export const init = (): Model => ({
  floating: TooltipFloating.initFloating({ id: "floating" }),
  colored: TooltipFloating.initFloating({ id: "colored" }),
  position: "right",
  disabled: false
})

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: Message.match(message, {
    GotFloating: ({ message: inner }) => ({
      ...model,
      floating: TooltipFloating.updateFloating(model.floating, inner)
    }),
    GotColored: ({ message: inner }) => ({ ...model, colored: TooltipFloating.updateFloating(model.colored, inner) }),
    Placed: ({ position }) => ({ ...model, position }),
    Toggled: () => ({ ...model, disabled: !model.disabled })
  }),
  commands: []
})

const target = (h: HtmlBuilder<Message>, ui: Ui, text: string) => (bind: ReadonlyArray<ChildAttribute>) =>
  h.div([...bind, ...sx(h, styles.box)], [ui.Text(h, { ta: "center", children: [text] })])

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Stack(h, {
    children: [
      ui.Group(h, {
        justify: "center",
        gap: "xs",
        children: [
          ...positions.map((position) =>
            ui.Button(h, {
              size: "xs",
              variant: model.position === position ? "filled" : "default",
              onClick: Message.Placed({ position }),
              children: [position]
            })
          ),
          ui.Checkbox(h, {
            id: "disable-second",
            label: "Disable the second",
            checked: model.disabled,
            onChange: () => Message.Toggled()
          })
        ]
      }),
      ui.TooltipFloating(h, {
        model: model.floating,
        position: model.position,
        toParentMessage: (message) => Message.GotFloating({ message }),
        label: "Tooltip",
        target: target(h, ui, "Hover over the box to see tooltip")
      }),
      ui.TooltipFloating(h, {
        model: model.colored,
        color: "orange",
        multiline: true,
        radius: "md",
        offset: 20,
        disabled: model.disabled,
        toParentMessage: (message) => Message.GotColored({ message }),
        label: "A coloured tooltip that wraps onto more than one line",
        target: target(h, ui, "Coloured, multiline, offset 20")
      })
    ]
  })
