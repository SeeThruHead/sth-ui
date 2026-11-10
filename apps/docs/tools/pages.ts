import { BunRuntime, BunServices } from "@effect/platform-bun"
import { Effect, FileSystem, Path, Schema } from "effect"

const prettyJson = Schema.fromJsonString(Schema.Unknown, { space: 2 })

const Component = Schema.Struct({ category: Schema.String, title: Schema.String, description: Schema.String })

const Components = Schema.fromJsonString(Schema.Array(Component))

const Ticket = Schema.Struct({ id: Schema.String, title: Schema.String, status: Schema.String })

const categories = [
  "Layout",
  "Inputs",
  "Combobox",
  "Buttons",
  "Navigation",
  "Feedback",
  "Overlays",
  "Data display",
  "Typography",
  "Miscellaneous"
]

const slug = (text: string): string =>
  text
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase()

const statusOf = (ticket: typeof Ticket.Type | undefined): string => {
  if (ticket === undefined) return "planned"
  if (ticket.status === "closed") return "built"
  if (ticket.status === "in_progress") return "building"

  return "planned"
}

const stub = (component: typeof Component.Type, ticket: typeof Ticket.Type | undefined): string =>
  [
    "---",
    `title: ${component.title}`,
    `description: ${JSON.stringify(`${component.description}.`)}`,
    `status: ${statusOf(ticket)}`,
    `ticket: ${ticket?.id ?? "none"}`,
    "hide_title: true",
    "generated: true",
    "---",
    "",
    "Not implemented yet. This page fills in with live examples, props and theming once the component is built.",
    ""
  ].join("\n")

const field = (text: string, name: string): string => new RegExp(`^${name}: (.*)$`, "m").exec(text)?.[1]?.trim() ?? ""

const ticketOf = (text: string): typeof Ticket.Type => ({
  id: field(text, "id"),
  status: field(text, "status"),
  title: /^# (.*)$/m.exec(text)?.[1]?.trim() ?? ""
})

const tickets = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const folder = path.join(import.meta.dirname, "../../../.tickets")
  const names = yield* fs.readDirectory(folder).pipe(Effect.orElseSucceed((): ReadonlyArray<string> => []))

  return yield* Effect.forEach(
    names.filter((name) => name.endsWith(".md")),
    (name) => fs.readFileString(path.join(folder, name)).pipe(Effect.map(ticketOf))
  )
})

const writeCategory = Effect.fn("pages.writeCategory")(function* (docs: string, category: string, index: number) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const folder = path.join(docs, slug(category))
  yield* fs.makeDirectory(folder, { recursive: true })
  const json = yield* Schema.encodeEffect(prettyJson)({ label: category, position: index + 10 })
  yield* fs.writeFileString(path.join(folder, "_category_.json"), `${json}\n`)
})

const writePage = Effect.fn("pages.writePage")(function* (
  docs: string,
  component: typeof Component.Type,
  ticket: typeof Ticket.Type | undefined
) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const file = path.join(docs, slug(component.category), `${slug(component.title)}.mdx`)
  const exists = yield* fs.exists(file)
  const current = exists ? yield* fs.readFileString(file) : "generated: true"
  if (!current.includes("generated: true")) return false
  yield* fs.writeFileString(file, stub(component, ticket))

  return true
})

const program = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const here = import.meta.dirname
  const listed = yield* fs.readFileString(path.join(here, "../data/components.json"))
  const components = yield* Schema.decodeEffect(Components)(listed)
  const known = new Map((yield* tickets).map((ticket) => [ticket.title, ticket]))
  const docs = path.join(here, "../docs")

  yield* Effect.forEach(categories, (category, index) => writeCategory(docs, category, index))
  const written = yield* Effect.forEach(components, (component) =>
    writePage(docs, component, known.get(component.title))
  )

  yield* Effect.logInfo(`${written.filter((wrote) => wrote).length} status pages written`)
})

program.pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
