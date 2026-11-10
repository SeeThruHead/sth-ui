import type { Html, HtmlBuilder } from "foldkit/html"
import { CaretDownIcon } from "@sth-ui/icons/icons/CaretDownIcon.ts"
import { HashIcon } from "@sth-ui/icons/icons/HashIcon.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    gap: "md",
    children: [
      ui.NativeSelect(h, {
        id: "left",
        leftSection: HashIcon(h, { size: 16 }),
        leftSectionPointerEvents: "none",
        label: "Left section",
        data: ["React", "Angular"]
      }),
      ui.NativeSelect(h, {
        id: "right",
        rightSection: CaretDownIcon(h, { size: 16 }),
        label: "Right section",
        data: ["React", "Angular"]
      })
    ]
  })
