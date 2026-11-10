import * as stylex from "@stylexjs/stylex"
import type { Components } from "@sth-ui/core/Ui.ts"
import type { Child } from "@sth-ui/core/content.ts"
import { ActionIcon } from "@sth-ui/core/components/ActionIcon/ActionIcon.ts"
import { Button } from "@sth-ui/core/components/Button/Button.ts"
import { Checkbox } from "@sth-ui/core/components/Checkbox/Checkbox.ts"
import { TextInput } from "@sth-ui/core/components/Input/InputBase.ts"
import { Popover } from "@sth-ui/core/components/Popover/Popover.ts"
import { Table } from "@sth-ui/core/components/Table/Table.ts"
import type { TableBuilder, TableCell, TableRow } from "@sth-ui/core/components/Table/Table.ts"
import { tableVars } from "@sth-ui/core/components/Table/Table.stylex.ts"
import { stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { accent, colors, fontSize, fontWeight, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { CaretDownIcon } from "@sth-ui/icons/icons/CaretDownIcon.ts"
import { CaretUpDownIcon } from "@sth-ui/icons/icons/CaretUpDownIcon.ts"
import { CaretUpIcon } from "@sth-ui/icons/icons/CaretUpIcon.ts"
import { ColumnsIcon } from "@sth-ui/icons/icons/ColumnsIcon.ts"
import { FunnelIcon } from "@sth-ui/icons/icons/FunnelIcon.ts"
import { MagnifyingGlassIcon } from "@sth-ui/icons/icons/MagnifyingGlassIcon.ts"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import { filterView } from "./filters.ts"
import { columnsMenuMessage, filterMenuMessage, Message, rowElementId, rowHeightOf, scrollId } from "./model.ts"
import type { Model } from "./model.ts"
import { cellText, filterIsActive, queryRows, rowWindow } from "./rows.ts"
import type { ColumnData, SearchText } from "./rows.ts"
import { WatchDataTable } from "./watch.ts"

export {
  filterMenuId,
  init,
  Message,
  Model,
  OutMessage,
  refresh,
  rowElementId,
  rowHeightOf,
  scrollId,
  Settings,
  settingsOf,
  update
} from "./model.ts"
export type { DataTableContext, InitConfig, Result } from "./model.ts"
export {
  cellText,
  compareValues,
  filterIsActive,
  FilterValue,
  matchesFilter,
  matchesSearch,
  Sort,
  SortDirection
} from "./rows.ts"
export type { CellValue, ColumnData, FilterKind, FilterOption, Query, SearchText } from "./rows.ts"

export type DataTableColumn<Row> = ColumnData<Row> & {
  readonly title: string
  readonly render?: (row: Row) => Child
  readonly width?: number | string
  readonly align?: "start" | "center" | "end"
  readonly hideable?: boolean
}

export type DataTablePart = "root" | "toolbar" | "bulkBar" | "scroll" | "empty"

export type DataTableOptions = {
  readonly height?: number | string
  readonly withSearch?: boolean
  readonly withSelection?: boolean
  readonly withColumnPicker?: boolean
  readonly striped?: boolean
  readonly highlightOnHover?: boolean
  readonly overscan?: number
  readonly searchPlaceholder?: string
}

export type DataTableProps<Row, M> = DataTableOptions &
  StylesApiProps<DataTablePart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly rows: ReadonlyArray<Row>
    readonly columns: ReadonlyArray<DataTableColumn<Row>>
    readonly rowId: (row: Row) => string
    readonly ariaLabel: string
    readonly rowLabel?: (row: Row) => string
    readonly searchText?: SearchText<Row>
    readonly toolbar?: ReadonlyArray<Child>
    readonly bulkActions?: (selected: ReadonlyArray<string>) => ReadonlyArray<Child>
    readonly emptyState?: Child
  }

export type DataTableConfig = ComponentConfig<DataTableOptions, DataTablePart>

export const visibleRows = <Row>(
  model: Model,
  rows: ReadonlyArray<Row>,
  columns: ReadonlyArray<ColumnData<Row>>,
  searchText?: SearchText<Row>
): ReadonlyArray<Row> => queryRows(model, rows, columns, searchText)

export const selectedRows = <Row>(
  model: Model,
  rows: ReadonlyArray<Row>,
  rowId: (row: Row) => string
): ReadonlyArray<Row> => rows.filter((row) => model.selected.includes(rowId(row)))

const styles = stylex.create({
  root: { display: "flex", flexDirection: "column", gap: space.xs, minWidth: 0 },
  toolbar: { display: "flex", alignItems: "center", gap: space.xs, flexWrap: "wrap" },
  search: { flexGrow: 1, flexBasis: "200px", maxWidth: "360px" },
  grow: { flexGrow: 1 },
  bulkBar: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    flexWrap: "wrap",
    paddingBlock: space.xs,
    paddingInline: space.sm,
    borderRadius: space.xs,
    backgroundColor: accent.light,
    color: accent.lightColor,
    fontSize: fontSize.sm
  },
  count: { fontWeight: fontWeight.medium, marginInlineEnd: space.xs },
  scroll: {
    overflow: "auto",
    position: "relative",
    outline: "none",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: tableVars.borderColor,
    borderRadius: space.xs
  },
  header: { display: "flex", alignItems: "center", gap: "4px", minWidth: 0 },
  sort: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    minWidth: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "inherit",
    font: "inherit",
    fontWeight: fontWeight.bold,
    cursor: "pointer",
    outline: { default: "none", ":focus-visible": `2px solid ${accent.outline}` }
  },
  sortIcon: { flexShrink: 0, color: colors.dimmed },
  sortIconActive: { color: accent.text },
  title: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cell: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingBlock: 0 },
  start: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  end: { justifyContent: "flex-end" },
  empty: { textAlign: "center", color: colors.dimmed, paddingBlock: space.xl },
  menu: { display: "flex", flexDirection: "column", gap: space.xs }
})

const alignment = { start: styles.start, center: styles.center, end: styles.end }

const lengthOf = (value: number | string): string => (typeof value === "number" ? `${value}px` : value)

type Selection = { readonly all: boolean; readonly some: boolean }

const selectionOf = (model: Model): Selection => {
  const matched = model.order.filter((id) => model.selected.includes(id)).length

  return { all: matched > 0 && matched === model.order.length, some: matched > 0 }
}

const ariaSort = (model: Model, column: string): string => {
  if (model.sort?.column !== column) return "none"

  return model.sort.direction === "asc" ? "ascending" : "descending"
}

const rowBackground = (selected: boolean, striped: boolean) => {
  if (selected) return { backgroundColor: accent.light }

  return striped ? { backgroundColor: tableVars.stripedColor } : {}
}

const sortIcon = (model: Model, column: string) => {
  if (model.sort?.column !== column) return CaretUpDownIcon

  return model.sort.direction === "asc" ? CaretUpIcon : CaretDownIcon
}

const rowStyle = (height: number, selected: boolean, striped: boolean, ring: boolean) => ({
  height: `${height}px`,
  ...rowBackground(selected, striped),
  ...(ring ? { outline: `2px solid ${accent.outline}`, outlineOffset: "-2px" } : {}),
  cursor: "pointer"
})

const spacer =
  <M>(h: HtmlBuilder<M>, height: number, columns: number): TableRow =>
  () =>
    h.tr(
      [h.AriaHidden(true), h.Style({ height: `${height}px` })],
      [h.td([h.Attribute("colspan", String(columns)), h.Style({ padding: "0", border: "0" })], [])]
    )

export const DataTable = (components: Components & { readonly DataTable?: DataTableConfig }) => {
  const table = Table(components)
  const checkbox = Checkbox(components)
  const actionIcon = ActionIcon(components)
  const button = Button(components)
  const textInput = TextInput(components)
  const popover = Popover(components)
  const filter = filterView(components)

  return <Row, M>(h: HtmlBuilder<M>, input: DataTableProps<Row, M>): Html => {
    const props = withDefaults(components.DataTable, input)
    const getStyles = stylesApi<M, DataTablePart>(h, props, components.DataTable, "root")
    const { model } = props
    const lift = props.toParentMessage
    const withSelection = props.withSelection !== false
    const shown = props.columns.filter((column) => !model.hidden.includes(column.id))
    const columnCount = shown.length + (withSelection ? 1 : 0)
    const height = rowHeightOf(model)
    const selection = selectionOf(model)
    const byId = new Map(props.rows.map((row) => [props.rowId(row), row]))
    const ordered = model.order.flatMap((id) => Option.toArray(Option.fromNullishOr(byId.get(id))))
    const firstVisible = Math.floor(model.scrollTop / height)
    const inView = Math.ceil(model.viewportHeight / height) + 1
    const slice = rowWindow(ordered.length, height, firstVisible, inView, props.overscan ?? 8)
    const labelOf = (row: Row) => (props.rowLabel === undefined ? props.rowId(row) : props.rowLabel(row))

    const sortButton = (column: DataTableColumn<Row>): Html => {
      const sorted = model.sort?.column === column.id
      const icon = sortIcon(model, column.id)

      return h.button(
        [...sx(h, styles.sort), h.Type("button"), h.OnClick(lift(Message.ClickedSort({ column: column.id })))],
        [
          h.span(sx(h, styles.title), [column.title]),
          h.span(sx(h, styles.sortIcon, sorted && styles.sortIconActive), [icon(h, { size: 14 })])
        ]
      )
    }

    const filterButton = (column: DataTableColumn<Row>): ReadonlyArray<Html> => {
      const menu = model.filterMenus[column.id]
      if (column.filter === undefined || menu === undefined) return []
      const value = model.filters[column.id]
      const active = value !== undefined && filterIsActive(value)

      return [
        popover(h, {
          model: menu,
          toParentMessage: (message) => lift(filterMenuMessage(column.id)(message)),
          width: 240,
          position: "bottom-start",
          focusSelector: "input, button[role=checkbox], button",
          shadow: "md",
          target: (bind) =>
            actionIcon(h, {
              bind,
              size: "sm",
              variant: active ? "light" : "subtle",
              ...(active ? {} : { color: "gray" }),
              label: `Filter ${column.title}`,
              children: [FunnelIcon(h, { size: 14, weight: active ? "fill" : "regular" })]
            }),
          children: [
            filter(h, { id: model.id, column: column.id, title: column.title, kind: column.filter, value, lift })
          ]
        })
      ]
    }

    const headerCell = (t: TableBuilder<M>, column: DataTableColumn<Row>): TableCell =>
      t.th(
        [
          h.div(sx(h, styles.header, column.align === undefined ? null : alignment[column.align]), [
            column.sortable === true ? sortButton(column) : h.span(sx(h, styles.title), [column.title]),
            ...filterButton(column)
          ])
        ],
        {
          ...(column.width === undefined ? {} : { w: column.width }),
          attributes: column.sortable === true ? [h.AriaSort(ariaSort(model, column.id))] : []
        }
      )

    const selectAllCell = (t: TableBuilder<M>): TableCell =>
      t.th(
        [
          checkbox(h, {
            id: `${model.id}-select-all`,
            size: "xs",
            checked: selection.all,
            indeterminate: selection.some && !selection.all,
            disabled: ordered.length === 0,
            attributes: { input: { "aria-label": "Select all rows" } },
            onChange: (checked) => lift(Message.ToggledAll({ checked }))
          })
        ],
        { w: 40 }
      )

    const selectCell = (t: TableBuilder<M>, row: Row, id: string, selected: boolean): TableCell =>
      t.td(
        [
          checkbox(h, {
            id: `${rowElementId(model.id, id)}-select`,
            size: "xs",
            checked: selected,
            attributes: { input: { "aria-label": `Select ${labelOf(row)}` } },
            onChange: (checked) => lift(Message.ToggledRow({ id, checked }))
          })
        ],
        { attributes: [h.OnClick(lift(Message.ClickedCheckboxCell()), { propagation: "Stop" })] }
      )

    const dataCell = (t: TableBuilder<M>, row: Row, column: DataTableColumn<Row>): TableCell =>
      t.td([column.render === undefined ? cellText(column.value?.(row)) : column.render(row)], {
        attributes: column.align === undefined ? [] : [h.Style({ textAlign: column.align })]
      })

    const bodyRow = (t: TableBuilder<M>, row: Row, index: number): TableRow => {
      const id = props.rowId(row)
      const selected = model.selected.includes(id)
      const ring = model.focused && model.active === id

      return t.tr(
        [
          ...(withSelection ? [selectCell(t, row, id, selected)] : []),
          ...shown.map((column) => dataCell(t, row, column))
        ],
        {
          attributes: [
            h.Id(rowElementId(model.id, id)),
            h.DataAttribute("row-id", id),
            h.Attribute("aria-rowindex", String(index + 2)),
            ...(selected ? [h.DataAttribute("selected", "")] : []),
            ...(model.active === id ? [h.DataAttribute("active", "")] : []),
            h.Style(rowStyle(height, selected, props.striped === true && index % 2 === 1, ring)),
            h.OnClick(lift(Message.ClickedRow({ id })))
          ]
        }
      )
    }

    const emptyRow = (t: TableBuilder<M>): TableRow =>
      t.tr([
        t.td([h.div(getStyles("empty", styles.empty), [props.emptyState ?? "No rows to show"])], {
          colSpan: columnCount
        })
      ])

    const bodyRows = (t: TableBuilder<M>): ReadonlyArray<TableRow> => {
      if (ordered.length === 0) return [emptyRow(t)]
      const rows = ordered.slice(slice.start, slice.end).map((row, offset) => bodyRow(t, row, slice.start + offset))

      return [
        ...(slice.before > 0 ? [spacer(h, slice.before, columnCount)] : []),
        ...rows,
        ...(slice.after > 0 ? [spacer(h, slice.after, columnCount)] : [])
      ]
    }

    const columnPicker = (): ReadonlyArray<Html> => {
      if (props.withColumnPicker === false) return []
      const hideable = props.columns.filter((column) => column.hideable !== false)

      return [
        popover(h, {
          model: model.columnsMenu,
          toParentMessage: (message) => lift(columnsMenuMessage(message)),
          width: 220,
          position: "bottom-end",
          shadow: "md",
          target: (bind) =>
            actionIcon(h, {
              bind,
              size: "lg",
              variant: "default",
              label: "Choose columns",
              children: [ColumnsIcon(h, { size: 18 })]
            }),
          children: [
            h.div(
              [...sx(h, styles.menu), h.Role("group"), h.AriaLabel("Columns")],
              hideable.map((column) =>
                checkbox(h, {
                  id: `${model.id}-column-${column.id}`,
                  size: "xs",
                  label: column.title,
                  checked: !model.hidden.includes(column.id),
                  onChange: (visible) => lift(Message.ToggledColumn({ column: column.id, visible }))
                })
              )
            )
          ]
        })
      ]
    }

    const search = (): ReadonlyArray<Html> =>
      props.withSearch === false
        ? []
        : [
            h.div(sx(h, styles.search), [
              textInput(h, {
                id: `${model.id}-search`,
                type: "search",
                value: model.search,
                placeholder: props.searchPlaceholder ?? "Search",
                leftSection: MagnifyingGlassIcon(h, { size: 16 }),
                attributes: { input: { "aria-label": props.searchPlaceholder ?? "Search" } },
                onInput: (next) => lift(Message.ChangedSearch({ search: next }))
              })
            ])
          ]

    const bulkBar = (): ReadonlyArray<Html> => {
      if (!withSelection || model.selected.length === 0) return []

      return [
        h.keyed("div")(
          "bulk",
          [...getStyles("bulkBar", styles.bulkBar), h.Role("toolbar"), h.AriaLabel("Selected rows")],
          [
            h.span(
              [...sx(h, styles.count), h.AriaLive("polite")],
              [`${model.selected.length.toLocaleString()} selected`]
            ),
            ...(selection.all
              ? []
              : [
                  button(h, {
                    size: "compact-sm",
                    variant: "subtle",
                    onClick: lift(Message.SelectedAll()),
                    children: [`Select all ${model.order.length.toLocaleString()}`]
                  })
                ]),
            button(h, {
              size: "compact-sm",
              variant: "subtle",
              onClick: lift(Message.ClearedSelection()),
              children: ["Clear selection"]
            }),
            h.span(sx(h, styles.grow), []),
            ...(props.bulkActions?.(model.selected) ?? [])
          ]
        )
      ]
    }

    const keyMessage = (key: string, modifiers: { readonly shiftKey: boolean }): Option.Option<M> =>
      handledKeys.has(key) ? Option.some(lift(Message.PressedKey({ key, shift: modifiers.shiftKey }))) : Option.none()

    return h.div(getStyles("root", styles.root), [
      h.keyed("div")("toolbar", getStyles("toolbar", styles.toolbar), [
        ...search(),
        h.div(sx(h, styles.grow), props.toolbar ?? []),
        ...columnPicker()
      ]),
      ...bulkBar(),
      h.keyed("div")(
        "scroll",
        [
          ...getStyles("scroll", styles.scroll),
          h.Id(scrollId(model.id)),
          h.Role("group"),
          h.AriaLabel(props.ariaLabel),
          h.Tabindex(0),
          ...(model.active === null ? [] : [h.AriaActiveDescendant(rowElementId(model.id, model.active))]),
          h.Style({ height: lengthOf(props.height ?? 480) }),
          h.OnScroll((scrollTop) => lift(Message.Scrolled({ scrollTop }))),
          h.OnFocus(lift(Message.FocusedRows())),
          h.OnBlur(lift(Message.BlurredRows())),
          h.OnKeyDownSelfPreventDefault(keyMessage),
          h.OnMount(Mount.mapMessage(WatchDataTable(), lift))
        ],
        [
          table(h, {
            layout: "fixed",
            stickyHeader: true,
            verticalSpacing: 0,
            highlightOnHover: props.highlightOnHover !== false,
            styles: { td: styles.cell },
            attributes: {
              table: {
                "aria-label": props.ariaLabel,
                "aria-rowcount": String(ordered.length + 1),
                ...(withSelection ? { "aria-multiselectable": "true" } : {})
              }
            },
            children: (t) => [
              t.thead([
                t.tr([...(withSelection ? [selectAllCell(t)] : []), ...shown.map((column) => headerCell(t, column))], {
                  attributes: [h.Attribute("aria-rowindex", "1"), h.Style({ height: `${height}px` })]
                })
              ]),
              t.tbody(bodyRows(t))
            ]
          })
        ]
      )
    ])
  }
}

const handledKeys: ReadonlySet<string> = new Set([
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "PageDown",
  "PageUp",
  "Enter",
  " "
])

export const dataTable = DataTable({})
