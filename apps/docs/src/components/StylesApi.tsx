import React from "react"
import CodeBlock from "@theme/CodeBlock"
import generated from "../styles-api.json"
import mantine from "../../data/mantine-styles-api.json"
import styles from "./Site.module.css"

type Entry = {
  readonly file: string
  readonly parts: ReadonlyArray<string>
  readonly dataAttributes: ReadonlyArray<string>
  readonly vars: ReadonlyArray<{ readonly group: string; readonly names: ReadonlyArray<string> }>
}

type Modifier = {
  readonly modifier: string
  readonly selector: string | ReadonlyArray<string>
  readonly condition?: string
  readonly value?: string
}

type Described = {
  readonly selectors: Readonly<Record<string, string>>
  readonly modifiers?: ReadonlyArray<Modifier>
}

const ours: Readonly<Record<string, Entry>> = generated

const theirs: Readonly<Record<string, Described>> = mantine

const describe = (text: string | undefined): string => text?.replaceAll("`", "") ?? ""

const selectorsOf = (modifier: Modifier): string =>
  typeof modifier.selector === "string" ? modifier.selector : modifier.selector.join(", ")

const Section = ({ name, entry }: { readonly name: string; readonly entry: Entry }) => {
  const reference = theirs[name]
  const modifiers = reference?.modifiers ?? []
  const missing = modifiers.filter((modifier) => !entry.dataAttributes.includes(modifier.modifier))
  const example = entry.vars[0]

  return (
    <section className={styles.stylesApi}>
      <h2>{name} Styles API</h2>
      <h3>Parts</h3>
      <p>
        Each part takes a StyleX style (or a list of them) in <code>styles</code>, extra attributes in{" "}
        <code>attributes</code>, and the same from <code>createUi</code>'s component defaults.
      </p>
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {entry.parts.map((part) => (
            <tr key={part}>
              <td>
                <code>{part}</code>
              </td>
              <td>{describe(reference?.selectors[part])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {entry.vars.length === 0 ? null : (
        <>
          <h3>Variables</h3>
          <p>
            A theme overrides these StyleX variables with <code>stylex.createTheme</code>, passed to{" "}
            <code>ThemeProvider</code>'s <code>themes</code>.
          </p>
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Variables</th>
              </tr>
            </thead>
            <tbody>
              {entry.vars.map((group) => (
                <tr key={group.group}>
                  <td>
                    <code>{group.group}</code>
                  </td>
                  <td>
                    {group.names.map((variable) => (
                      <code key={variable} className={styles.variable}>
                        {variable}
                      </code>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {example === undefined || example.names[0] === undefined ? null : (
            <CodeBlock language="ts">{`const theme = stylex.createTheme(${example.group}, { ${example.names[0]}: "..." })`}</CodeBlock>
          )}
        </>
      )}
      <h3>Data attributes</h3>
      {entry.dataAttributes.length === 0 ? (
        <p>None.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Attribute</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {entry.dataAttributes.map((attribute) => {
              const known = modifiers.find((modifier) => modifier.modifier === attribute)

              return (
                <tr key={attribute}>
                  <td>
                    <code>{attribute}</code>
                  </td>
                  <td>{describe(known?.condition ?? known?.value)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {missing.length === 0 ? null : (
        <p className={styles.gap}>
          Mantine also sets {missing.map((modifier) => `${modifier.modifier} on ${selectorsOf(modifier)}`).join("; ")};
          not ported yet.
        </p>
      )}
    </section>
  )
}

export const StylesApi = ({ file }: { readonly file: string }) => {
  const sections = Object.entries(ours).filter(([, entry]) => entry.file === file)

  return (
    <>
      {sections.map(([name, entry]) => (
        <Section key={name} name={name} entry={entry} />
      ))}
    </>
  )
}
