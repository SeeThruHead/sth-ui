import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { AtIcon } from "@sth-ui/icons/icons/AtIcon.ts"
import type { Ui } from "../../../../Ui.ts"

const custom = stylex.create({
  label: { color: "rgb(190, 75, 219)" },
  input: { borderStyle: "dashed" },
  description: { fontStyle: "italic" }
})

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.TextInput(h, {
    id: "styled",
    w: "100%",
    maw: 340,
    label: "Label",
    placeholder: "TextInput",
    description: "Description",
    error: "Error",
    withAsterisk: true,
    leftSection: AtIcon(h, { size: 18 }),
    styles: { label: custom.label, input: custom.input, description: custom.description }
  })
