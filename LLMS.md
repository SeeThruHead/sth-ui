# sth-ui documentation for language models

sth-ui is Mantine (9.7.4), ported to [Foldkit](https://foldkit.dev) and Effect v4 and styled with StyleX. The
components take Mantine's prop names and defaults and name their parts the way Mantine does, but the way you use
them is Foldkit's: views are functions, state lives in the app's Model, and events are Messages.

When you need to know how to use sth-ui, read this guide, then the demos and source it links to. Do not copy
Mantine's React examples as they are: the props carry over, the React parts (JSX, hooks, callbacks, `useState`)
do not. The translation table below says what each becomes.

## Where the files are

Paths in this guide are written as package paths, such as `@sth-ui/core/src/components/Button/demos/usage.ts`.

- In an app that installed sth-ui, that is `node_modules/@sth-ui/core/src/components/Button/demos/usage.ts`.
- In the sth-ui repository, it is `packages/core/src/components/Button/demos/usage.ts`.

Import paths leave out `src/`: the file `@sth-ui/core/src/components/Menu/Menu.ts` is imported as
`@sth-ui/core/components/Menu/Menu.ts`, and `@sth-ui/core/src/Ui.ts` as `@sth-ui/core/Ui.ts`.

Every component has the same layout, so you can find anything without a list:

| What                                               | Where                                                    |
| -------------------------------------------------- | -------------------------------------------------------- |
| The component, its props type and its named parts  | `@sth-ui/core/src/components/<Name>/<Name>.ts`           |
| Its state, for a component that has state          | `<Name>.ts`, or `model.ts` next to it                    |
| Working examples, each a small typed Foldkit app   | `@sth-ui/core/src/components/<Name>/demos/*.ts`          |
| Every component, as it is bound to `ui`            | `@sth-ui/core/src/Ui.ts` (`createUi`)                    |
| Theme tokens                                       | `@sth-ui/core/src/theme/tokens.stylex.ts`, `palette.stylex.ts` |

The demos are type-checked and tested in a browser on every change, so they are the most reliable examples there
are. Start from the `usage.ts` demo of the component you need, then look at the others in the same folder for
the option you want. Inputs share one folder: `@sth-ui/core/src/components/Input/demos/<input-name>/`.

The other packages follow the same layout under their own `src/`: `@sth-ui/dates/src/<Name>/demos/`,
`@sth-ui/charts/src/<Name>/demos/`, `@sth-ui/schedule/src/<Name>/demos/`, `@sth-ui/data-table/src/DataTable/demos/`,
`@sth-ui/tiptap/src/RichTextEditor/demos/`,
`@sth-ui/code-highlight/src/<Name>/demos/`, `@sth-ui/hooks/src/<useName>/demos/` and `@sth-ui/form/src/demos/`.

## Translating Mantine to sth-ui

| Mantine (React)                                   | sth-ui (Foldkit)                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `<Button variant="light">Save</Button>`           | `ui.Button(h, { variant: "light", children: ["Save"] })`                               |
| `onClick={() => save()}`                          | `onClick: Message.ClickedSave()`, a Message, handled in `update`                       |
| `onChange={(event) => setValue(...)}`             | `value: model.value, onInput: (value) => Message.ChangedValue({ value })`              |
| `useState`, `useDisclosure`                       | a field in the app's Model and a Message that changes it                               |
| A component with its own state (Menu, Select...)  | its `Model`, `Message`, `init` and `update` in your Model, and `toParentMessage`        |
| `onChange` of a stateful component                | an out message returned from its `update` (`outMessage` or `outMessages`)              |
| `<Modal.Title>`, `<AppShell.Navbar>` (compounds)  | props of the parent (`title`), or helper functions (`appShellNavbar({ children })`)    |
| `classNames`, `vars`, `className`                 | `styles: { part: stylexStyle }` and `attributes: { part: { ... } }`                    |
| `createTheme({ primaryColor, components })`       | `ThemeProvider`'s `primaryColor` and `themes`, and `createUi({ components })`          |
| `--mantine-*` CSS variables                       | StyleX variable groups, overridden with `stylex.createTheme`                           |
| `@mantine/hooks`                                  | `@sth-ui/hooks`: Subscriptions, Mounts, Commands and pure functions                    |
| `@mantine/form`'s `useForm`                       | `@sth-ui/form`: a form Model with `Form.update` and Schema or Mantine-style validators  |
| `@mantine/dates` with `Date` values               | `@sth-ui/dates` with `YYYY-MM-DD` strings                                              |
| `rem(12)`, `em(...)`                              | plain values: `12`, `"0.75rem"`                                                        |

Each component's docs page ends with "Differences from Mantine", listing what was left out or changed. Check
there before assuming a Mantine prop exists.

## Setting up an app

1. Install the one package, `bun add @seethruhead/sth-ui`, from npm. Each part is a folder of it: the paths in
   this guide (`@sth-ui/core/...`, `@sth-ui/dates/...`) are imports from those folders.
2. Compile it with StyleX like the app's own code (`@stylexjs/unplugin` in Vite). Keep StyleX's media query
   ordering on (the default; never `enableMediaQueryOrder: false`): the responsive rules rely on it. Build with
   Bun 1.4.3 or later (Node is fine too): under Bun 1.4.2 StyleX rejects those rules as "Invalid media query syntax".
3. sth-ui ships its source with `stylex.create` calls in it, so Vite must not pre-bundle it: keep
   `@seethruhead/sth-ui` in `optimizeDeps.exclude` (`@stylexjs/unplugin` adds it on its own; keep it there if you
   set `exclude` yourself). Then pre-bundle the Foldkit modules it imports, or Foldkit loads twice and fails with
   "html element constructors must be called inside a runtime-driven render": put `foldkit`, `foldkit/html`,
   `foldkit/command`, `foldkit/message`, `foldkit/mount`, `foldkit/schema`, `foldkit/submodel`,
   `foldkit/subscription` and every `@foldkit/ui/*` module the components you use import (`popover`, `checkbox`,
   `menu`, `anchor`, `animation`, ...) in `optimizeDeps.include`, and `foldkit/scene` too if Storybook or a browser
   test runs scenes. Vite's console names a module it had to optimise late; add it to the list.
4. Import at least one stylesheet of the app's own. A production build appends StyleX's CSS to it; without one
   every component renders unstyled.
5. Target current browsers in `browserslist`, so `light-dark()` reaches the browser as written.
6. Build the components once with `createUi`, and wrap the app's view in `ThemeProvider`.

```ts
import type { Html, HtmlBuilder } from "foldkit/html"
import { createUi } from "@sth-ui/core/Ui.ts"

export const ui = createUi({ components: { Button: { defaultProps: { radius: "xl" } } } })

export const view = (model: Model, h: HtmlBuilder<Message>): Html =>
  ui.ThemeProvider(h, {
    primaryColor: "grape",
    colorScheme: "auto",
    children: [ui.Button(h, { onClick: Message.ClickedSave(), children: ["Save"] })]
  })
```

Pass `ui` (type `Ui` from `@sth-ui/core/Ui.ts`) to the views that need it, as every demo does. The other packages
are built the same way: `createDates`, `createCharts`, `createSchedule`, `createTiptap` and `createHighlight`, or
the ready-made `dates`, `charts`, `schedule`, `tiptap` and `highlight` built with no configuration.

`createUi` binds every component, so an app that calls it ships the whole kit. To ship only what it uses, an app
builds its own `ui` from each component's factory, which takes the same configuration:

```ts
import type { Components } from "@sth-ui/core/Ui.ts"
import { Button } from "@sth-ui/core/components/Button/Button.ts"
import { Badge } from "@sth-ui/core/components/Badge/Badge.ts"
import { ThemeProvider } from "@sth-ui/core/components/ThemeProvider/ThemeProvider.ts"

const components: Components = { Button: { defaultProps: { radius: "xl" } } }

export const ui = { ThemeProvider, Button: Button(components), Badge: Badge(components) }

export type Ui = typeof ui
```

## Components without state

Most components are a function of their props. Every one is called as `ui.Name(h, props)` and returns `Html`.
`children` is always an array, and it can mix components, strings and Foldkit's own `h.*` elements.

```ts
ui.Stack(h, {
  gap: "sm",
  children: [
    ui.Title(h, { order: 3, children: ["Profile"] }),
    ui.Text(h, { c: "dimmed", size: "sm", children: [model.email] }),
    ui.Group(h, {
      justify: "flex-end",
      children: [
        ui.Button(h, { variant: "default", onClick: Message.ClickedCancel(), children: ["Cancel"] }),
        ui.Button(h, { onClick: Message.ClickedSave(), loading: model.saving, children: ["Save"] })
      ]
    })
  ]
})
```

Leave an optional prop out instead of passing `undefined`. A conditional spread on one line keeps that readable:
`...(model.error === "" ? {} : { error: model.error })`.

- Button: `@sth-ui/core/src/components/Button/demos/usage.ts` and the rest of `Button/demos/`.
- Layout: `Stack`, `Group`, `Flex`, `Grid`, `SimpleGrid`, `Container`, `Center`, `Box`, `Paper`, `Card`.

## Inputs

Inputs are controlled: the value lives in the Model, and the input sends a Message with the new value. Text-like
inputs take `onInput`; checkboxes, switches and the like take `onChange`. Look at the component's props type for
the exact name.

```ts
export const Message = defineMessageUnion({ ChangedName: { value: Schema.String } })

ui.TextInput(h, {
  id: "profile-name",
  label: "Name",
  value: model.name,
  onInput: (value) => Message.ChangedName({ value }),
  ...(model.nameError === "" ? {} : { error: model.nameError })
})
```

Examples: `@sth-ui/core/src/components/Input/demos/clear-button.ts` (a controlled input with a clear button),
`@sth-ui/core/src/components/Input/demos/text-input/usage.ts`, and the other folders under `Input/demos/`. For a
form with validation, use `@sth-ui/form` (below) instead of wiring each field by hand.

## Components with state

Foldkit has no component state, so a component that remembers something (Menu, Popover, Select, Combobox,
Modal, Drawer, Tabs, Slider, Tooltip, Notifications, Tree...) gives you the pieces of an Elm submodel, and your
app holds them:

- `Model`, the Schema of its state, which goes into your Model.
- `init({ id, ... })`, its first state. Every instance needs its own `id`.
- `Message`, which your app wraps in one of its own Messages (`GotMenu: { message: Menu.Message }`).
- `update(model, message, ...)`, which returns its next `model`, the `commands` to run, and out messages that
  stand for Mantine's callbacks (`outMessage` for one, `outMessages` for several).
- The view takes `model` and `toParentMessage`, which wraps its Messages into yours.
- Some also have `subscriptions` (Slider, Splitter, ColorInput, ScrollArea...), which you lift into your own.

Read the component's `update` to see what it returns: some take a third argument (a context or the items), and
for some `commands` is optional, so map over `result.commands ?? []`.

```ts
import * as Command from "foldkit/command"
import * as Select from "@sth-ui/core/components/Select/Select.ts"

export const Model = Schema.Struct({ library: Select.Model, chosen: Schema.NullOr(Schema.String) })

export const Message = defineMessageUnion({ GotLibrary: { message: Select.Message } })

export const init = (): Model => ({ library: Select.init({ id: "library" }), chosen: null })

export const update = (model: Model, message: Message) =>
  Message.match(message, {
    GotLibrary: ({ message: inner }) => {
      const result = Select.update(model.library, inner)

      return {
        model: {
          ...model,
          library: result.model,
          chosen: result.outMessage === undefined ? model.chosen : result.outMessage.value
        },
        commands: result.commands.map((command) =>
          Command.mapMessage(command, (lifted) => Message.GotLibrary({ message: lifted }))
        )
      }
    }
  })

ui.Select(h, {
  model: model.library,
  value: model.chosen,
  toParentMessage: (message) => Message.GotLibrary({ message }),
  label: "Your favorite library",
  data: ["React", "Angular", "Vue", "Svelte"]
})
```

Opening something from your own code goes through the component's functions, which return the same result as
`update`: `Modal.open(model.modal)`.

- Select, `@sth-ui/core/src/components/Select/demos/usage.ts`: out messages.
- Modal, `@sth-ui/core/src/components/Modal/demos/usage.ts`: opening a modal from a button.
- Menu, `@sth-ui/core/src/components/Menu/demos/hover.ts`: two menus in one Model. For checkbox, radio, search
  and submenu items, see the other demos in `Menu/demos/`; their `update` also takes the items.
- Slider, `@sth-ui/core/src/components/Slider/demos/usage.ts`: lifting a component's subscriptions with
  `Subscription.lift(Slider.subscriptions)`.
- Notifications, `@sth-ui/core/src/components/Notifications/demos/usage.ts`: showing and updating notifications
  with `Notifications.show` and `Notifications.updateNotification`.

## Layout of an application

`AppShell` places a header, navbar, aside, footer and main area. Its sections are helper functions
(`appShellHeader`, `appShellNavbar`, `appShellAside`, `appShellFooter`, `appShellMain`, `appShellSection`) from
`@sth-ui/core/components/AppShell/AppShell.ts`. Whether the navbar is open on a phone is a boolean in your Model,
toggled by a `Burger`.

- AppShell, `@sth-ui/core/src/components/AppShell/demos/usage.ts`: header, navbar with sections, burger and
  `NavLink`s.
- `AppShell/demos/resize.ts`: a navbar the person can resize.

## Style props

Every component takes Mantine's style props on its root: `m`, `mt`, `p`, `px`, `w`, `maw`, `h`, `c`, `bg`, `bd`,
`bdrs`, `ff`, `fz`, `fw`, `lh`, `ta`, `tt`, `pos`, `display`, `flex` and the rest. Theme sizes (`m: "md"`),
negative spacing (`mt: "-sm"`), palette colours (`c: "grape"`, `bg: "grape.1"`) and plain CSS values all work.
To hide something by breakpoint, wrap it in `ui.Box(h, { hiddenFrom: "sm", children })` or `visibleFrom`.

An object changes a value by breakpoint: `p: { base: "xs", sm: "xl" }`. `bd` and `bg` take plain values only.

## Styling parts: the Styles API

Every component names its parts as Mantine does, and takes StyleX styles for each in `styles`. They are applied
last, so they win over the component's own and the theme's. `attributes` puts attributes on a part, and `unstyled`
drops the component's own styles.

```ts
import * as stylex from "@stylexjs/stylex"

const parts = stylex.create({
  root: { borderStyle: "dashed" },
  label: { letterSpacing: "0.08em" }
})

ui.Button(h, {
  styles: { root: parts.root, label: parts.label },
  attributes: { root: { "data-testid": "save" } },
  children: ["Save"]
})
```

The part names are in the component's file (a `type <Name>Part` or its `parts` list). StyleX rules apply:
`stylex.create` at module level, longhand properties only (`borderStyle`, not `border`), and no runtime functions
inside `stylex.create`.

## Themes

Mantine's theme object becomes StyleX variable groups in `@sth-ui/core/theme/tokens.stylex.ts`: `colors`,
`accent`, `space`, `radius`, `fontSize`, `lineHeight`, `fontWeight`, `shadow`, `font`, `heading`, `zIndex`, plus
`palette` (Mantine's 14 colours, 10 shades each) in `palette.stylex.ts`. A theme overrides some of them:

```ts
import * as stylex from "@stylexjs/stylex"
import { font, radius } from "@sth-ui/core/theme/tokens.stylex.ts"

export const round = stylex.createTheme(radius, { default: "2rem" })
export const serif = stylex.createTheme(font, { body: "Georgia, serif" })

ui.ThemeProvider(h, { themes: [round, serif], primaryColor: "teal", colorScheme: "dark", children })
```

- `primaryColor` on `ThemeProvider` and `color` on a component take a palette name, a shade (`"violet.2"`) or any
  CSS colour.
- `colorScheme` is `"light"`, `"dark"` or `"auto"` (follow the device). Every colour is one
  `light-dark(light, dark)` value, so there is no second theme to write for dark mode.
- The app's provider themes the whole page (it puts its classes on `<html>`), so content a Portal moves to `body`,
  such as a Modal, stays themed. A provider inside another themes only its own part of the page: give it
  `scope: "element"`.
- Defaults that are not style go in `createUi({ components: { Name: { defaultProps, styles } } })`.

## Forms

`@sth-ui/form` holds the whole form as one Model: values, errors, touched and dirty fields. Validation is a
context passed to `Form.update`, with Mantine's validators (`isNotEmpty`, `isEmail`, `hasLength`, `isInRange`,
`matches`...) or an Effect Schema. Helpers spread the right props onto each input.

```ts
import * as Form from "@sth-ui/form/form.ts"
import { textInputProps } from "@sth-ui/form/inputs.ts"
import { isEmail } from "@sth-ui/form/validators.ts"

export const context: Form.FormContext = { validate: { email: isEmail("Invalid email") } }

const send = (message: Form.Message) => Message.GotForm({ message })

h.form(
  [h.OnSubmit(send(Form.submit()))],
  [ui.TextInput(h, { id: "email", label: "Email", ...textInputProps(model.form, "email", send) })]
)
```

`Form.update` returns `outMessages` with `SubmitSucceeded` (and the values) or `SubmitFailed` (and the errors).

- A sign-up form, `@sth-ui/form/src/demos/usage.ts`: validators, submit and reset.
- Lists of fields, `@sth-ui/form/src/demos/lists.ts`: adding and removing rows.
- One field on its own, `@sth-ui/form/src/demos/field.ts`.

## Hooks

`@sth-ui/hooks` ports the Mantine hooks that still make sense under the Elm architecture, as what Foldkit uses
instead of hooks:

- Subscriptions for things that happen over time (`hotkeys`, media queries, window size, idle, network, scroll).
- Mounts for things tied to an element (`hotkeyHandler`, click outside, element size, intersection).
- Pure modules for state logic (`usePagination`, `useListState`, `useQueue`, `useRovingIndex`).

Each hook has a demo at `@sth-ui/hooks/src/<useName>/demos/usage.ts`; the shared functions are imported from
`@sth-ui/hooks/browser.ts` and `@sth-ui/hooks/mounts.ts`.

- useHotkeys, `@sth-ui/hooks/src/useHotkeys/demos/usage.ts`: a page-wide hotkey as a Subscription and a hotkey
  on one element as a Mount.

## Icons

`@sth-ui/icons` has Phosphor's icons as Foldkit views, one module each:

```ts
import { GearSixIcon } from "@sth-ui/icons/icons/GearSixIcon.ts"

ui.Button(h, { leftSection: GearSixIcon(h, { size: 14 }), children: ["Settings"] })
```

## The other packages

- `@sth-ui/dates`: calendars, pickers and date inputs. Values are `YYYY-MM-DD` strings, never `Date`. Pass
  `today` so the calendar does not read the clock. See
  DatePickerInput, `@sth-ui/dates/src/DatePickerInput/demos/usage.ts` and the other demos.
- `@sth-ui/charts`: Mantine's charts, drawn as SVG. `charts.BarChart(h, { h: 300, data, dataKey, series })`. See
  BarChart, `@sth-ui/charts/src/BarChart/demos/usage.ts`.
- `@sth-ui/schedule`: day, week, month, year and agenda views with events, resources and recurring events. See
  Schedule, `@sth-ui/schedule/src/Schedule/demos/usage.ts`.
- `@sth-ui/data-table`: a table of many rows with sorting, search, column filters (text, options, number and date
  ranges, yes or no), row selection with shift ranges and select-all of the matching rows, a column picker, keyboard
  navigation and windowed rows, as a submodel. Keep `DataTable.init(config, context)` in your model, route its
  Messages through `DataTable.update(model, message, context)` with `context = { rows, columns, rowId, searchText }`,
  and call `DataTable.refresh(model, context)` when your rows change. Render it with `DataTable.dataTable(h, { model,
  toParentMessage, rows, columns, rowId, ariaLabel, height })`. `update` reports `RowActivated`, `SelectionChanged`
  and `SettingsChanged` (sort and hidden columns, to save and pass back to `init`). See DataTable,
  `@sth-ui/data-table/src/DataTable/demos/usage.ts`.
  In `foldkit/scene` tests, `measured(toParentMessage)` and `scrolled(toParentMessage, id)` from
  `@sth-ui/data-table/src/DataTable/testing.ts` resolve the table's measuring Mount and the scroll that sorting,
  searching and filtering ask for, with your own wrapped Message. Scenes need StyleX compiled, so run them in the
  browser (Storybook or browser-mode Vitest), not in Node.
- `@sth-ui/tiptap`: the rich text editor and its toolbar controls. See
  RichTextEditor, `@sth-ui/tiptap/src/RichTextEditor/demos/usage.ts`.
- `@sth-ui/code-highlight`: `CodeHighlight` and `JsonViewer`. See
  CodeHighlight, `@sth-ui/code-highlight/src/CodeHighlight/demos/usage.ts`.

## Rules worth keeping

- Find a component's real props in its `.ts` file; do not guess them from Mantine's React docs.
- Give every stateful component a unique `id` in `init`, and every input an `id` so its label is linked.
- Keep the view a pure function of the Model. Time, randomness and the DOM are reached through Commands,
  Subscriptions and Mounts, never read directly in `view` or `update`.
- Write a new theme as `stylex.createTheme` over a token group, not as global CSS. No component owns global CSS.
