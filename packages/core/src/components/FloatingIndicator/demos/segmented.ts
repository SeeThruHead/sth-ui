import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { sx } from "../../../styles/StylesApi.ts"
import { palette } from "../../../theme/palette.stylex.ts"
import { accent, fontSize, fontWeight, radius } from "../../../theme/tokens.stylex.ts"
import { floatingIndicatorTarget } from "../FloatingIndicator.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ active: Schema.Int })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Chose: { index: Schema.Int } })
export type Message = typeof Message.Type

export const init = (): Model => ({ active: 0 })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Chose: ({ index }) => ({ model: { active: index }, commands: [] }) })

const data = ["React", "Vue", "Angular", "Svelte"]

const look = stylex.create({
  root: {
    position: "relative",
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`,
    width: "fit-content",
    borderRadius: radius.md,
    padding: "5px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  },
  control: {
    paddingBlock: "7px",
    paddingInline: "12px",
    lineHeight: 1,
    color: `light-dark(${palette.gray7}, ${palette.dark2})`,
    borderRadius: radius.md,
    fontSize: fontSize.sm,
    transitionProperty: "color",
    transitionDuration: "100ms",
    fontWeight: fontWeight.medium,
    backgroundColor: "transparent",
    borderWidth: 0,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  active: { color: palette.white },
  label: { position: "relative", zIndex: 1 },
  indicator: { backgroundColor: accent.filled, borderRadius: radius.md }
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(sx(h, look.root), [
    ...data.map((item, index) =>
      h.button(
        [
          ...sx(
            h,
            look.control,
            index === model.active && look.active,
            ...(index === model.active ? floatingIndicatorTarget("segmented") : [])
          ),
          h.Type("button"),
          h.OnClick(Message.Chose({ index })),
          ...(index === model.active ? [h.DataAttribute("active", "")] : [])
        ],
        [h.span(sx(h, look.label), [item])]
      )
    ),
    ui.FloatingIndicator(h, { anchor: "segmented", target: true, styles: { root: [look.indicator] } })
  ])
