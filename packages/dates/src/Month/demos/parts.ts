import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"

const custom = stylex.create({ day: { fontWeight: 700 }, weekday: { color: "rgb(0, 128, 0)" } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    justify: "center",
    children: [
      ui.Stack(h, {
        children: [
          ui.Group(h, {
            gap: 4,
            children: [
              dates.Day(h, { date: "2024-05-01" }),
              dates.Day(h, { date: "2024-05-02", selected: true, size: "xl" })
            ]
          }),
          h.table([], [h.tbody([], [dates.WeekdaysRow(h, { cellComponent: "td" })])])
        ]
      }),
      dates.Month(h, {
        month: "2024-05-01",
        focusableDate: "2024-05-21",
        today: "2024-05-30",
        styles: { day: custom.day, weekday: custom.weekday }
      }),
      dates.Month(h, { month: "2024-05-01", today: "2024-05-30", unstyled: true, hideWeekdays: true })
    ]
  })
