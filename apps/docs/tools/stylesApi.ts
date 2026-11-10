export type StylesApi = {
  readonly file: string
  readonly parts: ReadonlyArray<string>
  readonly dataAttributes: ReadonlyArray<string>
  readonly vars: ReadonlyArray<{ readonly group: string; readonly names: ReadonlyArray<string> }>
}

type PartType = {
  readonly component: string
  readonly file: string
  readonly parts: ReadonlyArray<string>
  readonly refs: ReadonlyArray<string>
}

const unique = (values: ReadonlyArray<string>): ReadonlyArray<string> => [...new Set(values)]

export const partTypesOf = (file: string, source: string): ReadonlyArray<PartType> =>
  [...source.matchAll(/^export type (\w+)Part = ([^\n]+)$/gm)].map((found) => {
    const body = found[2] ?? ""

    return {
      component: found[1] ?? "",
      file,
      parts: [...body.matchAll(/"(\w+)"/g)].map((part) => part[1] ?? ""),
      refs: [...body.matchAll(/\b(\w+)Part\b/g)].map((ref) => ref[1] ?? "")
    }
  })

export const dataAttributesOf = (source: string): ReadonlyArray<string> =>
  unique(
    [...source.matchAll(/(?:DataAttribute\(|setAttribute\(["']data-)"?([\w-]+)"?/g)].map(
      (found) => `data-${found[1] ?? ""}`
    )
  ).toSorted()

export const varsOf = (source: string): StylesApi["vars"] =>
  [...source.matchAll(/export const (\w+) = stylex\.defineVars\(\{([\s\S]*?)\n\}\)/g)].map((found) => ({
    group: found[1] ?? "",
    names: [...(found[2] ?? "").matchAll(/^\s+\[?(?:`)?([\w$-]+)/gm)].map((name) => name[1] ?? "")
  }))

const referenced = (type: PartType, types: ReadonlyArray<PartType>): ReadonlyArray<PartType> =>
  type.refs.flatMap((ref) => types.filter((other) => other.component === ref))

const partsFor = (type: PartType, types: ReadonlyArray<PartType>): ReadonlyArray<string> =>
  unique([...referenced(type, types).flatMap((other) => partsFor(other, types)), ...type.parts])

const filesFor = (type: PartType, types: ReadonlyArray<PartType>): ReadonlyArray<string> =>
  unique([type.file, ...referenced(type, types).flatMap((other) => filesFor(other, types))])

export const stylesApiOf = (
  types: ReadonlyArray<PartType>,
  sources: Readonly<Record<string, string>>,
  stylex: Readonly<Record<string, string>>
): Readonly<Record<string, StylesApi>> =>
  Object.fromEntries(
    types.map((type) => [
      type.component,
      {
        file: type.file,
        parts: partsFor(type, types),
        dataAttributes: dataAttributesOf(
          filesFor(type, types)
            .map((file) => sources[file] ?? "")
            .join("\n")
        ),
        vars: varsOf(stylex[type.file] ?? "")
      }
    ])
  )
