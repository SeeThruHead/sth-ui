import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"

const frameworks = ["React", "Angular", "Vue", "Svelte"]

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Stack(h, {
    maw: 340,
    mx: "auto",
    gap: "md",
    children: [
      ui.NativeSelect(h, { id: "loading", label: "Your favorite framework", data: frameworks, loading: true }),
      ui.NativeSelect(h, {
        id: "disabled",
        label: "Disabled NativeSelect",
        data: ["React", "Angular"],
        disabled: true
      }),
      ui.NativeSelect(h, { id: "boolean-error", label: "Boolean error", data: ["React", "Angular"], error: true }),
      ui.NativeSelect(h, {
        id: "error",
        label: "React node error",
        data: ["React", "Angular"],
        error: "Error message"
      }),
      ui.NativeSelect(h, { id: "success", label: "Native Select", data: frameworks, success: "Looks good!" }),
      ui.NativeSelect(h, { id: "large", label: "Large", size: "xl", data: frameworks })
    ]
  })
