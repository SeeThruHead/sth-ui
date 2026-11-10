import type { Html, HtmlBuilder } from "foldkit/html"
import type { Ui } from "../../../Ui.ts"
import { accordionControl, accordionItem, accordionPanel } from "../Accordion.ts"
import { accordionsDemo, single } from "./accordions.ts"
import type { Message, Model } from "./accordions.ts"

export { Message, Model } from "./accordions.ts"

export const { init, update } = accordionsDemo([null])

const characters = [
  {
    id: "bender",
    image: "images/avatar-1.svg",
    label: "Bender Bending Rodríguez",
    description: "Fascinated with cooking, though has no sense of taste",
    content:
      "Bender Bending Rodríguez, (born September 4, 2996), designated Bending Unit 22, and commonly known as Bender, is a bending unit created by a division of MomCorp in Tijuana, Mexico, and his serial number is 2716057."
  },
  {
    id: "carol",
    image: "images/avatar-2.svg",
    label: "Carol Miller",
    description: "One of the richest people on Earth",
    content:
      "Carol Miller (born January 30, 2880), better known as Mom, is the evil chief executive officer and shareholder of 99.7% of Momcorp, one of the largest industrial conglomerates in the universe."
  },
  {
    id: "homer",
    image: "images/avatar-3.svg",
    label: "Homer Simpson",
    description: "Overweight, lazy, and often ignorant",
    content:
      "Homer Jay Simpson (born May 12) is the main protagonist and one of the five main characters of The Simpsons series. He is the spouse of Marge Simpson and father of Bart, Lisa and Maggie Simpson."
  }
] as const

export const view = (model: Model, h: HtmlBuilder<Message>, ui: Ui): Html =>
  ui.Accordion(h, {
    id: "label",
    ...single(model, 0),
    chevronPosition: "right",
    variant: "contained",
    maw: 480,
    w: "100%",
    children: characters.map((item) =>
      accordionItem({
        value: item.id,
        children: [
          accordionControl({
            ariaLabel: item.label,
            children: [
              ui.Group(h, {
                wrap: "nowrap",
                children: [
                  ui.Avatar(h, { src: item.image, radius: "xl", size: "lg", alt: item.label }),
                  h.div(
                    [],
                    [
                      ui.Text(h, { children: [item.label] }),
                      ui.Text(h, { size: "sm", c: "dimmed", fw: 400, children: [item.description] })
                    ]
                  )
                ]
              })
            ]
          }),
          accordionPanel({ children: [ui.Text(h, { size: "sm", children: [item.content] })] })
        ]
      })
    )
  })
