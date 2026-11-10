import { blockAt } from "./source.ts"

type Declaration = { readonly name: string; readonly text: string; readonly story: boolean }

const declarationsOf = (lines: ReadonlyArray<string>): ReadonlyArray<Declaration> =>
  lines.flatMap((line, index) => {
    const found = /^(?:export )?const (\w+)(: StoryObj)?/.exec(line)
    if (found === null) return []

    return [{ name: found[1] ?? "", text: blockAt(lines, index).join("\n"), story: found[2] !== undefined }]
  })

const isSibling = (line: string): boolean => /^ {2}[a-zA-Z]+:/.test(line) || line.startsWith("}")

const renderOf = (story: string): string | undefined => {
  const lines = story.split("\n")
  const start = lines.findIndex((line) => line.startsWith("  render: "))
  if (start === -1) return undefined
  const rest = lines.slice(start + 1)
  const end = rest.findIndex(isSibling)
  const body = [lines[start] ?? "", ...rest.slice(0, end === -1 ? rest.length : end)]

  return body
    .map((line, index) => (index === 0 ? line.replace("  render: ", "") : line.replace(/^ {2}/, "")))
    .join("\n")
    .replace(/,$/, "")
}

const demoOf = (render: string, source: string): string | undefined => {
  const name = /^(?:demo(?:App)?|configure(?:App)?)\((\w+)/.exec(render.trim())?.[1]
  if (name === undefined) return undefined

  return new RegExp(`import \\* as ${name} from "([^"]+)"`).exec(source)?.[1]
}

const sanitize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const startCase = (name: string): string =>
  name
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")

export const storyId = (title: string, name: string): string => `${sanitize(title)}--${sanitize(startCase(name))}`

export type DemoRef = { readonly id: string; readonly specifier: string; readonly configurator: boolean }

export const demosOf = (source: string): ReadonlyArray<DemoRef> => {
  const title = /title: "([^"]+)"/.exec(source)?.[1]
  if (title === undefined) return []

  const declarations = declarationsOf(source.split("\n"))
  const shared = (render: string): string =>
    declarations.find((declaration) => declaration.name === render.trim())?.text.replace(/^const \w+ = /, "") ?? render

  return declarations
    .filter((declaration) => declaration.story)
    .flatMap((story) => {
      const specifier = demoOf(shared(renderOf(story.text) ?? ""), source)

      const render = shared(renderOf(story.text) ?? "")

      return specifier === undefined
        ? []
        : [{ id: storyId(title, story.name), specifier, configurator: render.trim().startsWith("configure") }]
    })
}

export const withPackagePaths = (code: string, packagePath: (specifier: string) => string): string =>
  code.replace(/from "(\.[^"]+)"/g, (_found, specifier: string) => `from "${packagePath(specifier)}"`)

export const embeddedIn = (mdx: string): ReadonlyArray<string> =>
  [...mdx.matchAll(/story="([a-z0-9-]+--[a-z0-9-]+)"/g)].map((found) => found[1] ?? "")
