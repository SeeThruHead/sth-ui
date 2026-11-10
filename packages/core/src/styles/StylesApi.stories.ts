import type { Meta, StoryObj } from "@storybook/html-vite"
import * as stylex from "@stylexjs/stylex"
import { expect, within } from "storybook/test"
import { demo } from "../stories/harness.ts"
import { present } from "../stories/dom.ts"
import * as EveryPartDemo from "./demos/every-part.ts"
import * as ThemeThenPropsDemo from "./demos/theme-then-props.ts"
import * as UnstyledDemo from "./demos/unstyled.ts"

const meta: Meta = { title: "Theming/Styles API" }

export default meta

const brand = stylex.create({
  root: { textTransform: "uppercase" },
  label: { fontStyle: "italic" }
})

export const EveryPart: StoryObj = {
  render: demo(EveryPartDemo.view),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "★ Every part" })
    await expect(getComputedStyle(button).borderTopStyle).toBe("dashed")
    await expect(getComputedStyle(button).borderTopWidth).toBe("2px")
    await expect(button).toHaveAttribute("data-part", "root")
    const label = within(button).getByText("Every part")
    await expect(label).toHaveAttribute("data-part", "label")
    await expect(getComputedStyle(label).fontWeight).toBe("400")
    await expect(getComputedStyle(within(button).getByText("★")).color).toBe("rgb(250, 82, 82)")
    await expect(getComputedStyle(present(label.parentElement)).columnGap).toBe("4px")
  }
}

export const ThemeThenProps: StoryObj = {
  render: demo(ThemeThenPropsDemo.view, {
    config: {
      components: {
        Button: {
          defaultProps: { variant: "outline", order: ["rightSection", "label", "leftSection"] },
          styles: brand
        }
      }
    }
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const themed = await canvas.findByRole("button", { name: "From the theme" })
    await expect(getComputedStyle(themed).textTransform).toBe("uppercase")
    await expect(getComputedStyle(themed).backgroundColor).toBe("rgba(0, 0, 0, 0)")
    await expect(getComputedStyle(within(themed).getByText("From the theme")).fontStyle).toBe("italic")
    const props = canvas.getByRole("button", { name: "Props win" })
    await expect(getComputedStyle(props).backgroundColor).toBe("rgb(208, 235, 255)")
    await expect(getComputedStyle(within(props).getByText("Props win")).letterSpacing).toBe("1.12px")
  }
}

export const Unstyled: StoryObj = {
  render: demo(UnstyledDemo.view),
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole("button", { name: "Only my styles" })
    await expect(getComputedStyle(button).borderTopStyle).toBe("dashed")
    await expect(getComputedStyle(button).backgroundColor).toBe("rgb(239, 239, 239)")
  }
}
