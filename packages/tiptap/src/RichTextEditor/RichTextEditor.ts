import * as stylex from "@stylexjs/stylex"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "@sth-ui/core/content.ts"
import { listOf, setStyle, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, GetStyles, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { sizeValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { controls } from "../controls.ts"
import type { ControlName } from "../controls.ts"
import { richTextEditorLabels } from "../labels.ts"
import type { RichTextEditorLabels } from "../labels.ts"
import { Option } from "effect"
import { Button } from "@sth-ui/core/components/Button/Button.ts"
import { TextInput } from "@sth-ui/core/components/Input/InputBase.ts"
import { ActionIcon } from "@sth-ui/core/components/ActionIcon/ActionIcon.ts"
import { ColorPicker } from "@sth-ui/core/components/ColorPicker/ColorPicker.ts"
import type { ColorPickerOptions } from "@sth-ui/core/components/ColorPicker/ColorPicker.ts"
import { ColorSwatch } from "@sth-ui/core/components/ColorSwatch/ColorSwatch.ts"
import { Group } from "@sth-ui/core/components/Group/Group.ts"
import { Popover } from "@sth-ui/core/components/Popover/Popover.ts"
import { SimpleGrid } from "@sth-ui/core/components/SimpleGrid/SimpleGrid.ts"
import { BracketsAngleIcon } from "@sth-ui/icons/icons/BracketsAngleIcon.ts"
import { CheckIcon } from "@sth-ui/icons/icons/CheckIcon.ts"
import { EyedropperIcon } from "@sth-ui/icons/icons/EyedropperIcon.ts"
import { PaletteIcon } from "@sth-ui/icons/icons/PaletteIcon.ts"
import { ProhibitIcon } from "@sth-ui/icons/icons/ProhibitIcon.ts"
import { FileButton } from "@sth-ui/core/components/FileButton/FileButton.ts"
import { ImageIcon } from "@sth-ui/icons/icons/ImageIcon.ts"
import { TableIcon } from "@sth-ui/icons/icons/TableIcon.ts"
import { XIcon } from "@sth-ui/icons/icons/XIcon.ts"
import type { PopoverOptions } from "@sth-ui/core/components/Popover/Popover.ts"
import { ArrowSquareOutIcon } from "@sth-ui/icons/icons/ArrowSquareOutIcon.ts"
import type { Icon } from "@sth-ui/icons/Icon.ts"
import { LinkIcon } from "@sth-ui/icons/icons/LinkIcon.ts"
import { contentId, Message } from "./model.ts"
import type { EditorBundle, Model } from "./model.ts"

export type RichTextEditorPart =
  | "root"
  | "toolbar"
  | "content"
  | "control"
  | "controlIcon"
  | "controlsGroup"
  | "linkEditor"
  | "linkEditorDropdown"
  | "linkEditorSave"
  | "linkEditorInput"
  | "linkEditorExternalControl"
  | "tableInsertDropdown"
  | "tableInsertGrid"
  | "tableInsertCell"
  | "tableInsertLabel"

export type RichTextEditorVariant = "default" | "subtle"

export type RichTextEditorControlItem<M> =
  | { readonly _tag: "RichTextEditorNamedControl"; readonly name: ControlName }
  | {
      readonly _tag: "RichTextEditorControl"
      readonly label: string
      readonly children: ReadonlyArray<Child>
      readonly active?: boolean
      readonly interactive?: boolean
      readonly disabled?: boolean
      readonly onClick?: M
    }

export type RichTextEditorLinkControl = {
  readonly _tag: "RichTextEditorLinkControl"
  readonly icon?: Icon
  readonly disableTooltips?: boolean
  readonly popoverProps?: PopoverOptions
}

export type RichTextEditorSourceCodeControl = { readonly _tag: "RichTextEditorSourceCodeControl"; readonly icon?: Icon }

export type RichTextEditorTableInsertControl = {
  readonly _tag: "RichTextEditorTableInsertControl"
  readonly icon?: Icon
  readonly maxColumns?: number
  readonly maxRows?: number
  readonly withHeaderRow?: boolean
  readonly popoverProps?: PopoverOptions
}

export type RichTextEditorImageUploadControl = {
  readonly _tag: "RichTextEditorImageUploadControl"
  readonly icon?: Icon
  readonly accept?: string
}

export type RichTextEditorColorControl = { readonly _tag: "RichTextEditorColorControl"; readonly color: string }

export type RichTextEditorColorPickerControl = {
  readonly _tag: "RichTextEditorColorPickerControl"
  readonly colors: ReadonlyArray<string>
  readonly popoverProps?: PopoverOptions
  readonly colorPickerProps?: ColorPickerOptions
}

export type RichTextEditorItem<M> =
  | RichTextEditorControlItem<M>
  | RichTextEditorLinkControl
  | RichTextEditorColorControl
  | RichTextEditorColorPickerControl
  | RichTextEditorSourceCodeControl
  | RichTextEditorTableInsertControl
  | RichTextEditorImageUploadControl

export type RichTextEditorControlsGroup<M> = {
  readonly _tag: "RichTextEditorControlsGroup"
  readonly children: ReadonlyArray<RichTextEditorItem<M>>
}

export type RichTextEditorToolbar<M> = {
  readonly _tag: "RichTextEditorToolbar"
  readonly sticky?: boolean
  readonly stickyOffset?: StyleValue
  readonly children: ReadonlyArray<RichTextEditorControlsGroup<M> | RichTextEditorItem<M>>
}

export type RichTextEditorContent = { readonly _tag: "RichTextEditorContent" }

export type RichTextEditorSlot<M> = RichTextEditorToolbar<M> | RichTextEditorContent

export const richTextEditorControl = <M>(name: ControlName): RichTextEditorControlItem<M> => ({
  _tag: "RichTextEditorNamedControl",
  name
})

export const richTextEditorCustomControl = <M>(
  control: Omit<Extract<RichTextEditorControlItem<M>, { readonly _tag: "RichTextEditorControl" }>, "_tag">
): RichTextEditorControlItem<M> => ({ _tag: "RichTextEditorControl", ...control })

export const richTextEditorControlsGroup = <M>(
  children: ReadonlyArray<RichTextEditorItem<M>>
): RichTextEditorControlsGroup<M> => ({ _tag: "RichTextEditorControlsGroup", children })

export const richTextEditorSourceCodeControl = (
  control: Omit<RichTextEditorSourceCodeControl, "_tag"> = {}
): RichTextEditorSourceCodeControl => ({ _tag: "RichTextEditorSourceCodeControl", ...control })

export const richTextEditorTableInsertControl = (
  control: Omit<RichTextEditorTableInsertControl, "_tag"> = {}
): RichTextEditorTableInsertControl => ({ _tag: "RichTextEditorTableInsertControl", ...control })

export const richTextEditorImageUploadControl = (
  control: Omit<RichTextEditorImageUploadControl, "_tag"> = {}
): RichTextEditorImageUploadControl => ({ _tag: "RichTextEditorImageUploadControl", ...control })

export const richTextEditorColorControl = (color: string): RichTextEditorColorControl => ({
  _tag: "RichTextEditorColorControl",
  color
})

export const richTextEditorColorPickerControl = (
  control: Omit<RichTextEditorColorPickerControl, "_tag">
): RichTextEditorColorPickerControl => ({ _tag: "RichTextEditorColorPickerControl", ...control })

export const richTextEditorLinkControl = (
  control: Omit<RichTextEditorLinkControl, "_tag"> = {}
): RichTextEditorLinkControl => ({ _tag: "RichTextEditorLinkControl", ...control })

export const richTextEditorToolbar = <M>(
  toolbar: Omit<RichTextEditorToolbar<M>, "_tag">
): RichTextEditorToolbar<M> => ({ _tag: "RichTextEditorToolbar", ...toolbar })

export const richTextEditorContent: RichTextEditorContent = { _tag: "RichTextEditorContent" }

export type RichTextEditorOptions = {
  readonly variant?: RichTextEditorVariant
  readonly labels?: Partial<RichTextEditorLabels>
}

export type RichTextEditorProps<M> = RichTextEditorOptions &
  StylesApiProps<RichTextEditorPart> & {
    readonly editor: EditorBundle
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly children: ReadonlyArray<RichTextEditorSlot<M>>
  }

export type RichTextEditorConfig = ComponentConfig<RichTextEditorOptions, RichTextEditorPart>

export type RichTextEditorComponents = { readonly RichTextEditor?: RichTextEditorConfig } & Parameters<
  typeof Popover
>[0] &
  Parameters<typeof TextInput>[0] &
  Parameters<typeof Button>[0] &
  Parameters<typeof ActionIcon>[0] &
  Parameters<typeof ColorPicker>[0] &
  Parameters<typeof ColorSwatch>[0] &
  Parameters<typeof Group>[0] &
  Parameters<typeof SimpleGrid>[0]

const border = `light-dark(${palette.gray4}, ${palette.dark4})`

const styles = stylex.create({
  root: {
    position: "relative",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: border,
    borderRadius: radius.default
  },
  clipped: { overflow: "clip" },
  toolbar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.sm,
    backgroundColor: colors.body,
    zIndex: 1,
    borderStartStartRadius: radius.default,
    borderStartEndRadius: radius.default,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: border
  },
  toolbarDefault: { paddingBlock: space.xs, paddingInline: space.md },
  toolbarSubtle: { padding: "4px", rowGap: 0 },
  sticky: { position: "sticky" },
  content: { backgroundColor: colors.body, borderRadius: radius.default },
  group: { display: "flex", backgroundColor: colors.body },
  control: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    borderRadius: radius.default,
    cursor: "default",
    borderWidth: 0,
    color: `light-dark(${palette.gray7}, ${palette.dark1})`,
    outlineOffset: "2px"
  },
  controlDefault: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: border,
    minWidth: "26px",
    height: "26px",
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`
  },
  controlSubtle: {
    minWidth: "32px",
    height: "32px",
    backgroundColor: `light-dark(${palette.white}, ${palette.dark7})`
  },
  disabled: { cursor: "not-allowed", opacity: 0.5 },
  interactiveDefault: {
    cursor: "pointer",
    color: { default: null, ":hover": colors.bright },
    backgroundColor: {
      default: `light-dark(${palette.white}, ${palette.dark6})`,
      ":hover": `light-dark(${palette.gray0}, ${palette.dark5})`
    }
  },
  interactiveSubtle: {
    cursor: "pointer",
    color: { default: null, ":hover": colors.bright },
    backgroundColor: {
      default: `light-dark(${palette.white}, ${palette.dark7})`,
      ":hover": `light-dark(${palette.gray1}, ${palette.dark5})`
    }
  },
  active: {
    backgroundColor: { default: accent.light, ":hover": accent.lightHover },
    color: { default: accent.lightColor, ":hover": accent.lightColor }
  },
  inGroup: { borderRadius: 0 },
  notLast: { borderInlineEndWidth: 0 },
  first: { borderStartStartRadius: radius.default, borderEndStartRadius: radius.default },
  last: { borderStartEndRadius: radius.default, borderEndEndRadius: radius.default },
  icon: { width: "16px", height: "16px", display: "flex" },
  linkEditor: { display: "flex" },
  linkEditorDropdown: { backgroundColor: colors.body },
  linkEditorInput: { borderStartEndRadius: 0, borderEndEndRadius: 0, borderInlineEndWidth: 0 },
  linkEditorExternalControl: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: border,
    color: colors.text,
    height: "24px",
    width: "24px",
    padding: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.default,
    cursor: "pointer",
    backgroundColor: `light-dark(${palette.white}, ${palette.dark7})`
  },
  linkEditorExternalActive: {
    backgroundColor: { default: accent.light, ":hover": accent.lightHover },
    color: accent.filled
  },
  linkEditorSave: { borderStartStartRadius: 0, borderEndStartRadius: 0 },
  tableInsertDropdown: { backgroundColor: colors.body, padding: space.xs },
  tableInsertGrid: { display: "grid", gap: "3px" },
  tableInsertCell: {
    width: "20px",
    height: "20px",
    padding: 0,
    borderWidth: 0,
    cursor: "pointer",
    backgroundColor: `light-dark(${palette.gray2}, ${palette.dark5})`
  },
  tableInsertCellActive: { backgroundColor: accent.filled },
  tableInsertLabel: { marginTop: space.xs, textAlign: "center", fontSize: fontSize.sm, color: colors.dimmed },
  iconSubtle: { width: "20px", height: "20px" }
})

type Position = { readonly first: boolean; readonly last: boolean } | undefined

type Context<M> = {
  readonly h: HtmlBuilder<M>
  readonly parts: {
    readonly popover: ReturnType<typeof Popover>
    readonly textInput: ReturnType<typeof TextInput>
    readonly button: ReturnType<typeof Button>
    readonly actionIcon: ReturnType<typeof ActionIcon>
    readonly colorPicker: ReturnType<typeof ColorPicker>
    readonly colorSwatch: ReturnType<typeof ColorSwatch>
    readonly group: ReturnType<typeof Group>
    readonly simpleGrid: ReturnType<typeof SimpleGrid>
  }
  readonly props: RichTextEditorProps<M>
  readonly getStyles: GetStyles<M, RichTextEditorPart>
  readonly labels: RichTextEditorLabels
  readonly variant: RichTextEditorVariant
}

const positionStyles = (position: Position) =>
  position === undefined
    ? []
    : [styles.inGroup, !position.last && styles.notLast, position.first && styles.first, position.last && styles.last]

type Described<M> = {
  readonly label: string
  readonly content: ReadonlyArray<Child>
  readonly active: boolean
  readonly disabled: boolean
  readonly interactive: boolean
  readonly onClick: M | undefined
}

const describe = <M>(context: Context<M>, item: RichTextEditorControlItem<M>): Described<M> => {
  const { props, labels } = context
  if (item._tag === "RichTextEditorControl") {
    return {
      label: item.label,
      content: item.children,
      active: item.active === true,
      disabled: item.disabled === true,
      interactive: item.interactive !== false,
      onClick: item.onClick
    }
  }
  const spec = controls[item.name]

  return {
    label: labels[spec.label],
    content: [iconOf(context, spec.icon)],
    active: props.model.snapshot.active.includes(item.name),
    disabled: props.model.snapshot.disabled.includes(item.name),
    interactive: true,
    onClick: props.toParentMessage(Message.PressedControl({ control: item.name }))
  }
}

const buttonNode = <M>(
  context: Context<M>,
  described: Described<M>,
  position: Position,
  extra: ReadonlyArray<ChildAttribute>
): Html => {
  const { h, getStyles, variant } = context
  const subtle = variant === "subtle"
  const { label, content, active, disabled, interactive, onClick } = described

  return h.button(
    [
      ...extra,
      ...getStyles(
        "control",
        styles.control,
        subtle ? styles.controlSubtle : styles.controlDefault,
        interactive && !disabled && (subtle ? styles.interactiveSubtle : styles.interactiveDefault),
        active && styles.active,
        disabled && styles.disabled,
        ...positionStyles(position)
      ),
      h.Type("button"),
      h.AriaLabel(label),
      h.Title(label),
      ...(active && interactive ? [h.AriaPressed("true")] : []),
      h.DataAttribute("rich-text-editor-control", ""),
      h.DataAttribute("variant", variant),
      ...(active ? [h.DataAttribute("active", "")] : []),
      ...(interactive ? [h.DataAttribute("interactive", "")] : []),
      ...(disabled ? [h.DataAttribute("disabled", ""), h.Disabled(true)] : []),
      ...(onClick === undefined || disabled ? [] : [h.OnClick(onClick)])
    ],
    content
  )
}

const controlNode = <M>(context: Context<M>, item: RichTextEditorControlItem<M>, position: Position): Html =>
  buttonNode(context, describe(context, item), position, [])

const iconOf = <M>(context: Context<M>, icon: Icon): Child => {
  const subtle = context.variant === "subtle"

  return context.h.span(context.getStyles("controlIcon", styles.icon, subtle && styles.iconSubtle), [
    icon(context.h, { size: subtle ? 20 : 16 })
  ])
}

const linkNode = <M>(context: Context<M>, control: RichTextEditorLinkControl, position: Position): Html => {
  const { h, props, getStyles, labels, parts } = context
  const send = props.toParentMessage
  const link = props.model.link
  const externalLabel = link.external ? labels.linkEditorExternalLink : labels.linkEditorInternalLink

  return parts.popover(h, {
    shadow: "md",
    offset: -44,
    zIndex: 10000,
    withinPortal: true,
    ...control.popoverProps,
    model: link.popover,
    toParentMessage: (message) => send(Message.GotLinkPopover({ message })),
    target: (bind) =>
      buttonNode(
        context,
        {
          label: labels.linkControlLabel,
          content: [iconOf(context, control.icon ?? LinkIcon)],
          active: props.model.snapshot.link.href !== "",
          disabled: false,
          interactive: true,
          onClick: undefined
        },
        position,
        bind
      ),
    children: [
      h.div(
        [...getStyles("linkEditorDropdown", styles.linkEditorDropdown)],
        [
          h.div(getStyles("linkEditor", styles.linkEditor), [
            parts.textInput(h, {
              id: `${link.popover.id}-url`,
              type: "url",
              value: link.url,
              placeholder: labels.linkEditorInputPlaceholder,
              attributes: { input: { "aria-label": labels.linkEditorInputLabel } },
              styles: { input: [styles.linkEditorInput, ...listOf(props.styles?.linkEditorInput)] },
              onInput: (url) => send(Message.ChangedLinkUrl({ url })),
              rightSectionPointerEvents: "all",
              onKeyDown: (key) => (key === "Enter" ? Option.some(send(Message.SavedLink())) : Option.none()),
              rightSection: h.button(
                [
                  ...getStyles(
                    "linkEditorExternalControl",
                    styles.linkEditorExternalControl,
                    link.external && styles.linkEditorExternalActive
                  ),
                  h.Type("button"),
                  h.AriaLabel(externalLabel),
                  ...(control.disableTooltips === true ? [] : [h.Title(externalLabel)]),
                  ...(link.external ? [h.DataAttribute("active", ""), h.AriaPressed("true")] : []),
                  h.OnClick(send(Message.ToggledLinkExternal()))
                ],
                [ArrowSquareOutIcon(h, { size: 14 })]
              )
            }),
            parts.button(h, {
              variant: "default",
              styles: { root: [styles.linkEditorSave, ...listOf(props.styles?.linkEditorSave)] },
              onClick: send(Message.SavedLink()),
              children: [labels.linkEditorSave]
            })
          ])
        ]
      )
    ]
  })
}

const swatch = <M>(context: Context<M>, color: string): Child =>
  context.parts.colorSwatch(context.h, { color, size: 14 })

const colorNode = <M>(context: Context<M>, control: RichTextEditorColorControl, position: Position): Html =>
  buttonNode(
    context,
    {
      label: context.labels.colorControlLabel(control.color),
      content: [swatch(context, control.color)],
      active: context.props.model.snapshot.color === control.color,
      disabled: false,
      interactive: true,
      onClick: context.props.toParentMessage(Message.PickedColor({ color: control.color }))
    },
    position,
    []
  )

const colorAction = <M>(context: Context<M>, label: string, icon: Icon, message: Message): Html =>
  context.parts.actionIcon(context.h, {
    variant: "default",
    label,
    attributes: { root: { title: label } },
    onClick: context.props.toParentMessage(message),
    children: [icon(context.h, { size: 16 })]
  })

const colorPickerNode = <M>(
  context: Context<M>,
  control: RichTextEditorColorPickerControl,
  position: Position
): Html => {
  const { h, props, getStyles, labels, parts } = context
  const send = props.toParentMessage
  const color = props.model.color
  const showsPalette = color.mode === "palette"
  const current = props.model.snapshot.color === "" ? colors.text : props.model.snapshot.color

  return parts.popover(h, {
    withinPortal: true,
    ...control.popoverProps,
    model: color.popover,
    toParentMessage: (message) => send(Message.GotColorPopover({ message })),
    target: (bind) =>
      buttonNode(
        context,
        {
          label: labels.colorPickerControlLabel,
          content: [swatch(context, current)],
          active: false,
          disabled: false,
          interactive: true,
          onClick: undefined
        },
        position,
        bind
      ),
    children: [
      h.div(getStyles("linkEditorDropdown", styles.linkEditorDropdown), [
        showsPalette
          ? parts.simpleGrid(h, {
              cols: 7,
              spacing: 2,
              children: control.colors.map((value) =>
                parts.colorSwatch(h, {
                  component: "button",
                  color: value,
                  size: 26,
                  radius: "xs",
                  ariaLabel: labels.colorPickerColorLabel(value),
                  attributes: { root: { title: labels.colorPickerColorLabel(value) } },
                  onClick: send(Message.PickedColor({ color: value }))
                })
              )
            })
          : parts.colorPicker(h, {
              ...control.colorPickerProps,
              model: color.picker,
              value: current,
              toParentMessage: (message) => send(Message.GotColorPicker({ message }))
            }),
        parts.group(h, {
          justify: "flex-end",
          gap: "xs",
          mt: "sm",
          children: [
            ...(showsPalette ? [colorAction(context, labels.colorPickerCancel, XIcon, Message.ClosedColor())] : []),
            colorAction(context, labels.colorPickerClear, ProhibitIcon, Message.ClearedColor()),
            showsPalette
              ? colorAction(context, labels.colorPickerColorPicker, EyedropperIcon, Message.ShowedColorPicker())
              : colorAction(context, labels.colorPickerPalette, PaletteIcon, Message.ShowedPalette()),
            ...(showsPalette ? [] : [colorAction(context, labels.colorPickerSave, CheckIcon, Message.ClosedColor())])
          ]
        })
      ])
    ]
  })
}

const sourceCodeNode = <M>(context: Context<M>, control: RichTextEditorSourceCodeControl, position: Position): Html =>
  buttonNode(
    context,
    {
      label: context.labels.sourceCodeControlLabel,
      content: [iconOf(context, control.icon ?? BracketsAngleIcon)],
      active: context.props.model.sourceCode,
      disabled: false,
      interactive: true,
      onClick: context.props.toParentMessage(Message.ToggledSourceCode())
    },
    position,
    []
  )

const tableInsertNode = <M>(
  context: Context<M>,
  control: RichTextEditorTableInsertControl,
  position: Position
): Html => {
  const { h, props, getStyles, labels, parts } = context
  const send = props.toParentMessage
  const table = props.model.table
  const maxColumns = control.maxColumns ?? 10
  const maxRows = control.maxRows ?? 10
  const withHeaderRow = control.withHeaderRow ?? true
  const cell = (row: number, column: number) => {
    const active = column <= table.columns && row <= table.rows
    const size = send(Message.HoveredTableSize({ columns: column, rows: row }))

    return h.button(
      [
        ...getStyles("tableInsertCell", styles.tableInsertCell, active && styles.tableInsertCellActive),
        h.Type("button"),
        h.AriaLabel(labels.tableInsertLabel(column, row)),
        ...(active ? [h.DataAttribute("active", "")] : []),
        h.OnMouseEnter(size),
        h.OnFocus(size),
        h.OnClick(send(Message.InsertedTable({ columns: column, rows: row, withHeaderRow })))
      ],
      []
    )
  }

  return parts.popover(h, {
    shadow: "md",
    position: "bottom-end",
    withinPortal: true,
    ...control.popoverProps,
    model: table.popover,
    toParentMessage: (message) => send(Message.GotTablePopover({ message })),
    target: (bind) =>
      buttonNode(
        context,
        {
          label: labels.tableInsertControlLabel,
          content: [iconOf(context, control.icon ?? TableIcon)],
          active: table.popover.isOpen,
          disabled: props.model.snapshot.disabled.includes("TableInsert"),
          interactive: true,
          onClick: undefined
        },
        position,
        bind
      ),
    children: [
      h.div(getStyles("tableInsertDropdown", styles.tableInsertDropdown), [
        h.div(
          [
            ...getStyles(
              "tableInsertGrid",
              styles.tableInsertGrid,
              setStyle(["gridTemplateColumns", `repeat(${maxColumns}, 1fr)`])
            ),
            h.OnMouseLeave(send(Message.LeftTableGrid()))
          ],
          Array.from({ length: maxRows }, (_, row) =>
            Array.from({ length: maxColumns }, (__, column) => cell(row + 1, column + 1))
          ).flat()
        ),
        h.div(getStyles("tableInsertLabel", styles.tableInsertLabel), [
          table.columns > 0 ? `${table.columns} × ${table.rows}` : labels.tableInsertControlLabel
        ])
      ])
    ]
  })
}

const imageUploadNode = <M>(context: Context<M>, control: RichTextEditorImageUploadControl, position: Position): Html =>
  FileButton()(context.h, {
    model: context.props.model.image,
    toParentMessage: (message) => context.props.toParentMessage(Message.GotImageInput({ message })),
    accept: control.accept ?? "image/*",
    multiple: true,
    children: (open) =>
      buttonNode(
        context,
        {
          label: context.labels.imageUploadControlLabel,
          content: [iconOf(context, control.icon ?? ImageIcon)],
          active: false,
          disabled: context.props.model.snapshot.disabled.includes("ImageUpload"),
          interactive: true,
          onClick: open
        },
        position,
        []
      )
  })

const groupItemNode = <M>(context: Context<M>, item: RichTextEditorItem<M>, position: Position): Html => {
  if (item._tag === "RichTextEditorLinkControl") return linkNode(context, item, position)
  if (item._tag === "RichTextEditorColorControl") return colorNode(context, item, position)
  if (item._tag === "RichTextEditorColorPickerControl") return colorPickerNode(context, item, position)
  if (item._tag === "RichTextEditorSourceCodeControl") return sourceCodeNode(context, item, position)
  if (item._tag === "RichTextEditorTableInsertControl") return tableInsertNode(context, item, position)
  if (item._tag === "RichTextEditorImageUploadControl") return imageUploadNode(context, item, position)

  return controlNode(context, item, position)
}

const groupNode = <M>(context: Context<M>, group: RichTextEditorControlsGroup<M>): Html =>
  context.h.div(
    [...context.getStyles("controlsGroup", styles.group), context.h.DataAttribute("variant", context.variant)],
    group.children.map((item, index) =>
      groupItemNode(context, item, { first: index === 0, last: index === group.children.length - 1 })
    )
  )

const toolbarNode = <M>(context: Context<M>, toolbar: RichTextEditorToolbar<M>): Html =>
  context.h.div(
    [
      ...context.getStyles(
        "toolbar",
        styles.toolbar,
        context.variant === "subtle" ? styles.toolbarSubtle : styles.toolbarDefault,
        toolbar.sticky === true && styles.sticky,
        setStyle(["top", sizeValue(toolbar.stickyOffset ?? 0)])
      ),
      context.h.Role("toolbar"),
      context.h.DataAttribute("variant", context.variant),
      ...(toolbar.sticky === true ? [context.h.DataAttribute("sticky", "")] : [])
    ],
    toolbar.children.map((item) =>
      item._tag === "RichTextEditorControlsGroup" ? groupNode(context, item) : groupItemNode(context, item, undefined)
    )
  )

const contentNode = <M>(context: Context<M>): Html =>
  context.h.div(
    [
      ...context.getStyles("content", styles.content),
      context.h.Id(contentId(context.props.model.id)),
      context.h.OnMount(
        Mount.mapMessage(
          context.props.editor.Mount({ content: context.props.model.content }),
          context.props.toParentMessage
        )
      )
    ],
    []
  )

const hasStickyToolbar = <M>(slot: RichTextEditorSlot<M>): boolean =>
  slot._tag === "RichTextEditorToolbar" && slot.sticky === true

export const RichTextEditor = (config: RichTextEditorComponents) => {
  const parts = {
    popover: Popover(config),
    textInput: TextInput(config),
    button: Button(config),
    actionIcon: ActionIcon(config),
    colorPicker: ColorPicker(config),
    colorSwatch: ColorSwatch(config),
    group: Group(config),
    simpleGrid: SimpleGrid(config)
  }

  return <M>(h: HtmlBuilder<M>, input: RichTextEditorProps<M>): Html => {
    const props = withDefaults(config.RichTextEditor, input)
    const getStyles = stylesApi<M, RichTextEditorPart>(h, props, config.RichTextEditor, "root")
    const variant = props.variant ?? "default"
    const context: Context<M> = { h, parts, props, getStyles, labels: richTextEditorLabels(props.labels), variant }

    return h.div(
      [
        ...getStyles("root", styles.root, props.children.some(hasStickyToolbar) && styles.clipped),
        h.DataAttribute("variant", variant)
      ],
      props.children.map((slot) =>
        slot._tag === "RichTextEditorToolbar" ? toolbarNode(context, slot) : contentNode(context)
      )
    )
  }
}
