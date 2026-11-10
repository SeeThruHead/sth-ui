import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { sx } from "../../styles/StylesApi.ts"
import { Chip } from "./Chip.ts"
import type { ChipConfig, ChipProps } from "./Chip.ts"

export type GroupChipProps<M> = Omit<ChipProps<M>, "checked" | "onChange" | "value" | "type">

export type GroupChip<M> = (value: string, props: GroupChipProps<M>) => Html

export type ChipGroupProps<M> = (
  | {
      readonly multiple?: false
      readonly value: string | null
      readonly onChange: (value: string) => M
    }
  | {
      readonly multiple: true
      readonly value: ReadonlyArray<string>
      readonly onChange: (value: ReadonlyArray<string>) => M
    }
) & {
  readonly children: (chip: GroupChip<M>) => ReadonlyArray<Child>
}

const styles = stylex.create({ group: { display: "contents" } })

const toggled = (value: ReadonlyArray<string>, item: string, checked: boolean): ReadonlyArray<string> =>
  checked ? [...value, item] : value.filter((existing) => existing !== item)

export const ChipGroup = (config: { readonly Chip?: ChipConfig }) => {
  const chip = Chip(config)

  return <M>(h: HtmlBuilder<M>, props: ChipGroupProps<M>): Html => {
    const groupChip: GroupChip<M> = (value, item) => {
      if (props.multiple !== true) {
        return chip(h, {
          ...item,
          type: "radio",
          value,
          checked: props.value === value,
          onChange: () => props.onChange(value)
        })
      }

      return chip(h, {
        ...item,
        value,
        checked: props.value.includes(value),
        onChange: (checked) => props.onChange(toggled(props.value, value, checked))
      })
    }

    return h.div(sx(h, styles.group), props.children(groupChip))
  }
}
