import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { present } from "../../stories/dom.ts"
import { initialArgs } from "../../stories/controls.ts"
import { configureApp, demoApp } from "../../stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as BehaviourDemo from "./demos/behaviour.ts"
import * as DisplayDemo from "./demos/display.ts"
import * as SearchDemo from "./demos/search.ts"
import * as StatesDemo from "./demos/states.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Combobox/Cascader" }

export default meta

const page = within(document.body)

const css = (element: Element | null | undefined) => getComputedStyle(present(element))

const trigger = (canvasElement: HTMLElement, name: string) => within(canvasElement).findByRole("button", { name })

const columns = () => Array.from(document.querySelectorAll<HTMLElement>("[role=listbox]"))

const option = (name: string) => page.getByRole("option", { name })

const opened = async (canvasElement: HTMLElement, name: string) => {
  await userEvent.setup().click(await trigger(canvasElement, name))
  await waitFor(() => expect(columns().length).toBeGreaterThan(0))
}

export const Usage: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const button = await trigger(canvasElement, "Location")
    await expect(button).toHaveTextContent("Pick location")
    await expect(button).toHaveAttribute("aria-haspopup", "listbox")
    await expect(button.parentElement?.querySelector("[data-combobox-chevron]")).not.toBeNull()
  }
}

export const Choosing: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await opened(canvasElement, "Location")
    await expect(columns()).toHaveLength(1)
    await expect(within(present(columns()[0])).getAllByRole("option")).toHaveLength(3)
    await user.click(option("Asia"))
    await waitFor(() => expect(columns()).toHaveLength(2))
    await expect(option("Asia")).toHaveAttribute("data-in-path")
    await expect(option("Japan")).toHaveAttribute("data-active")
    await expect(css(option("Japan")).backgroundColor).toBe("rgb(34, 139, 230)")
    await user.click(option("Japan"))
    await waitFor(() => expect(columns()).toHaveLength(3))
    await user.click(option("Osaka"))
    await waitFor(() =>
      expect(within(canvasElement).getByRole("button", { name: "Location" })).toHaveTextContent("Asia / Japan / Osaka")
    )
    await waitFor(() => expect(columns()).toHaveLength(0))
    await user.click(within(canvasElement).getByRole("button", { name: "Location" }))
    await waitFor(() => expect(option("Osaka")).toHaveAttribute("aria-selected", "true"))
    await expect(option("Osaka").querySelector("svg")).not.toBeNull()
  }
}

export const Keyboard: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    const button = await trigger(canvasElement, "Location")
    button.focus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(document.activeElement).toHaveAttribute("tabindex", "-1"))
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(option("Asia")).toHaveAttribute("data-active"))
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(option("Japan")).toHaveAttribute("data-active"))
    await user.keyboard("{ArrowRight}")
    await waitFor(() => expect(option("Tokyo")).toHaveAttribute("data-active"))
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(option("Osaka")).toHaveAttribute("data-active"))
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(option("Japan")).toHaveAttribute("data-active"))
    await user.keyboard("{ArrowRight}{ArrowDown}{Enter}")
    await waitFor(() => expect(button).toHaveTextContent("Asia / Japan / Osaka"))
  }
}

export const Behaviour: StoryObj = {
  render: demoApp(BehaviourDemo),
  play: async ({ canvasElement }) => {
    await expect(await trigger(canvasElement, "Cannot deselect")).toHaveTextContent("Asia / Japan / Tokyo")
  }
}

export const ChangingOnSelect: StoryObj = {
  render: demoApp(BehaviourDemo),
  play: async ({ canvasElement }) => {
    await opened(canvasElement, "Change on select")
    await userEvent.setup().click(option("Europe"))
    await waitFor(() =>
      expect(within(canvasElement).getByRole("button", { name: "Change on select" })).toHaveTextContent("Europe")
    )
  }
}

export const StayingOpen: StoryObj = {
  render: demoApp(BehaviourDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await opened(canvasElement, "Stays open")
    await user.click(option("Asia"))
    await user.click(await page.findByRole("option", { name: "Japan" }))
    await user.click(await page.findByRole("option", { name: "Kyoto" }))
    await waitFor(() =>
      expect(within(canvasElement).getByRole("button", { name: "Stays open" })).toHaveTextContent("Kyoto")
    )
    await expect(columns()).toHaveLength(3)
  }
}

export const KeepingSelection: StoryObj = {
  render: demoApp(BehaviourDemo),
  play: async ({ canvasElement }) => {
    await opened(canvasElement, "Cannot deselect")
    await userEvent.setup().click(await page.findByRole("option", { name: "Tokyo" }))
    await waitFor(() => expect(columns()).toHaveLength(0))
    await expect(within(canvasElement).getByRole("button", { name: "Cannot deselect" })).toHaveTextContent("Tokyo")
  }
}

export const ExpandingOnHover: StoryObj = {
  render: demoApp(BehaviourDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await opened(canvasElement, "Expands on hover")
    await user.hover(option("Europe"))
    await waitFor(() => expect(option("France")).toBeVisible())
    await user.hover(await page.findByRole("option", { name: "France" }))
    await waitFor(() => expect(option("Paris")).toBeVisible())
    await user.hover(option("Paris"))
    await waitFor(() => expect(option("Paris")).toHaveAttribute("data-active"))
  }
}

export const Display: StoryObj = {
  render: demoApp(DisplayDemo),
  play: async ({ canvasElement }) => {
    await expect(await trigger(canvasElement, "Last level only")).toHaveTextContent("Paris")
    await expect(within(canvasElement).getByRole("button", { name: "Custom separator" })).toHaveTextContent(
      "Asia → South Korea → Seoul"
    )
    await expect(present(canvasElement.querySelector("input[type=hidden][name=city]"))).toHaveValue("asia,kr,seoul")
  }
}

export const Clearing: StoryObj = {
  render: demoApp(DisplayDemo),
  play: async ({ canvasElement }) => {
    await userEvent.setup().click(await within(canvasElement).findByRole("button", { name: "Clear" }))
    await waitFor(() => expect(present(canvasElement.querySelector("input[type=hidden][name=city]"))).toHaveValue(""))
    await expect(within(canvasElement).queryByRole("button", { name: "Clear" })).toBeNull()
  }
}

export const WideColumns: StoryObj = {
  render: demoApp(DisplayDemo),
  play: async ({ canvasElement }) => {
    await opened(canvasElement, "Wide columns, check on the left")
    await expect(present(columns()[0]).getBoundingClientRect().width).toBe(240)
    await expect(option("Asia")).toHaveTextContent("Asia")
    await userEvent.setup().click(option("Asia"))
    await waitFor(() => expect(page.getByRole("option", { name: "· Japan" })).toBeVisible())
  }
}

export const Search: StoryObj = {
  render: demoApp(SearchDemo),
  play: async ({ canvasElement }) => {
    await expect(await trigger(canvasElement, "Searchable")).toHaveTextContent("Pick location")
    await expect(within(canvasElement).getByRole("button", { name: "Flat list" })).toBeVisible()
  }
}

export const Searching: StoryObj = {
  render: demoApp(SearchDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await opened(canvasElement, "Searchable")
    const search = await page.findByPlaceholderText("Search...")
    await waitFor(() => expect(search).toHaveFocus())
    await user.keyboard("tok")
    await waitFor(() => expect(option("Asia / Japan / Tokyo")).toBeVisible())
    await user.click(option("Asia / Japan / Tokyo"))
    await waitFor(() =>
      expect(within(canvasElement).getByRole("button", { name: "Searchable" })).toHaveTextContent("Tokyo")
    )
    await waitFor(() => expect(columns()).toHaveLength(0))
    await user.click(within(canvasElement).getByRole("button", { name: "Searchable" }))
    await waitFor(() => expect(document.activeElement).toHaveAttribute("placeholder", "Search..."))
    await user.keyboard("zzz")
    await waitFor(() => expect(page.getByText("Nothing found...")).toBeVisible())
  }
}

export const FlatList: StoryObj = {
  render: demoApp(SearchDemo),
  play: async ({ canvasElement }) => {
    await opened(canvasElement, "Flat list")
    await expect(option("Europe / France / Paris")).toHaveAttribute("aria-disabled", "true")
    await userEvent.setup().click(option("Asia / South Korea / Seoul"))
    await waitFor(() =>
      expect(within(canvasElement).getByRole("button", { name: "Flat list" })).toHaveTextContent("Seoul")
    )
  }
}

export const States: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    await expect(await trigger(canvasElement, "Disabled")).toBeDisabled()
    const error = within(canvasElement).getByRole("button", { name: "With error" })
    await expect(error).toHaveAttribute("aria-invalid", "true")
    await expect(within(canvasElement).getByText("Pick a city")).toBeVisible()
  }
}

export const DisabledOptions: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await opened(canvasElement, "Disabled options")
    await expect(option("Europe")).toHaveAttribute("data-disabled")
    await user.click(option("Europe"))
    await expect(columns()).toHaveLength(1)
    await user.keyboard("{ArrowDown}{ArrowDown}")
    await waitFor(() => expect(option("North America")).toHaveAttribute("data-active"))
  }
}

export const RightToLeft: StoryObj = {
  render: demoApp(StatesDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await opened(canvasElement, "With error")
    await waitFor(() => expect(document.activeElement).toHaveAttribute("tabindex", "-1"))
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(option("Asia")).toHaveAttribute("data-active"))
    await user.keyboard("{ArrowLeft}")
    await waitFor(() => expect(option("Japan")).toHaveAttribute("data-active"))
    await expect(css(option("Asia").lastElementChild).rotate).toBe("90deg")
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Input label")).toBeVisible()
  }
}
