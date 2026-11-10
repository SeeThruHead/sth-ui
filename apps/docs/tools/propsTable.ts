import { blockAt } from "./source.ts"

export type Member = { readonly name: string; readonly type: string; readonly required: boolean }

export type PropRow = Member & { readonly default?: string; readonly description: string }

export type PropsTable = { readonly component: string; readonly rows: ReadonlyArray<PropRow> }

export type MantineProps = Readonly<
  Record<string, Readonly<Record<string, { readonly description: string; readonly default?: string | undefined }>>>
>

type Declarations = ReadonlyMap<string, string>

const opening = new Set(["(", "{", "[", "<"])

const closing = new Set([")", "}", "]", ">"])

const depthAfter = (depth: number, text: string, index: number): number => {
  const char = text[index] ?? ""
  if (opening.has(char)) return depth + 1
  if (char === ">" && text[index - 1] === "=") return depth
  if (closing.has(char)) return depth - 1

  return depth
}

export const splitTop = (text: string, separator: string): ReadonlyArray<string> => {
  const chars = text.split("")
  const cuts = chars.reduce<{ readonly depth: number; readonly cuts: ReadonlyArray<number> }>(
    (state, char, index) => {
      const depth = depthAfter(state.depth, text, index)
      const cut = state.depth === 0 && char === separator && !(separator === ">" && text[index - 1] === "=")

      return { depth, cuts: cut ? [...state.cuts, index] : state.cuts }
    },
    { depth: 0, cuts: [] }
  ).cuts
  const bounds = [-1, ...cuts, text.length]

  return bounds
    .slice(1)
    .map((end, index) => text.slice((bounds[index] ?? 0) + 1, end).trim())
    .filter((part) => part !== "")
}

const memberStart = /^(?:readonly\s+)?["']?([\w$-]+)["']?(\?)?:\s*([\s\S]*)$/

const membersOfObject = (text: string): ReadonlyArray<Member> => {
  const inner = text.trim().replace(/^\{/, "").replace(/\}$/, "")
  const lines = splitTop(inner.replaceAll(";", "\n"), "\n")
  const grouped = lines.reduce<ReadonlyArray<string>>(
    (groups, line) =>
      memberStart.test(line) || groups.length === 0
        ? [...groups, line]
        : [...groups.slice(0, -1), `${groups.at(-1) ?? ""} ${line}`],
    []
  )

  return grouped.flatMap((member) => {
    const found = memberStart.exec(member)
    if (found === null) return []

    return [{ name: found[1] ?? "", required: found[2] !== "?", type: (found[3] ?? "").replace(/\s+/g, " ").trim() }]
  })
}

const keysIn = (text: string): ReadonlySet<string> =>
  new Set([...text.matchAll(/"([\w$-]+)"/g)].map((key) => key[1] ?? ""))

const skipped = new Set(["StylesApiProps", "StyleProps", "ComponentConfig"])

const genericArguments = (term: string): ReadonlyArray<string> => {
  const open = term.indexOf("<")

  return open === -1 ? [] : splitTop(term.slice(open + 1, term.lastIndexOf(">")), ",")
}

const merged = (variants: ReadonlyArray<ReadonlyArray<Member>>): ReadonlyArray<Member> => {
  const names = [...new Set(variants.flat().map((member) => member.name))]

  return names.map((name) => {
    const found = variants.flatMap((variant) => variant.filter((member) => member.name === name))

    return {
      name,
      type: [...new Set(found.map((member) => member.type))].join(" | "),
      required: found.length === variants.length && found.every((member) => member.required)
    }
  })
}

const membersOfTerm = (term: string, declarations: Declarations, seen: ReadonlySet<string>): ReadonlyArray<Member> => {
  const trimmed = term.trim()
  if (trimmed.startsWith("{")) return membersOfObject(trimmed)
  if (trimmed.startsWith("(")) return membersOf(trimmed.slice(1, -1), declarations, seen)
  const name = /^(\w+)/.exec(trimmed)?.[1] ?? ""
  const [first, second] = genericArguments(trimmed)
  if (name === "Omit") {
    const removed = keysIn(second ?? "")
    return membersOf(first ?? "", declarations, seen).filter((member) => !removed.has(member.name))
  }
  if (name === "Pick") {
    const kept = keysIn(second ?? "")
    return membersOf(first ?? "", declarations, seen).filter((member) => kept.has(member.name))
  }
  if (name === "Partial")
    return membersOf(first ?? "", declarations, seen).map((member) => ({ ...member, required: false }))
  if (skipped.has(name) || seen.has(name)) return []
  const body = declarations.get(name)

  return body === undefined ? [] : membersOf(body, declarations, new Set([...seen, name]))
}

export const membersOf = (
  body: string,
  declarations: Declarations,
  seen: ReadonlySet<string>
): ReadonlyArray<Member> => {
  const variants = splitTop(body.trim().replace(/^\|/, ""), "|")
  if (variants.length > 1) return merged(variants.map((variant) => membersOf(variant, declarations, seen)))
  const all = splitTop(body, "&").flatMap((term) => membersOfTerm(term, declarations, seen))

  return all.filter((member, index) => all.findIndex((other) => other.name === member.name) === index)
}

export const declarationsOf = (sources: ReadonlyArray<string>): Declarations =>
  new Map(
    sources.flatMap((source) => {
      const lines = source.split("\n")

      return lines.flatMap((line, index) => {
        const found = /^export type (\w+)(?:<[^=]*>)? = ?(.*)$/.exec(line)
        if (found === null) return []
        const rest = blockAt(lines, index).slice(1).join("\n")

        return [[found[1] ?? "", `${found[2] ?? ""}\n${rest}`] as const]
      })
    })
  )

const literal = /^("[^"]*"|-?\d+(?:\.\d+)?|true|false)$/

export const defaultsOf = (source: string): ReadonlyMap<string, string> =>
  new Map([
    ...[...source.matchAll(/\bprops\.(\w+) !== false/g)].map((found) => [found[1] ?? "", "true"] as const),
    ...[...source.matchAll(/\b(?:props|input)\.(\w+) \?\? ([^\s),\]}]+)/g)]
      .filter((found) => literal.test(found[2] ?? ""))
      .map((found) => [found[1] ?? "", found[2] ?? ""] as const)
  ])

const componentsIn = (source: string): ReadonlyArray<string> =>
  [...source.matchAll(/^export type (\w+)Props\b/gm)]
    .map((found) => found[1] ?? "")
    .filter((name) => name !== "StylesApi" && name !== "")

export const tablesOf = (
  source: string,
  declarations: Declarations,
  mantine: MantineProps,
  common: Readonly<Record<string, string>>
): ReadonlyArray<PropsTable> => {
  const defaults = defaultsOf(source)

  return componentsIn(source).flatMap((component) => {
    const body = declarations.get(`${component}Props`) ?? ""
    const described = mantine[component] ?? {}
    const rows = membersOf(body, declarations, new Set([`${component}Props`])).map((member) => {
      const fromMantine = described[member.name]
      const fallback = defaults.get(member.name) ?? fromMantine?.default

      return {
        ...member,
        description: fromMantine?.description ?? common[member.name] ?? "",
        ...(fallback === undefined ? {} : { default: fallback })
      }
    })

    return rows.length === 0 ? [] : [{ component, rows: rows.toSorted((a, b) => a.name.localeCompare(b.name)) }]
  })
}
