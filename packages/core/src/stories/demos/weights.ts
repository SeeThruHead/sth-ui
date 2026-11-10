import type { Html, HtmlBuilder } from "foldkit/html"
import { HeartIcon } from "@sth-ui/icons/icons/HeartIcon.ts"
import type { Icon, IconWeight } from "@sth-ui/icons/Icon.ts"
import type { Ui } from "../../Ui.ts"

const weights: ReadonlyArray<IconWeight> = ["thin", "light", "regular", "bold", "fill", "duotone"]

const tile = <M>(h: HtmlBuilder<M>, ui: Ui, label: string, view: ReturnType<Icon>) =>
  ui.Stack(h, {
    gap: 6,
    align: "center",
    w: 88,
    children: [view, ui.Text(h, { size: "xs", c: "dimmed", children: [label] })]
  })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Group(h, {
    maw: 640,
    gap: "md",
    children: weights.map((weight) => tile(h, ui, weight, HeartIcon(h, { size: 32, weight, label: `${weight} heart` })))
  })
