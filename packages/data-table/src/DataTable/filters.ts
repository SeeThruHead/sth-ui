import * as stylex from "@stylexjs/stylex"
import type { Components } from "@sth-ui/core/Ui.ts"
import { Button } from "@sth-ui/core/components/Button/Button.ts"
import { Checkbox } from "@sth-ui/core/components/Checkbox/Checkbox.ts"
import { TextInput } from "@sth-ui/core/components/Input/InputBase.ts"
import { sx } from "@sth-ui/core/styles/StylesApi.ts"
import { space } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { Html, HtmlBuilder } from "foldkit/html"
import { Message } from "./model.ts"
import type { FilterKind, FilterOption, FilterValue } from "./rows.ts"

export type FilterViewInput<M> = {
  readonly id: string
  readonly column: string
  readonly title: string
  readonly kind: FilterKind
  readonly value: FilterValue | undefined
  readonly lift: (message: Message) => M
}

const styles = stylex.create({
  stack: { display: "flex", flexDirection: "column", gap: space.xs },
  options: { display: "flex", flexDirection: "column", gap: space.xs, maxHeight: "240px", overflowY: "auto" },
  range: { display: "flex", gap: space.xs, alignItems: "flex-end" },
  choices: { display: "flex", gap: space.xs }
})

const numberOrNull = (text: string): number | null => {
  const parsed = Number(text)

  return text.trim() === "" || !Number.isFinite(parsed) ? null : parsed
}

const textOrNull = (text: string): string | null => (text === "" ? null : text)

const toggledValue = (values: ReadonlyArray<string>, value: string, checked: boolean): ReadonlyArray<string> =>
  checked ? [...values, value] : values.filter((item) => item !== value)

export const filterView = (components: Components) => {
  const button = Button(components)
  const checkbox = Checkbox(components)
  const textInput = TextInput(components)

  return <M>(h: HtmlBuilder<M>, input: FilterViewInput<M>): Html => {
    const fieldId = (suffix: string) => `${input.id}-filter-${input.column}-${suffix}`
    const changed = (filter: FilterValue) => input.lift(Message.ChangedFilter({ column: input.column, filter }))
    const clear = button(h, {
      variant: "subtle",
      size: "compact-sm",
      onClick: input.lift(Message.ClearedFilter({ column: input.column })),
      label: `Clear ${input.title} filter`,
      children: ["Clear filter"]
    })
    const text = () => {
      const query = input.value?._tag === "Text" ? input.value.query : ""

      return [
        textInput(h, {
          id: fieldId("text"),
          label: `${input.title} contains`,
          size: "xs",
          value: query,
          onInput: (next) => changed({ _tag: "Text", query: next })
        })
      ]
    }
    const options = (choices: ReadonlyArray<FilterOption>) => {
      const values = input.value?._tag === "Options" ? input.value.values : []

      return [
        h.div(
          [...sx(h, styles.options), h.Role("group"), h.AriaLabel(input.title)],
          choices.map((choice) =>
            checkbox(h, {
              id: fieldId(`option-${choice.value}`),
              size: "xs",
              label: choice.label,
              checked: values.includes(choice.value),
              onChange: (checked) => changed({ _tag: "Options", values: toggledValue(values, choice.value, checked) })
            })
          )
        )
      ]
    }
    const numberRange = () => {
      const range = input.value?._tag === "NumberRange" ? input.value : { min: null, max: null }

      return [
        h.div(sx(h, styles.range), [
          textInput(h, {
            id: fieldId("min"),
            label: "From",
            size: "xs",
            type: "number",
            value: range.min === null ? "" : String(range.min),
            onInput: (next) => changed({ _tag: "NumberRange", min: numberOrNull(next), max: range.max })
          }),
          textInput(h, {
            id: fieldId("max"),
            label: "To",
            size: "xs",
            type: "number",
            value: range.max === null ? "" : String(range.max),
            onInput: (next) => changed({ _tag: "NumberRange", min: range.min, max: numberOrNull(next) })
          })
        ])
      ]
    }
    const dateRange = () => {
      const range = input.value?._tag === "DateRange" ? input.value : { from: null, to: null }

      return [
        h.div(sx(h, styles.range), [
          textInput(h, {
            id: fieldId("from"),
            label: "From",
            size: "xs",
            type: "date",
            value: range.from ?? "",
            onInput: (next) => changed({ _tag: "DateRange", from: textOrNull(next), to: range.to })
          }),
          textInput(h, {
            id: fieldId("to"),
            label: "To",
            size: "xs",
            type: "date",
            value: range.to ?? "",
            onInput: (next) => changed({ _tag: "DateRange", from: range.from, to: textOrNull(next) })
          })
        ])
      ]
    }
    const boolean = () => {
      const chosen = input.value?._tag === "Boolean" ? input.value.value : null
      const choice = (label: string, value: boolean) =>
        button(h, {
          size: "compact-sm",
          variant: chosen === value ? "filled" : "default",
          onClick: changed({ _tag: "Boolean", value }),
          children: [label]
        })

      return [
        h.div(
          [...sx(h, styles.choices), h.Role("group"), h.AriaLabel(input.title)],
          [choice("Yes", true), choice("No", false)]
        )
      ]
    }
    const fields = (): ReadonlyArray<Html> => {
      switch (input.kind._tag) {
        case "Text":
          return text()
        case "Options":
          return options(input.kind.options)
        case "NumberRange":
          return numberRange()
        case "DateRange":
          return dateRange()
        case "Boolean":
          return boolean()
      }
    }

    return h.div(sx(h, styles.stack), [...fields(), clear])
  }
}
