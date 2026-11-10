import type { Html, HtmlBuilder } from "foldkit/html"
import { CameraIcon } from "@sth-ui/icons/icons/CameraIcon.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { PrinterIcon } from "@sth-ui/icons/icons/PrinterIcon.ts"
import { colors } from "../../../theme/tokens.stylex.ts"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, single } from "./accordions.ts"
import type { Message, Model } from "./accordions.ts"

export { Message, Model } from "./accordions.ts"

export const { init, update } = accordionsDemo(["photos"])

const icon = (glyph: typeof ImageIcon, h: HtmlBuilder<Message>) => glyph(h, { size: 22, color: colors.dimmed })

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Accordion(h, {
    id: "icons",
    ...single(model, 0),
    variant: "filled",
    order: 3,
    mih: 200,
    maw: 380,
    w: "100%",
    children: [
      accordionItem({
        value: "photos",
        children: [
          accordionControl({ icon: icon(ImageIcon, h), children: ["Recent photos"] }),
          accordionPanel({ children: ["Content"] })
        ]
      }),
      accordionItem({
        value: "print",
        children: [
          accordionControl({ icon: icon(PrinterIcon, h), children: ["Print photos"] }),
          accordionPanel({ children: ["Content"] })
        ]
      }),
      accordionItem({
        value: "camera",
        children: [
          accordionControl({ icon: icon(CameraIcon, h), children: ["Camera settings"] }),
          accordionPanel({ children: ["Content"] })
        ]
      })
    ]
  })
