import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const buttons = <M>(h: HtmlBuilder<M>, ui: Ui, labels: ReadonlyArray<string>) =>
  labels.map((label) => ui.Button(h, { variant: "default", children: [label] }))

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Flex(h, {
    component: "section",
    direction: { base: "column", sm: "row" },
    gap: { base: "sm", sm: "lg" },
    rowGap: 4,
    columnGap: { base: 2, md: 40 },
    justify: { sm: "center" },
    children: buttons(h, ui, ["One", "Two"])
  })
