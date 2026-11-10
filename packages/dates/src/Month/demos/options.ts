import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "@sth-ui/core/Ui.ts"
import { dates } from "../../Dates.ts"

const range = ["2024-05-13", "2024-05-14", "2024-05-15", "2024-05-16"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    align: "flex-start",
    justify: "center",
    children: [
      dates.Month(h, {
        month: "2024-05-01",
        minDate: "2024-05-05",
        maxDate: "2024-05-25",
        excludeDate: (date) => date === "2024-05-20",
        getDayProps: (date) => ({
          inRange: range.includes(date),
          firstInRange: date === range[0],
          lastInRange: date === range.at(-1),
          disabled: date === "2024-05-22"
        }),
        hideOutsideDates: true,
        size: "xs"
      }),
      dates.Month(h, {
        month: "2024-02-01",
        locale: "fr",
        firstDayOfWeek: 0,
        weekendDays: [5],
        weekdayFormat: "ddd",
        consistentWeeks: true,
        static: true,
        withCellSpacing: false,
        getDayAriaLabel: (date) => `Jour ${date}`,
        renderDay: (date) => (date.endsWith("-14") ? "♥" : String(Number(date.slice(-2))))
      }),
      h.div(
        [h.Style({ width: "220px" })],
        [dates.Month(h, { month: "2024-06-01", fullWidth: true, hideWeekdays: true, size: "lg", today: "2024-06-03" })]
      )
    ]
  })
