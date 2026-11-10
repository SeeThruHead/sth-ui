import React from "react"
import CodeBlock from "@theme/CodeBlock"
import props from "../props.json"
import styles from "./Site.module.css"

type Row = {
  readonly name: string
  readonly type: string
  readonly required: boolean
  readonly default?: string
  readonly description: string
}

type Table = { readonly component: string; readonly rows: ReadonlyArray<Row> }

type Entry = { readonly code: string; readonly tables: ReadonlyArray<Table> }

const entries: Readonly<Record<string, Entry>> = props

const withCode = (text: string): ReadonlyArray<React.ReactNode> =>
  text.split("`").map((piece, index) => (index % 2 === 1 ? <code key={index}>{piece}</code> : piece))

const PropsTable = ({ table }: { readonly table: Table }) => (
  <section className={styles.stylesApi}>
    <h2>{table.component} props</h2>
    <div className={styles.propsScroll}>
      <table className={styles.propsTable}>
        <thead>
          <tr>
            <th className={styles.propName}>Name</th>
            <th className={styles.propType}>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.name} data-props-table-row>
              <td className={styles.propName}>
                <code>{row.name}</code>
                {row.required ? <span className={styles.required}>required</span> : null}
              </td>
              <td>
                <code className={styles.typeCode}>{row.type}</code>
              </td>
              <td className={styles.description}>
                {withCode(row.description)}
                {row.default === undefined ? null : (
                  <div className={styles.defaultValue}>
                    Default value: <code>{row.default}</code>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

export const Props = ({ file }: { readonly file: string }) => {
  const entry = entries[file]
  if (entry === undefined) return <p>No exports found in {file}.</p>

  return (
    <>
      {entry.tables.map((table) => (
        <PropsTable key={table.component} table={table} />
      ))}
      <details className={styles.sourceTypes}>
        <summary>Exported types</summary>
        <CodeBlock language="ts" title={`packages/core/src/${file}`}>
          {entry.code}
        </CodeBlock>
      </details>
    </>
  )
}
