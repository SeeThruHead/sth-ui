import type { Html, HtmlBuilder } from "foldkit/html"
import { LockIcon } from "@sth-ui/icons/icons/LockIcon.ts"
import type { Ui } from "../../../../Ui.ts"

export const view = <M>(h: HtmlBuilder<M>, ui: Ui): Html =>
  ui.Box(h, {
    w: "100%",
    maw: 340,
    children: [
      ui.PasswordInput(h, {
        id: "left-section",
        leftSection: LockIcon(h, { size: 18 }),
        leftSectionPointerEvents: "none",
        label: "With left section",
        placeholder: "With left section"
      }),
      ui.PasswordInput(h, {
        id: "right-section",
        mt: "md",
        rightSection: LockIcon(h, { size: 18 }),
        rightSectionPointerEvents: "none",
        label: "With right section",
        placeholder: "With right section"
      })
    ]
  })
