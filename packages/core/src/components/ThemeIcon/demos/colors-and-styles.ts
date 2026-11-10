import type { Html, HtmlBuilder } from "foldkit/html"
import * as stylex from "@stylexjs/stylex"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import type { Ui } from "../../../Ui.ts"

const custom = stylex.create({ root: { borderWidth: "2px", borderColor: "rgb(250, 82, 82)" } })

const named = (label: string) => ({ attributes: { root: { role: "img", "aria-label": label } } })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    children: [
      ui.ThemeIcon(h, { color: "teal", variant: "light", ...named("Teal"), children: [HeartIcon(h)] }),
      ui.ThemeIcon(h, { color: "#7048e8", ...named("Custom"), children: [HeartIcon(h)] }),
      ui.ThemeIcon(h, { styles: { root: custom.root }, ...named("Styled"), children: [HeartIcon(h)] })
    ]
  })
