import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { pictureState, pictureTimeout, present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configure, demo, story } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import type { AvatarSize } from "./Avatar.ts"
import * as UsageDemo from "./demos/usage.ts"
import * as InitialsDemo from "./demos/initials.ts"
import * as AllowedColorsDemo from "./demos/allowed-colors.ts"
import * as PlaceholdersDemo from "./demos/placeholders.ts"
import * as VariantsDemo from "./demos/variants.ts"
import * as SizesDemo from "./demos/sizes.ts"
import * as GroupDemo from "./demos/group.ts"

const meta: Meta = { title: "Data display/Avatar" }

export default meta

const box = (element: Element | null) => present(element).getBoundingClientRect()

const css = (element: Element | null) => getComputedStyle(present(element))

const names = ["John Doe", "Jane Mol", "Alex Lump", "Sarah Condor", "Mike Johnson", "Kate Kok", "Tom Smith"]

const sizes: ReadonlyArray<AvatarSize> = ["xs", "sm", "md", "lg", "xl"]

const placeholderOf = (canvas: ReturnType<typeof within>, title: string) => present(canvas.getByTitle(title))

export const Usage: StoryObj = {
  render: demo(UsageDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const me = await canvas.findByRole("img", { name: "it's me" })
    await waitFor(() => expect(me).toHaveAttribute("src", "images/avatar-1.svg"))
    await expect(box(present(me.parentElement)).width).toBe(38)
    await expect(css(present(me.parentElement)).borderTopLeftRadius).toBe("1000px")
    await expect(placeholderOf(canvas, "it's me")).toHaveAttribute("hidden")
    const icon = placeholderOf(canvas, "Default placeholder")
    await expect(icon.querySelector("[data-avatar-placeholder-icon]")).not.toBeNull()
    await expect(css(icon).backgroundColor).toBe("rgb(241, 243, 245)")
    const letters = placeholderOf(canvas, "Letters")
    await expect(letters).toHaveTextContent("MK")
    await expect(css(letters).fontSize).toBe("15.2px")
    await expect(css(letters).color).toBe("rgb(11, 114, 133)")
    await expect(css(placeholderOf(canvas, "Custom icon")).borderTopLeftRadius).toBe("4px")
  }
}

export const Initials: StoryObj = {
  render: demo(InitialsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByTitle("John Doe")).toHaveTextContent("JD")
    await expect(css(placeholderOf(canvas, "John Doe")).color).toBe("rgb(92, 148, 13)")
    await expect(css(placeholderOf(canvas, "Alex Lump")).color).toBe("rgb(166, 30, 77)")
    await expect(css(placeholderOf(canvas, "Tom Smith")).color).toBe("rgb(24, 100, 171)")
  }
}

export const AllowedColors: StoryObj = {
  render: demo(AllowedColorsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTitle("John Doe")
    const colours = names.map((name) => css(placeholderOf(canvas, name)).color)
    await expect(new Set(colours).size).toBeLessThanOrEqual(2)
    await expect(colours.every((colour) => colour === "rgb(24, 100, 171)" || colour === "rgb(201, 42, 42)")).toBe(true)
  }
}

export const Placeholders: StoryObj = {
  render: demo(PlaceholdersDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByTitle("no image here, indigo")).color).toBe("rgb(54, 79, 199)")
    await expect(placeholderOf(canvas, "Vitaly Rtishchev")).toHaveTextContent("VR")
    await expect(placeholderOf(canvas, "A star").querySelector("[data-icon='star']")).not.toBeNull()
  }
}

export const Variants: StoryObj = {
  render: demo(VariantsDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByTitle("filled")).backgroundColor).toBe("rgb(34, 139, 230)")
    await expect(css(placeholderOf(canvas, "outline")).borderTopColor).toBe("rgb(34, 139, 230)")
    await expect(css(placeholderOf(canvas, "gradient")).backgroundImage).toBe(
      "linear-gradient(45deg, rgb(34, 139, 230) 0%, rgb(21, 170, 191) 100%)"
    )
  }
}

export const Sizes: StoryObj = {
  render: demo(SizesDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findByTitle("Size xs")
    await expect(sizes.map((size) => box(placeholderOf(canvas, `Size ${size}`)).width)).toEqual([16, 26, 38, 56, 84])
    await expect(box(placeholderOf(canvas, "100 pixels")).width).toBe(100)
    await expect(box(placeholderOf(canvas, "3rem")).width).toBe(48)
    await expect(css(placeholderOf(canvas, "3rem")).borderTopLeftRadius).toBe("8px")
  }
}

export const Group: StoryObj = {
  render: demo(GroupDemo.view, { centered: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const group = await canvas.findByLabelText("Team")
    const ben = present((await canvas.findByRole("img", { name: "Ben" })).parentElement)
    await expect(ben).toHaveAttribute("data-within-group")
    await expect(css(ben).marginLeft).toBe("-12px")
    await expect(css(ben).borderTopWidth).toBe("2px")
    await expect(css(group).paddingLeft).toBe("12px")
    await expect(placeholderOf(canvas, "Five more")).toHaveTextContent("+5")
  }
}

export const GroupSpacing: StoryObj = {
  render: story(({ h, ui }) =>
    ui.AvatarGroup(h, {
      spacing: "xl",
      children: [
        { name: "Ana Bell", alt: "Ana" },
        { name: "Ben Ross", alt: "Ben" },
        { src: "images/avatar-3.svg" },
        { children: ["+2"] }
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const ben = present((await canvas.findByTitle("Ben")).parentElement)
    await expect(css(ben).marginLeft).toBe("-32px")
    await expect(canvas.getByText("+2")).not.toHaveAttribute("title")
    await expect(present(present(ben.parentElement).querySelector("img"))).not.toHaveAttribute("alt")
  }
}

export const AsLink: StoryObj = {
  render: story(({ h, ui }) =>
    ui.Avatar(h, {
      component: "a",
      src: "images/avatar-2.svg",
      alt: "Ben's profile",
      attributes: { root: { href: "#profile" } }
    })
  ),
  play: async ({ canvasElement }) => {
    const link = await within(canvasElement).findByRole("link", { name: "Ben's profile" })
    await expect(link).toHaveAttribute("href", "#profile")
  }
}

export const BrokenImage: StoryObj = {
  render: story(({ h, ui, value, set }) =>
    ui.Stack(h, {
      maw: 300,
      children: [
        ui.Avatar(h, {
          src: value("src", "images/missing.png"),
          name: "Ana Bell",
          alt: "Ana Bell",
          autoContrast: true
        }),
        ui.Avatar(h, { src: "", alt: "Empty source" }),
        ui.Button(h, { size: "xs", onClick: set("src", "images/avatar-1.svg"), children: ["Fix picture"] })
      ]
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const image = await canvas.findByRole("img", { hidden: true, name: "Ana Bell" })
    const placeholder = placeholderOf(canvas, "Ana Bell")
    await waitFor(() => expect(image.hasAttribute("hidden"), pictureState(image)).toBe(true), pictureTimeout)
    await expect(placeholder).not.toHaveAttribute("hidden")
    await expect(placeholder).toHaveTextContent("AB")
    await userEvent.click(canvas.getByRole("button", { name: "Fix picture" }))
    await waitFor(() => expect(image).toHaveAttribute("src", "images/avatar-1.svg"))
    await expect(image).not.toHaveAttribute("hidden")
    await expect(placeholder).toHaveAttribute("hidden")
    await expect(placeholderOf(canvas, "Empty source")).not.toHaveAttribute("hidden")
  }
}

export const AutoContrast: StoryObj = {
  render: story(
    ({ h, ui }) =>
      ui.Group(h, {
        children: [
          ui.Avatar(h, { variant: "filled", color: "lime", alt: "Default", children: ["LM"] }),
          ui.Avatar(h, { variant: "filled", color: "lime", autoContrast: true, alt: "Auto contrast", children: ["LM"] })
        ]
      }),
    { centered: true }
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(css(await canvas.findByTitle("Default")).color).toBe("rgb(255, 255, 255)")
    await expect(css(placeholderOf(canvas, "Auto contrast")).color).toBe("rgb(0, 0, 0)")
  }
}

export const Dark: StoryObj = {
  globals: { scheme: "dark" },
  render: story(
    ({ h, ui }) =>
      ui.AvatarGroup(h, {
        children: [
          { name: "Ana Bell", alt: "Ana" },
          { name: "Ben Ross", alt: "Ben" }
        ]
      }),
    { centered: true }
  ),
  play: async ({ canvasElement }) => {
    const ben = present((await within(canvasElement).findByTitle("Ben")).parentElement)
    await expect(css(ben).borderTopColor).toBe("rgb(36, 36, 36)")
  }
}

export const Configurator: StoryObj = {
  render: configure(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("img", { name: "it's me" })).toBeVisible()
  }
}
