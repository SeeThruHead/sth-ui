import type { Html, HtmlBuilder } from "foldkit/html"
import type { TextSize } from "../Text.ts"
import type { Ui } from "../../../Ui.ts"

const sizes: ReadonlyArray<TextSize> = ["xs", "sm", "md", "lg", "xl"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, { children: sizes.map((size) => ui.Text(h, { size, children: [`Text size ${size}`] })) })
