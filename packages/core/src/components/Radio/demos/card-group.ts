import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { palette } from "../../../theme/palette.stylex.ts"
import { accent, colors, fontSize, space } from "../../../theme/tokens.stylex.ts"
import type { Ui } from "../../../Ui.ts"

const packages = [
  { name: "npm", description: "Node package manager" },
  { name: "yarn", description: "Fast, reliable, and secure dependency management" },
  { name: "pnpm", description: "Fast, disk space efficient package manager" }
]

const styles = stylex.create({
  root: {
    position: "relative",
    paddingBlock: space.md,
    paddingInline: space.md,
    transitionProperty: "border-color",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease",
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray0}, ${palette.dark6})` }
  },
  checked: { borderColor: accent.filled },
  label: { fontWeight: 600, fontSize: fontSize.sm, lineHeight: 1.3, color: colors.bright },
  description: { marginTop: "4px", color: colors.dimmed, fontSize: fontSize.xs }
})

export const Model = Schema.Struct({ manager: Schema.NullOr(Schema.String), side: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Picked: { name: Schema.String }, Sided: { side: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ manager: null, side: "left" })

export const update = (
  model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } => ({
  model: Message.match(message, {
    Picked: ({ name }) => ({ ...model, manager: name }),
    Sided: ({ side }) => ({ ...model, side })
  }),
  commands: []
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    maw: 400,
    mx: "auto",
    children: [
      ui.Text(h, { fw: 500, size: "sm", children: ["Pick one package manager to install"] }),
      ui.Stack(h, {
        pt: "md",
        gap: "xs",
        children: packages.map((item) => {
          const checked = model.manager === item.name

          return ui.RadioCard(h, {
            checked,
            name: "manager",
            value: item.name,
            onChange: Message.Picked({ name: item.name }),
            styles: { card: [styles.root, checked && styles.checked] },
            children: ({ checked: shown }) => [
              ui.Group(h, {
                wrap: "nowrap",
                align: "flex-start",
                children: [
                  ui.RadioIndicator(h, { checked: shown }),
                  h.div(
                    [],
                    [
                      ui.Text(h, { styles: { root: [styles.label] }, children: [item.name] }),
                      ui.Text(h, { styles: { root: [styles.description] }, children: [item.description] })
                    ]
                  )
                ]
              })
            ]
          })
        })
      }),
      ui.Text(h, { fz: "xs", mt: "md", children: [`CurrentValue: ${model.manager ?? "–"}`] }),
      h.div(
        [h.Dir("rtl")],
        [
          ui.Group(h, {
            mt: "md",
            children: ["left", "right"].map((side) =>
              ui.RadioCard(h, {
                checked: model.side === side,
                name: "side",
                dir: "rtl",
                withBorder: false,
                radius: "xl",
                onChange: Message.Sided({ side }),
                styles: { card: [styles.root] },
                children: [side]
              })
            )
          })
        ]
      ),
      ui.RadioCard(h, {
        checked: false,
        disabled: true,
        onChange: Message.Sided({ side: "none" }),
        children: ["Unavailable"]
      })
    ]
  })
