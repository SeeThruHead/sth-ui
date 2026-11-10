import * as stylex from "@stylexjs/stylex"
import { Schema } from "effect"
import type * as Command from "foldkit/command"
import type { Html, HtmlBuilder } from "foldkit/html"
import { defineMessageUnion } from "foldkit/message"
import { ArrowDownIcon } from "@sth-ui/icons/icons/ArrowDownIcon.ts"
import { ArrowDownLeftIcon } from "@sth-ui/icons/icons/ArrowDownLeftIcon.ts"
import { ArrowDownRightIcon } from "@sth-ui/icons/icons/ArrowDownRightIcon.ts"
import { ArrowLeftIcon } from "@sth-ui/icons/icons/ArrowLeftIcon.ts"
import { ArrowRightIcon } from "@sth-ui/icons/icons/ArrowRightIcon.ts"
import { ArrowUpIcon } from "@sth-ui/icons/icons/ArrowUpIcon.ts"
import { ArrowUpLeftIcon } from "@sth-ui/icons/icons/ArrowUpLeftIcon.ts"
import { ArrowUpRightIcon } from "@sth-ui/icons/icons/ArrowUpRightIcon.ts"
import { CircleIcon } from "@sth-ui/icons/icons/CircleIcon.ts"
import { sx } from "../../../styles/StylesApi.ts"
import { palette } from "../../../theme/palette.stylex.ts"
import { radius, shadow, space } from "../../../theme/tokens.stylex.ts"
import { floatingIndicatorTarget } from "../FloatingIndicator.ts"
import type { Ui } from "../../../Ui.ts"

export const Model = Schema.Struct({ active: Schema.String })
export type Model = typeof Model.Type

export const Message = defineMessageUnion({ Chose: { name: Schema.String } })
export type Message = typeof Message.Type

export const init = (): Model => ({ active: "center" })

export const update = (
  _model: Model,
  message: Message
): { readonly model: Model; readonly commands: ReadonlyArray<Command.Command<Message>> } =>
  Message.match(message, { Chose: ({ name }) => ({ model: { active: name }, commands: [] }) })

const rows = [
  [
    ["up-left", ArrowUpLeftIcon],
    ["up", ArrowUpIcon],
    ["up-right", ArrowUpRightIcon]
  ],
  [
    ["left", ArrowLeftIcon],
    ["center", CircleIcon],
    ["right", ArrowRightIcon]
  ],
  [
    ["down-left", ArrowDownLeftIcon],
    ["down", ArrowDownIcon],
    ["down-right", ArrowDownRightIcon]
  ]
] as const

const look = stylex.create({
  root: {
    position: "relative",
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`,
    width: "fit-content",
    padding: space.sm,
    borderRadius: radius.md
  },
  indicator: {
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
    borderRadius: radius.md,
    boxShadow: shadow.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray2}, ${palette.dark4})`
  },
  row: { display: "flex" },
  control: {
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: {
      default: `light-dark(${palette.gray6}, ${palette.dark2})`,
      ":hover": `light-dark(${palette.black}, ${palette.white})`
    },
    borderRadius: radius.md,
    backgroundColor: "transparent",
    borderWidth: 0,
    cursor: "pointer"
  },
  active: { color: `light-dark(${palette.black}, ${palette.white})` },
  icon: { display: "block", position: "relative", zIndex: 1 }
})

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  h.div(sx(h, look.root), [
    ui.FloatingIndicator(h, { anchor: "direction", target: true, styles: { root: [look.indicator] } }),
    ...rows.map((row) =>
      h.div(
        sx(h, look.row),
        row.map(([name, Icon]) =>
          h.button(
            [
              ...sx(
                h,
                look.control,
                name === model.active && look.active,
                ...(name === model.active ? floatingIndicatorTarget("direction") : [])
              ),
              h.Type("button"),
              h.AriaLabel(name),
              h.OnClick(Message.Chose({ name })),
              ...(name === model.active ? [h.DataAttribute("active", "")] : [])
            ],
            [h.span(sx(h, look.icon), [Icon(h, { size: 26 })])]
          )
        )
      )
    )
  ])
