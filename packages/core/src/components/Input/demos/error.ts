import type { Html, HtmlBuilder } from "foldkit/html"
import { WarningCircleIcon } from "@sth-ui/icons/icons/WarningCircleIcon.ts"
import { palette } from "../../../theme/palette.stylex.ts"
import type { Ui } from "../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.InputWrapper(h, {
        id: "error-boolean",
        label: "Error as boolean",
        error: true,
        input: (wiring) => ui.Input(h, { ...wiring, error: true, placeholder: "Error as boolean" })
      }),
      ui.InputWrapper(h, {
        id: "error-text",
        mt: "md",
        label: "Error as text",
        error: "Something went wrong",
        input: (wiring) => ui.Input(h, { ...wiring, error: true, placeholder: "Error as text" })
      }),
      ui.InputWrapper(h, {
        id: "error-plain",
        mt: "md",
        label: "Without error styles on input",
        error: "Something went wrong",
        input: (wiring) =>
          ui.Input(h, {
            ...wiring,
            error: true,
            withErrorStyles: false,
            placeholder: "Without error styles on input",
            rightSection: WarningCircleIcon(h, { size: 20, color: palette.red6 })
          })
      })
    ]
  })
