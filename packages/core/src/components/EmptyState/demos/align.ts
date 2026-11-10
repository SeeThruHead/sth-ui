import type { Html, HtmlBuilder } from "foldkit/html"
import { FolderOpenIcon } from "@sth-ui/icons/icons/FolderOpenIcon.ts"
import type { Ui } from "../../../Ui.ts"

const folder = <M>(h: HtmlBuilder<M>, ui: Ui, align: "left" | "right"): Html =>
  ui.EmptyState(h, {
    align,
    size: "sm",
    withIndicatorBackground: true,
    icon: FolderOpenIcon(h, {}),
    title: `Aligned ${align}`,
    description: "This folder has no files yet. Upload one or drag it here.",
    actions: [ui.Button(h, { variant: "default", size: "xs", children: ["Upload"] })]
  })

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, { gap: "xl", children: [folder(h, ui, "left"), folder(h, ui, "right")] })
