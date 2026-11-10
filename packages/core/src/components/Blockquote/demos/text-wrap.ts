import type { Html, HtmlBuilder } from "foldkit/html"
import { InfoIcon } from "@sth-ui/icons/icons/InfoIcon.ts"
import type { Ui } from "../../../Ui.ts"

const quote =
  "Life is like a box of chocolates. You never know what you are gonna get. But whatever you get, you should make the most of it and enjoy every moment."

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    gap: 48,
    maw: 520,
    pt: "xl",
    children: (["wrap", "balance"] as const).map((textWrap) =>
      ui.Blockquote(h, { textWrap, icon: InfoIcon(h, {}), cite: "– Forrest Gump", children: [quote] })
    )
  })
