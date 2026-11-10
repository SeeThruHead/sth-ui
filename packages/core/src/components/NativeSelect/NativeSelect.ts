import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { sx } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors } from "../../theme/tokens.stylex.ts"
import { chevronPath } from "../Combobox/Combobox.ts"
import { inputBase } from "../Input/InputBase.ts"
import type { InputSize } from "../Input/Input.ts"
import type { InputBaseConfig, InputBaseProps } from "../Input/InputBase.ts"

export type NativeSelectItem = { readonly value: string; readonly label: string; readonly disabled?: boolean }

export type NativeSelectGroup = { readonly group: string; readonly items: ReadonlyArray<string | NativeSelectItem> }

export type NativeSelectData = ReadonlyArray<string | NativeSelectItem | NativeSelectGroup>

export type NativeSelectProps<M> = Omit<InputBaseProps<M>, "component" | "pointer" | "multiline"> & {
  readonly data?: NativeSelectData
}

export type NativeSelectConfig = InputBaseConfig

const chevronSizes = stylex.create({
  xs: { width: "14px", height: "14px" },
  sm: { width: "18px", height: "18px" },
  md: { width: "20px", height: "20px" },
  lg: { width: "24px", height: "24px" },
  xl: { width: "28px", height: "28px" }
})

const styles = stylex.create({
  chevron: { color: `light-dark(${palette.gray6}, ${palette.dark3})` },
  error: { color: colors.error }
})

export const comboboxChevron = <M>(h: HtmlBuilder<M>, size: InputSize, error: boolean): Html =>
  h.svg(
    [
      ...sx(h, styles.chevron, chevronSizes[size], error && styles.error),
      h.Attribute("viewBox", "0 0 15 15"),
      h.Attribute("fill", "none"),
      h.DataAttribute("combobox-chevron", ""),
      ...(error ? [h.DataAttribute("error", "")] : [])
    ],
    [h.path([h.Attribute("d", chevronPath), h.Attribute("fill", "currentColor")], [])]
  )

const itemOf = (item: string | NativeSelectItem): NativeSelectItem =>
  typeof item === "string" ? { value: item, label: item } : item

const option = <M>(h: HtmlBuilder<M>, entry: string | NativeSelectItem): Html => {
  const item = itemOf(entry)

  return h.option([h.Value(item.value), ...(item.disabled === true ? [h.Disabled(true)] : [])], [item.label])
}

const optionOf =
  <M>(h: HtmlBuilder<M>) =>
  (entry: string | NativeSelectItem | NativeSelectGroup): Html =>
    typeof entry !== "string" && "group" in entry
      ? h.optgroup(
          [h.Attribute("label", entry.group)],
          entry.items.map((item) => option(h, item))
        )
      : option(h, entry)

const isError = (error: unknown): boolean => error !== undefined && error !== false && error !== null

export const NativeSelect = (config: Parameters<ReturnType<typeof inputBase<"NativeSelect">>>[0]) => {
  const base = inputBase("NativeSelect")(config)

  return <M>(h: HtmlBuilder<M>, props: NativeSelectProps<M>): Html => {
    const size = props.size ?? "sm"
    const options = (props.data ?? []).map(optionOf(h))

    return base(h, {
      rightSectionPointerEvents: "none",
      ...props,
      size,
      component: "select",
      pointer: true,
      rightSection: props.rightSection ?? comboboxChevron(h, size, isError(props.error)),
      children: props.children ?? options
    })
  }
}
