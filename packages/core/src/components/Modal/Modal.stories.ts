import type { Meta, StoryObj } from "@storybook/html-vite"
import { Schema } from "effect"
import type { HtmlBuilder } from "foldkit/html"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { app, demoApp, eventsView } from "../../stories/harness.ts"
import * as CenteredDemo from "./demos/centered.ts"
import * as CompoundDemo from "./demos/compound.ts"
import * as StackDemo from "./demos/stack.ts"
import * as OpenedDemo from "./demos/opened.ts"
import * as UsageDemo from "./demos/usage.ts"
import type { Ui } from "../../Ui.ts"
import * as Modal from "./Modal.ts"
import type { ModalProps } from "./Modal.ts"
import { present } from "../../stories/dom.ts"
import { setStyle } from "../../styles/StylesApi.ts"

const meta: Meta = { title: "Overlays/Modal", parameters: { layout: "fullscreen" } }

export default meta

const Model = Schema.Struct({ modal: Modal.Model, events: Schema.Array(Schema.String) })
type Model = typeof Model.Type

const Message = defineMessageUnion({ GotModal: { message: Modal.Message }, PressedOpen: {} })
type Message = typeof Message.Type

const liftedCommands = <Wrapped>(result: Modal.Result, wrap: (message: Modal.Message) => Wrapped) =>
  result.commands.map((command) => Command.mapMessage(command, wrap))

const settle = (model: Model, result: Modal.Result) => ({
  model: { modal: result.model, events: [...model.events, ...result.outMessages.map((out) => out._tag)] },
  commands: liftedCommands(result, (message) => Message.GotModal({ message }))
})

type Options = Omit<ModalProps<Message>, "model" | "toParentMessage" | "children">

const form = (h: HtmlBuilder<Message>, ui: Ui) => [
  ui.Text(h, { mb: "sm", children: ["Sign in to continue."] }),
  h.label([h.Style({ display: "block", marginBottom: "12px" })], ["Email ", h.input([h.AriaLabel("Email")])]),
  ui.Button(h, { children: ["Submit"] })
]

const modalStory = (options: Options, opened = false, centered = false) =>
  app<Model, Message>(
    {
      Model,
      init: () => ({ modal: Modal.init({ id: "auth", opened }), events: [] }),
      update: (model, message) =>
        Message.match(message, {
          GotModal: ({ message: inner }) => settle(model, Modal.update(model.modal, inner)),
          PressedOpen: () => settle(model, Modal.open(model.modal))
        }),
      view: (model, h, ui) => [
        ui.Button(h, { variant: "default", onClick: Message.PressedOpen(), children: ["Open modal"] }),
        ui.Modal(h, {
          model: model.modal,
          toParentMessage: (message) => Message.GotModal({ message }),
          ...options,
          attributes: { overlay: { "data-backdrop": "" }, ...options.attributes },
          children: form(h, ui)
        }),
        eventsView(h, model.events)
      ]
    },
    undefined,
    "document",
    centered
  )

const dialog = (name = "Authentication") => within(document.body).findByRole("dialog", { name })

const box = (element: Element | null | undefined) => present(element?.getBoundingClientRect())

export const Usage: StoryObj = {
  render: demoApp(UsageDemo, { centered: true }),
  play: async ({ canvasElement }) => {
    const opener = await within(canvasElement).findByRole("button", { name: "Open modal" })
    await expect(getComputedStyle(opener).backgroundColor).toBe("rgb(255, 255, 255)")
    await expect(within(document.body).queryByRole("dialog")).toBeNull()
  }
}

export const Opened: StoryObj = {
  render: demoApp(OpenedDemo),
  play: async () => {
    const content = await dialog()
    await expect(content).toHaveAttribute("aria-modal", "true")
    await expect(within(content).getByRole("button", { name: "Close" })).toBeVisible()
    await expect(box(content).width).toBe(440)
    await expect(content).toHaveAccessibleDescription(/Sign in to continue/)
    await expect(getComputedStyle(document.body).overflow).toBe("hidden")
  }
}

export const Clicking: StoryObj = {
  render: modalStory({ title: "Authentication", transitionProps: { duration: 50 } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const opener = await canvas.findByRole("button", { name: "Open modal" })
    await userEvent.click(opener)
    const content = await dialog()
    await waitFor(() => expect(content.contains(document.activeElement)).toBe(true))
    await waitFor(() => expect(canvas.getByRole("status", { name: "Events" })).toHaveTextContent("EnteredTransition"))
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await expect(document.activeElement).toBe(opener)
    await expect(getComputedStyle(document.body).overflow).not.toBe("hidden")
    await userEvent.click(opener)
    await dialog()
    await userEvent.click(present(document.querySelector("[data-backdrop]")))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await userEvent.click(opener)
    await userEvent.click(within(await dialog()).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    const logged = (canvas.getByRole("status", { name: "Events" }).textContent ?? "").split(", ")
    await expect(logged.filter((event) => event === "Opened")).toHaveLength(3)
    await expect(logged.filter((event) => event === "Closed")).toHaveLength(3)
    await expect(logged.filter((event) => event === "ExitedTransition")).toHaveLength(3)
  }
}

export const Centered: StoryObj = {
  render: demoApp(CenteredDemo),
  play: async () => {
    const content = await dialog("Centered")
    const middle = box(content).top + box(content).height / 2
    await expect(middle).toBeCloseTo(window.innerHeight / 2, 0)
    await expect(box(content).width).toBe(620)
    await expect(getComputedStyle(content).borderTopLeftRadius).toBe("32px")
    await expect(
      getComputedStyle(present(within(content).getByText("Sign in to continue.").parentElement)).paddingLeft
    ).toBe("32px")
  }
}

export const FullScreen: StoryObj = {
  render: modalStory(
    { title: "Full screen", fullScreen: true, transitionProps: { transition: "fade", duration: 0 } },
    true
  ),
  play: async () => {
    const content = await dialog("Full screen")
    await expect(box(content).width).toBe(window.innerWidth)
    await expect(box(content).height).toBe(window.innerHeight)
    await expect(content.closest("[data-full-screen]")).not.toBeNull()
    await expect(getComputedStyle(content).borderTopLeftRadius).toBe("0px")
  }
}

export const Options: StoryObj = {
  render: modalStory(
    {
      size: 300,
      xOffset: 10,
      yOffset: "40px",
      zIndex: 500,
      withCloseButton: false,
      withinPortal: false,
      lockScroll: false,
      closeOnEscape: false,
      closeOnClickOutside: false,
      trapFocus: false,
      returnFocus: false,
      overlayProps: { backgroundOpacity: 0.3, blur: 2, styles: { root: setStyle(["outlineStyle", "dotted"]) } },
      styles: { overlay: setStyle(["outlineWidth", "3px"]) },
      closeButtonProps: { size: "lg" }
    },
    true
  ),
  play: async ({ canvasElement }) => {
    const content = await within(canvasElement).findByRole("dialog")
    await expect(box(content).width).toBe(300)
    await expect(box(content).top).toBe(40)
    await expect(within(content).queryByRole("button", { name: "Close" })).toBeNull()
    await expect(getComputedStyle(present(content.lastElementChild)).paddingTop).toBe("16px")
    await waitFor(() => expect(getComputedStyle(document.body).overflow).not.toBe("hidden"))
    await userEvent.keyboard("{Escape}")
    await userEvent.click(present(canvasElement.querySelector("[data-backdrop]")))
    await expect(within(canvasElement).getByRole("dialog")).toBeVisible()
    const backdrop = getComputedStyle(present(canvasElement.querySelector("[data-backdrop]")))
    await expect(backdrop.backdropFilter).toBe("blur(2px)")
    await expect(backdrop.outlineStyle).toBe("dotted")
    await expect(backdrop.outlineWidth).toBe("3px")
  }
}

export const KeptMounted: StoryObj = {
  render: modalStory({ title: "Kept", keepMounted: true, withOverlay: false, size: "15rem" }),
  play: async ({ canvasElement }) => {
    const hidden = await within(document.body).findByRole("dialog", { hidden: true })
    await expect(hidden).toHaveTextContent("Kept")
    await expect(getComputedStyle(hidden).display).toBe("none")
    await expect(document.querySelector("[data-backdrop]")).toBeNull()
    await userEvent.keyboard("{Escape}")
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Open modal" }))
    await waitFor(() => expect(getComputedStyle(hidden).display).not.toBe("none"))
    await expect(box(hidden).width).toBe(240)
  }
}

const Pair = Schema.Struct({ first: Modal.Model, second: Modal.Model })
type Pair = typeof Pair.Type

const PairMessage = defineMessageUnion({
  GotFirst: { message: Modal.Message },
  GotSecond: { message: Modal.Message },
  PressedOpenBoth: {}
})
type PairMessage = typeof PairMessage.Type

const openBoth = (pair: Pair) => {
  const first = Modal.open(pair.first)
  const second = Modal.open(pair.second)

  return {
    model: { first: first.model, second: second.model },
    commands: [
      ...liftedCommands(first, (message) => PairMessage.GotFirst({ message })),
      ...liftedCommands(second, (message) => PairMessage.GotSecond({ message }))
    ]
  }
}

export const ScrollbarGap: StoryObj = {
  render: app<Pair, PairMessage>({
    Model: Pair,
    init: () => ({ first: Modal.init({ id: "first" }), second: Modal.init({ id: "second" }) }),
    update: (pair, message) =>
      PairMessage.match(message, {
        GotFirst: ({ message: inner }) => {
          const result = Modal.update(pair.first, inner)

          return {
            model: { ...pair, first: result.model },
            commands: liftedCommands(result, (wrapped) => PairMessage.GotFirst({ message: wrapped }))
          }
        },
        GotSecond: ({ message: inner }) => {
          const result = Modal.update(pair.second, inner)

          return {
            model: { ...pair, second: result.model },
            commands: liftedCommands(result, (wrapped) => PairMessage.GotSecond({ message: wrapped }))
          }
        },
        PressedOpenBoth: () => openBoth(pair)
      }),
    view: (pair, h, ui) => [
      ui.Title(h, { order: 3, children: ["A long page"] }),
      ui.Button(h, { onClick: PairMessage.PressedOpenBoth(), children: ["Open both"] }),
      h.div([h.Style({ height: "3000px" })], []),
      ui.Modal(h, {
        model: pair.first,
        toParentMessage: (message) => PairMessage.GotFirst({ message }),
        title: "First",
        transitionProps: { duration: 0 },
        children: ["First modal"]
      }),
      ui.Modal(h, {
        model: pair.second,
        toParentMessage: (message) => PairMessage.GotSecond({ message }),
        title: "Second",
        transitionProps: { duration: 0 },
        children: [
          h.label([], ["Search ", h.input([h.AriaLabel("Search"), h.Attribute("data-sth-stop-propagation", "true")])])
        ]
      })
    ]
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const heading = await canvas.findByRole("heading", { name: "A long page" })
    const before = box(heading)
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const edge = Number.parseFloat(getComputedStyle(document.body).marginRight) + scrollbar
    await userEvent.click(canvas.getByRole("button", { name: "Open both" }))
    const second = await dialog("Second")
    await dialog("First")
    await waitFor(() => expect(document.querySelectorAll("[data-opened][data-lock-scroll]")).toHaveLength(2))
    await waitFor(() => expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull())
    await expect(getComputedStyle(document.body).overflow).toBe("hidden")
    await expect(getComputedStyle(document.body).marginRight).toBe(`${edge}px`)
    await expect(box(heading).width).toBe(before.width)
    within(second).getByRole("textbox", { name: "Search" }).focus()
    await expect(within(second).getByRole("textbox", { name: "Search" })).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", isComposing: true }))
    await expect(within(document.body).getAllByRole("dialog")).toHaveLength(2)
    await userEvent.click(within(second).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog", { name: "Second" })).toBeNull())
    await expect(getComputedStyle(document.body).overflow).toBe("hidden")
    await expect(box(heading).width).toBe(before.width)
    await userEvent.click(within(await dialog("First")).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await expect(getComputedStyle(document.body).overflow).not.toBe("hidden")
    await expect(box(heading).width).toBe(before.width)
    await userEvent.click(canvas.getByRole("button", { name: "Open both" }))
    await dialog("Second")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
  }
}

const Changing = Schema.Struct({ modal: Modal.Model, relaxed: Schema.Boolean })
type Changing = typeof Changing.Type

const ChangingMessage = defineMessageUnion({ GotModal: { message: Modal.Message }, PressedRelax: {} })
type ChangingMessage = typeof ChangingMessage.Type

export const ChangingWhileOpen: StoryObj = {
  render: app<Changing, ChangingMessage>({
    Model: Changing,
    init: () => ({ modal: Modal.init({ id: "changing", opened: true }), relaxed: false }),
    update: (model, message) =>
      ChangingMessage.match(message, {
        GotModal: ({ message: inner }) => {
          const result = Modal.update(model.modal, inner)

          return {
            model: { ...model, modal: result.model },
            commands: liftedCommands(result, (wrapped) => ChangingMessage.GotModal({ message: wrapped }))
          }
        },
        PressedRelax: () => ({ model: { ...model, relaxed: true } })
      }),
    view: (model, h, ui) => [
      ui.Modal(h, {
        model: model.modal,
        toParentMessage: (message) => ChangingMessage.GotModal({ message }),
        title: "Changing",
        lockScroll: !model.relaxed,
        closeOnEscape: !model.relaxed,
        children: [ui.Button(h, { onClick: ChangingMessage.PressedRelax(), children: ["Let the page scroll"] })]
      })
    ]
  }),
  play: async () => {
    const content = await dialog("Changing")
    await waitFor(() => expect(getComputedStyle(document.body).overflow).toBe("hidden"))
    await userEvent.click(within(content).getByRole("button", { name: "Let the page scroll" }))
    await waitFor(() => expect(getComputedStyle(document.body).overflow).not.toBe("hidden"))
    await userEvent.keyboard("{Escape}")
    await expect(within(document.body).getByRole("dialog", { name: "Changing" })).toBeVisible()
  }
}

export const ClosingUsageDemo: StoryObj = {
  render: demoApp(UsageDemo),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Open modal" }))
    const shown = await within(document.body).findByRole("dialog", { name: "Authentication" })
    await userEvent.click(within(shown).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await expect(canvasElement).toBeInTheDocument()
  }
}

export const ClosingOpenedDemo: StoryObj = {
  render: demoApp(OpenedDemo),
  play: async ({ canvasElement }) => {
    const shown = await within(document.body).findByRole("dialog", { name: "Authentication" })
    await userEvent.click(within(shown).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Open modal" }))
    await waitFor(() => expect(within(document.body).getByRole("dialog", { name: "Authentication" })).toBeVisible())
  }
}

export const ClosingCenteredDemo: StoryObj = {
  render: demoApp(CenteredDemo),
  play: async ({ canvasElement }) => {
    const shown = await within(document.body).findByRole("dialog", { name: "Centered" })
    await userEvent.click(within(shown).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull())
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Open modal" }))
    await waitFor(() => expect(within(document.body).getByRole("dialog", { name: "Centered" })).toBeVisible())
  }
}

const page = within(document.body)

export const Compound: StoryObj = {
  render: demoApp(CompoundDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Open modal" })).toBeVisible()
    await expect(page.queryByRole("dialog")).toBeNull()
  }
}

export const OpeningCompound: StoryObj = {
  render: demoApp(CompoundDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await user.click(await within(canvasElement).findByRole("button", { name: "Open modal" }))
    const compound = await page.findByRole("dialog", { name: "Modal title" })
    await expect(compound).toHaveAccessibleDescription("Modal content")
    await expect(getComputedStyle(present(page.getByText("Modal content"))).paddingTop).toBe("0px")
    await user.click(within(compound).getByRole("button", { name: "Close" }))
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull())
  }
}

export const Stack: StoryObj = {
  render: demoApp(StackDemo),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("button", { name: "Open modal" })).toBeVisible()
    await expect(page.queryByRole("dialog")).toBeNull()
  }
}

const zOf = (modal: HTMLElement) => Number(getComputedStyle(present(modal.parentElement?.parentElement)).zIndex)

export const Stacking: StoryObj = {
  render: demoApp(StackDemo),
  play: async ({ canvasElement }) => {
    const user = userEvent.setup()
    await user.click(await within(canvasElement).findByRole("button", { name: "Open modal" }))
    const first = await page.findByRole("dialog", { name: "Delete this page?" })
    await user.click(within(first).getByRole("button", { name: "Delete" }))
    const second = await page.findByRole("dialog", { name: "Confirm action" })
    await waitFor(() => expect(first).toHaveAttribute("data-hidden"))
    await expect(getComputedStyle(first).opacity).toBe("0")
    await expect(zOf(second)).toBeGreaterThan(zOf(first))
    await waitFor(() => expect(second.contains(document.activeElement)).toBe(true))
    await user.keyboard("{Escape}")
    await waitFor(() => expect(page.queryByRole("dialog", { name: "Confirm action" })).toBeNull())
    await waitFor(() => expect(first).not.toHaveAttribute("data-hidden"))
    await user.click(within(first).getByRole("button", { name: "Delete" }))
    const again = await page.findByRole("dialog", { name: "Confirm action" })
    await user.click(within(again).getByRole("button", { name: "Confirm" }))
    const last = await page.findByRole("dialog", { name: "Really confirm action" })
    await waitFor(() => expect(again).toHaveAttribute("data-hidden"))
    await user.click(within(last).getByRole("button", { name: "Confirm" }))
    await waitFor(() => expect(page.queryAllByRole("dialog")).toHaveLength(0))
    await user.click(within(canvasElement).getByRole("button", { name: "Open modal" }))
    await user.click(
      within(await page.findByRole("dialog", { name: "Delete this page?" })).getByRole("button", { name: "Cancel" })
    )
    await waitFor(() => expect(page.queryAllByRole("dialog")).toHaveLength(0))
  }
}

export const CloseButtonOnly: StoryObj = {
  render: modalStory({}, true),
  play: async () => {
    const content = await page.findByRole("dialog")
    await expect(within(content).getByRole("button", { name: "Close" })).toBeVisible()
    await expect(content).not.toHaveAttribute("aria-labelledby")
    await expect(getComputedStyle(present(content.lastElementChild)).paddingTop).toBe("0px")
  }
}

export const TitleOnly: StoryObj = {
  render: modalStory({ title: "Title only", withCloseButton: false }, true),
  play: async () => {
    const content = await page.findByRole("dialog", { name: "Title only" })
    await expect(within(content).queryByRole("button", { name: "Close" })).toBeNull()
  }
}
