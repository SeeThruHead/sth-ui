import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { tourDemo } from "./tours.ts"
import type { Message, Model } from "./tours.ts"

export { Message, Model } from "./tours.ts"

const demo = tourDemo(
  "labels-tour",
  [
    { target: "labels-target-1", title: "Paso 1", children: ["Este es el primer paso del recorrido."] },
    { target: "labels-target-2", title: "Paso 2", children: ["Este es el segundo paso del recorrido."] }
  ],
  {
    labels: {
      next: "Siguiente",
      back: "Anterior",
      skip: "Omitir",
      close: "Cerrar",
      stepCounter: (current, total) => `${current} de ${total}`
    }
  }
)

export const { init, update } = demo

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Box(h, {
    children: [
      ui.Group(h, {
        children: [
          ui.Button(h, { id: "labels-target-1", children: ["Primer objetivo"] }),
          ui.TextInput(h, {
            id: "labels-target-2",
            placeholder: "Segundo objetivo",
            attributes: { input: { "aria-label": "Segundo objetivo" } }
          })
        ]
      }),
      ui.Button(h, { mt: "md", onClick: demo.startAt(0), children: ["Iniciar recorrido"] }),
      ui.Tour(h, demo.tour(model))
    ]
  })
