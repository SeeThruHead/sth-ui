import type { Meta, StoryObj } from "@storybook/html-vite"
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test"
import { present } from "@sth-ui/core/stories/dom.ts"
import { initialArgs } from "@sth-ui/core/stories/controls.ts"
import { configureApp, demoApp } from "@sth-ui/core/stories/harness.ts"
import * as ConfiguratorDemo from "./demos/configurator.ts"
import * as UsageDemo from "./demos/usage.ts"

const meta: Meta = { title: "Dates/TimePicker" }

export default meta

const page = within(document.body)

const field = async (canvasElement: HTMLElement, selector: string) => {
  await within(canvasElement).findByText(/plain=/)

  return present(canvasElement.querySelector<HTMLInputElement>(`#${selector}`))
}

const values = (canvasElement: HTMLElement) => present(within(canvasElement).getByText(/plain=/).textContent)

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const hours = await field(canvasElement, "plain-hours")
    await expect(hours).toHaveValue("14")
    await expect(hours).toHaveAttribute("role", "spinbutton")
    await expect(await field(canvasElement, "plain-minutes")).toHaveValue("30")
    await expect(await field(canvasElement, "plain-minutes")).toHaveAttribute("tabindex", "-1")
    await expect(present(canvasElement.querySelector<HTMLInputElement>("input[name='time']")).value).toBe("14:30")
    await expect(await field(canvasElement, "dropdown-hours")).toHaveAttribute("data-empty")
    await expect(await field(canvasElement, "dropdown-amPm")).toHaveValue("--")
    await expect(await field(canvasElement, "duration-hours")).toHaveAttribute("placeholder", "---")
    await expect(await field(canvasElement, "locked-amPm")).toHaveValue("AM")
    await expect(within(canvasElement).getAllByRole("button", { name: "Clear" })).toHaveLength(1)
    await expect(await field(canvasElement, "off-hours")).toBeDisabled()
    await expect(await field(canvasElement, "off-amPm")).toBeDisabled()
  }
}

export const Typing: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const hours = await field(canvasElement, "plain-hours")
    const minutes = await field(canvasElement, "plain-minutes")
    await userEvent.click(hours)
    await userEvent.keyboard("9")
    await waitFor(() => expect(minutes).toHaveFocus())
    await userEvent.keyboard("45")
    await waitFor(() => expect(values(canvasElement)).toContain("plain=09:45"))
    await userEvent.keyboard("{ArrowUp}")
    await waitFor(() => expect(values(canvasElement)).toContain("plain=09:46"))
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(values(canvasElement)).toContain("plain=-"))
    await userEvent.keyboard("{Backspace}")
    await waitFor(() => expect(hours).toHaveFocus())
    await userEvent.keyboard("{ArrowRight}")
    await waitFor(() => expect(minutes).toHaveFocus())
    await userEvent.keyboard("{End}")
    await waitFor(() => expect(values(canvasElement)).toContain("plain=09:59"))
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Clear" }))
    await waitFor(() => expect(hours).toHaveValue(""))
    await waitFor(() => expect(hours).toHaveFocus())
    await userEvent.click(within(canvasElement).getByText("Working hours"))
    await waitFor(() => expect(present(document.activeElement).id).toBe("limited-hours"))
    await fireEvent.mouseDown(present(hours.closest("[data-time-picker]")))
    await waitFor(() => expect(hours).toHaveFocus())
    await fireEvent.mouseDown(within(canvasElement).getByText("24 hour format"))
    await expect(hours).toHaveFocus()
  }
}

export const Dropdown: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await field(canvasElement, "dropdown-hours"))
    const dropdown = within(
      present(await waitFor(() => present(document.querySelector<HTMLElement>("[data-time-picker-dropdown]"))))
    )
    await userEvent.click(dropdown.getAllByRole("button", { name: "03" })[0] ?? canvasElement)
    await userEvent.click(dropdown.getAllByRole("button", { name: "15" })[0] ?? canvasElement)
    await userEvent.click(dropdown.getAllByRole("button", { name: "00" })[1] ?? canvasElement)
    await userEvent.click(dropdown.getByRole("button", { name: "PM" }))
    await waitFor(() => expect(values(canvasElement)).toContain("dropdown=15:15:00"))
    await expect(dropdown.getByRole("button", { name: "PM" })).toHaveAttribute("data-active")
    const amPm = await field(canvasElement, "dropdown-amPm")
    amPm.focus()
    await userEvent.keyboard("a")
    await waitFor(() => expect(values(canvasElement)).toContain("dropdown=03:15:00"))
    await userEvent.keyboard("{ArrowLeft}")
    await waitFor(() => expect(present(document.activeElement).id).toBe("dropdown-seconds"))
    await userEvent.click(await field(canvasElement, "plain-hours"))
    await waitFor(() => expect(document.querySelector("[data-time-picker-dropdown]")).toBeNull())
    await userEvent.click(await field(canvasElement, "dropdown-minutes"))
    const reopened = await waitFor(() => present(document.querySelector<HTMLElement>("[data-time-picker-dropdown]")))
    await expect(within(reopened).getByRole("button", { name: "PM" })).not.toHaveAttribute("data-active")
    await expect(within(reopened).getByRole("button", { name: "AM" })).toHaveAttribute("data-active")
  }
}

export const LimitsAndDuration: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const hours = await field(canvasElement, "limited-hours")
    await userEvent.click(hours)
    const limitedDropdown = within(
      await waitFor(() => present(document.querySelector<HTMLElement>("[data-time-picker-dropdown]")))
    )
    await expect(limitedDropdown.getByRole("button", { name: "45" })).toBeInTheDocument()
    await expect(limitedDropdown.queryByRole("button", { name: "AM" })).toBeNull()
    await expect(limitedDropdown.getAllByRole("button")[0]).toHaveTextContent("23")
    await userEvent.keyboard("08")
    await waitFor(() => expect(present(document.activeElement).id).toBe("limited-minutes"))
    await userEvent.keyboard("00")
    await waitFor(() => expect(values(canvasElement)).toContain("limited=08:00"))
    await userEvent.click(await field(canvasElement, "duration-hours"))
    await waitFor(() => expect(values(canvasElement)).toContain("limited=09:00"))
    await userEvent.keyboard("125{ArrowRight}")
    await waitFor(() => expect(present(document.activeElement).id).toBe("duration-minutes"))
    await userEvent.keyboard("30")
    await waitFor(() => expect(present(document.activeElement).id).toBe("duration-seconds"))
    await userEvent.keyboard("5")
    await waitFor(() => expect(values(canvasElement)).toContain("duration=125:30:05"))
    await expect(await field(canvasElement, "duration-hours")).toHaveValue("125")
  }
}

export const PresetsAndPaste: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await field(canvasElement, "presets-hours"))
    await expect(await page.findByText("Afternoon")).toBeVisible()
    await userEvent.click(page.getByRole("button", { name: "14:00" }))
    await waitFor(() => expect(values(canvasElement)).toContain("presets=14:00"))
    await waitFor(() => expect(page.queryByText("Afternoon")).toBeNull())
    const data = new DataTransfer()
    data.setData("text/plain", "07:20")
    const minutes = await field(canvasElement, "plain-minutes")
    minutes.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }))
    await waitFor(() => expect(values(canvasElement)).toContain("plain=07:20"))
    const select = await field(canvasElement, "select-amPm")
    await expect(select).toHaveValue("pm")
    await userEvent.selectOptions(select, "am")
    await waitFor(() => expect(values(canvasElement)).toContain("select=09:05"))
    await userEvent.keyboard("p")
    await waitFor(() => expect(values(canvasElement)).toContain("select=21:05"))
    await userEvent.keyboard("{Tab}")
    await userEvent.selectOptions(select, "--")
    await waitFor(() => expect(values(canvasElement)).toContain("select=-"))
    await userEvent.click(await field(canvasElement, "flat-hours"))
    await expect(await page.findByRole("button", { name: "10:30:00" })).toHaveAttribute("data-active")
    await userEvent.click(page.getByRole("button", { name: "11:00:00" }))
    await waitFor(() => expect(values(canvasElement)).toContain("flat=11:00:00"))
    const locked = await field(canvasElement, "locked-hours")
    await userEvent.click(locked)
    await userEvent.keyboard("{ArrowUp}")
    await expect(locked).toHaveValue("08")
    await waitFor(() => expect(document.querySelector("[data-time-picker-dropdown]")).toBeNull())
  }
}

export const Configurator: StoryObj = {
  render: configureApp(ConfiguratorDemo, { centered: true }),
  args: initialArgs(ConfiguratorDemo.configurator.controls),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText("Input label")).toBeVisible()
    await expect(canvas.getByText("Input description")).toBeVisible()
  }
}
