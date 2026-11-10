import * as Popover from "@foldkit/ui/popover"
import { Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import { ScrollTo } from "./commands.ts"
import { FilterValue, filterIsActive, nextSort, queryRows, Sort } from "./rows.ts"
import type { ColumnData, SearchText } from "./rows.ts"

export const Settings = Schema.Struct({ sort: Schema.NullOr(Sort), hidden: Schema.Array(Schema.String) })
export type Settings = typeof Settings.Type

export const Model = Schema.Struct({
  id: Schema.String,
  rowHeightPx: Schema.Finite,
  coarseRowHeightPx: Schema.Finite,
  coarse: Schema.Boolean,
  sort: Schema.NullOr(Sort),
  search: Schema.String,
  filters: Schema.Record(Schema.String, FilterValue),
  hidden: Schema.Array(Schema.String),
  selected: Schema.Array(Schema.String),
  anchor: Schema.NullOr(Schema.String),
  active: Schema.NullOr(Schema.String),
  focused: Schema.Boolean,
  order: Schema.Array(Schema.String),
  scrollTop: Schema.Finite,
  viewportHeight: Schema.Finite,
  shift: Schema.Boolean,
  filterMenus: Schema.Record(Schema.String, Popover.Model),
  columnsMenu: Popover.Model
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  ClickedSort: { column: Schema.String },
  ChangedSearch: { search: Schema.String },
  ChangedFilter: { column: Schema.String, filter: FilterValue },
  ClearedFilter: { column: Schema.String },
  ClearedFilters: {},
  ToggledColumn: { column: Schema.String, visible: Schema.Boolean },
  ChangedShift: { shift: Schema.Boolean },
  ToggledRow: { id: Schema.String, checked: Schema.Boolean },
  ToggledAll: { checked: Schema.Boolean },
  SelectedAll: {},
  ClearedSelection: {},
  ClickedRow: { id: Schema.String },
  FocusedRows: {},
  BlurredRows: {},
  ClickedCheckboxCell: {},
  PressedKey: { key: Schema.String, shift: Schema.Boolean },
  Scrolled: { scrollTop: Schema.Finite },
  Measured: { viewportHeight: Schema.Finite, coarse: Schema.Boolean },
  CompletedScroll: {},
  GotFilterMenu: { column: Schema.String, message: Popover.Message },
  GotColumnsMenu: { message: Popover.Message }
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  RowActivated: { id: Schema.String },
  SelectionChanged: { selected: Schema.Array(Schema.String) },
  SettingsChanged: { settings: Settings }
})
export type OutMessage = typeof OutMessage.Type

export const filterMenuMessage =
  (column: string) =>
  (message: Popover.Message): Message =>
    Message.GotFilterMenu({ column, message })

export const columnsMenuMessage = (message: Popover.Message): Message => Message.GotColumnsMenu({ message })

export type DataTableContext<Row> = {
  readonly rows: ReadonlyArray<Row>
  readonly columns: ReadonlyArray<ColumnData<Row>>
  readonly rowId: (row: Row) => string
  readonly searchText?: SearchText<Row>
}

export type InitConfig = {
  readonly id: string
  readonly rowHeightPx?: number
  readonly coarseRowHeightPx?: number
  readonly viewportHeight?: number
  readonly sort?: Sort | null
  readonly hidden?: ReadonlyArray<string>
  readonly selected?: ReadonlyArray<string>
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const scrollId = (id: string): string => `${id}-scroll`

export const rowElementId = (id: string, row: string): string => `${id}-row-${row}`

export const filterMenuId = (id: string, column: string): string => `${id}-filter-${column}`

export const settingsOf = (model: Model): Settings => ({ sort: model.sort, hidden: model.hidden })

export const rowHeightOf = (model: Model): number => (model.coarse ? model.coarseRowHeightPx : model.rowHeightPx)

const orderOf = <Row>(model: Pick<Model, "sort" | "search" | "filters">, context: DataTableContext<Row>) =>
  queryRows(model, context.rows, context.columns, context.searchText).map(context.rowId)

const filterable = <Row>(context: DataTableContext<Row>): ReadonlyArray<string> =>
  context.columns.flatMap((column) => (column.filter === undefined ? [] : [column.id]))

export const init = <Row>(config: InitConfig, context: DataTableContext<Row>): Model => {
  const query = { sort: config.sort ?? null, search: "", filters: {} }

  return {
    id: config.id,
    rowHeightPx: config.rowHeightPx ?? 36,
    coarseRowHeightPx: config.coarseRowHeightPx ?? 44,
    coarse: false,
    ...query,
    hidden: config.hidden ?? [],
    selected: config.selected ?? [],
    anchor: null,
    active: null,
    focused: false,
    order: orderOf(query, context),
    scrollTop: 0,
    viewportHeight: config.viewportHeight ?? 480,
    shift: false,
    filterMenus: Object.fromEntries(
      filterable(context).map((column) => [
        column,
        Popover.init({ id: filterMenuId(config.id, column), isAnimated: true })
      ])
    ),
    columnsMenu: Popover.init({ id: `${config.id}-columns`, isAnimated: true })
  }
}

export const refresh = <Row>(model: Model, context: DataTableContext<Row>): Model => ({
  ...model,
  order: orderOf(model, context)
})

const done = (model: Model, outMessages: ReadonlyArray<OutMessage> = []): Result => ({
  model,
  commands: [],
  outMessages
})

const scrolled = (model: Model, top: number, outMessages: ReadonlyArray<OutMessage> = []): Result => ({
  model: { ...model, scrollTop: top },
  commands: [Command.mapMessage(ScrollTo({ container: scrollId(model.id), top }), () => Message.CompletedScroll())],
  outMessages
})

const requeried = <Row>(model: Model, context: DataTableContext<Row>): Result =>
  scrolled({ ...model, order: orderOf(model, context) }, 0)

const withFilter = (filters: Readonly<Record<string, FilterValue>>, column: string, filter: FilterValue) => {
  const rest = Object.fromEntries(Object.entries(filters).filter(([id]) => id !== column))

  return filterIsActive(filter) ? { ...rest, [column]: filter } : rest
}

const settingsChanged = (model: Model): Result =>
  done(model, [OutMessage.SettingsChanged({ settings: settingsOf(model) })])

const selectionChanged = (model: Model, selected: ReadonlyArray<string>, anchor: string | null): Result =>
  done({ ...model, selected, anchor }, [OutMessage.SelectionChanged({ selected })])

const rangeOf = (order: ReadonlyArray<string>, from: string, to: string): ReadonlyArray<string> => {
  const start = order.indexOf(from)
  const end = order.indexOf(to)
  if (start === -1 || end === -1) return [to]

  return order.slice(Math.min(start, end), Math.max(start, end) + 1)
}

const including = (selected: ReadonlyArray<string>, ids: ReadonlyArray<string>) => [
  ...selected,
  ...ids.filter((id) => !selected.includes(id))
]

const excluding = (selected: ReadonlyArray<string>, ids: ReadonlyArray<string>) =>
  selected.filter((id) => !ids.includes(id))

const setSelected = (selected: ReadonlyArray<string>, ids: ReadonlyArray<string>, checked: boolean) =>
  checked ? including(selected, ids) : excluding(selected, ids)

const toggledRow = (model: Model, id: string, checked: boolean): Result => {
  const ids = model.shift && model.anchor !== null ? rangeOf(model.order, model.anchor, id) : [id]

  return selectionChanged(model, setSelected(model.selected, ids, checked), id)
}

const toggled = (model: Model, id: string): Result =>
  toggledRow({ ...model, shift: false }, id, !model.selected.includes(id))

const rowsInView = (model: Model): number => Math.max(1, Math.floor(model.viewportHeight / rowHeightOf(model)) - 1)

const keySteps: Readonly<Record<string, (index: number, model: Model) => number>> = {
  ArrowDown: (index) => index + 1,
  ArrowUp: (index) => index - 1,
  Home: () => 0,
  End: (_, model) => model.order.length - 1,
  PageDown: (index, model) => index + rowsInView(model),
  PageUp: (index, model) => index - rowsInView(model)
}

const revealTop = (model: Model, index: number): number => {
  const height = rowHeightOf(model)
  const top = index * height
  const area = model.viewportHeight - height
  if (top < model.scrollTop) return top

  return top + height > model.scrollTop + area ? top + height - area : model.scrollTop
}

const extended = (model: Model, from: string, to: string): ReadonlyArray<string> =>
  including(model.selected, rangeOf(model.order, model.anchor ?? from, to))

const moved = (model: Model, step: (index: number, model: Model) => number, shift: boolean): Result => {
  const current = model.active === null ? -1 : model.order.indexOf(model.active)
  const index = Math.min(Math.max(step(current, model), 0), model.order.length - 1)
  const target = model.order[index]
  if (target === undefined) return done(model)
  const from = model.active ?? target
  const selection = shift ? { selected: extended(model, from, target), anchor: model.anchor ?? from } : {}
  const next = { ...model, ...selection, active: target }
  const outMessages = shift ? [OutMessage.SelectionChanged({ selected: next.selected })] : []
  const top = revealTop(next, index)

  return top === model.scrollTop ? done(next, outMessages) : scrolled(next, top, outMessages)
}

const pressedKey = (model: Model, key: string, shift: boolean): Result => {
  const step = keySteps[key]
  if (step !== undefined) return moved(model, step, shift)
  if (model.active === null) return done(model)
  if (key === "Enter") return done(model, [OutMessage.RowActivated({ id: model.active })])

  return key === " " ? toggled(model, model.active) : done(model)
}

const liftPopover = (
  result: ReturnType<typeof Popover.update>,
  toMessage: (message: Popover.Message) => Message
): ReadonlyArray<Command.Command<Message>> =>
  (result.commands ?? []).map((command) => Command.mapMessage(command, toMessage))

const gotFilterMenu = (model: Model, column: string, message: Popover.Message): Result => {
  const menu = model.filterMenus[column]
  if (menu === undefined) return done(model)
  const result = Popover.update(menu, message)

  return {
    model: { ...model, filterMenus: { ...model.filterMenus, [column]: result.model } },
    commands: liftPopover(result, filterMenuMessage(column)),
    outMessages: []
  }
}

const gotColumnsMenu = (model: Model, message: Popover.Message): Result => {
  const result = Popover.update(model.columnsMenu, message)

  return {
    model: { ...model, columnsMenu: result.model },
    commands: liftPopover(result, columnsMenuMessage),
    outMessages: []
  }
}

export const update = <Row>(model: Model, message: Message, context: DataTableContext<Row>): Result =>
  Message.match(message, {
    ClickedSort: ({ column }) => {
      const sorted = { ...model, sort: nextSort(model.sort, column) }
      const result = requeried(sorted, context)

      return { ...result, outMessages: [OutMessage.SettingsChanged({ settings: settingsOf(sorted) })] }
    },
    ChangedSearch: ({ search }) => requeried({ ...model, search }, context),
    ChangedFilter: ({ column, filter }) =>
      requeried({ ...model, filters: withFilter(model.filters, column, filter) }, context),
    ClearedFilter: ({ column }) =>
      requeried({ ...model, filters: withFilter(model.filters, column, { _tag: "Options", values: [] }) }, context),
    ClearedFilters: () => requeried({ ...model, filters: {} }, context),
    ToggledColumn: ({ column, visible }) =>
      settingsChanged({
        ...model,
        hidden: visible ? model.hidden.filter((id) => id !== column) : [...model.hidden, column]
      }),
    ChangedShift: ({ shift }) => done({ ...model, shift }),
    ToggledRow: ({ id, checked }) => toggledRow({ ...model, active: id }, id, checked),
    ToggledAll: ({ checked }) => selectionChanged(model, setSelected(model.selected, model.order, checked), null),
    SelectedAll: () => selectionChanged(model, including(model.selected, model.order), null),
    ClearedSelection: () => selectionChanged(model, [], null),
    ClickedRow: ({ id }) => done({ ...model, active: id }, [OutMessage.RowActivated({ id })]),
    FocusedRows: () => done({ ...model, focused: true, active: model.active ?? model.order[0] ?? null }),
    BlurredRows: () => done({ ...model, focused: false }),
    ClickedCheckboxCell: () => done(model),
    PressedKey: ({ key, shift }) => pressedKey(model, key, shift),
    Scrolled: ({ scrollTop }) => done({ ...model, scrollTop }),
    Measured: ({ viewportHeight, coarse }) => done({ ...model, viewportHeight, coarse }),
    CompletedScroll: () => done(model),
    GotFilterMenu: ({ column, message: inner }) => gotFilterMenu(model, column, inner),
    GotColumnsMenu: ({ message: inner }) => gotColumnsMenu(model, inner)
  })
