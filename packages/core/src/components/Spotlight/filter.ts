import type { Child } from "../../content.ts"

export type SpotlightActionData = {
  readonly id: string
  readonly label?: string
  readonly description?: string
  readonly group?: string
  readonly keywords?: string | ReadonlyArray<string>
  readonly closeSpotlightOnTrigger?: boolean
  readonly leftSection?: Child
  readonly rightSection?: Child
  readonly dimmedSections?: boolean
  readonly highlightColor?: string
}

export type SpotlightActionGroupData = { readonly group: string; readonly actions: ReadonlyArray<SpotlightActionData> }

export type SpotlightActions = SpotlightActionData | SpotlightActionGroupData

export type SpotlightFilter = (
  query: string,
  actions: ReadonlyArray<SpotlightActions>
) => ReadonlyArray<SpotlightActions>

export const isActionsGroup = (item: SpotlightActions): item is SpotlightActionGroupData => "actions" in item

export const keywordsOf = (keywords: string | ReadonlyArray<string> | undefined): string => {
  if (keywords === undefined) return ""
  if (typeof keywords === "string") return keywords.toLowerCase().trim()

  return keywords
    .map((keyword) => keyword.trim())
    .join(",")
    .toLowerCase()
    .trim()
}

export const flatActions = (items: ReadonlyArray<SpotlightActions>): ReadonlyArray<SpotlightActionData> =>
  items.flatMap((item) =>
    isActionsGroup(item) ? item.actions.map((action) => ({ ...action, group: item.group })) : [item]
  )

const joined = (
  items: ReadonlyArray<SpotlightActions>,
  action: SpotlightActionData
): ReadonlyArray<SpotlightActions> => {
  const group = action.group
  if (group === undefined) return [...items, action]
  const index = items.findIndex((item) => isActionsGroup(item) && item.group === group)
  if (index === -1) return [...items, { group, actions: [action] }]

  return items.map((item, position) =>
    position === index && isActionsGroup(item) ? { group, actions: [...item.actions, action] } : item
  )
}

export const toGroups = (actions: ReadonlyArray<SpotlightActionData>): ReadonlyArray<SpotlightActions> =>
  actions.reduce<ReadonlyArray<SpotlightActions>>(joined, [])

const includes = (text: string | undefined, query: string) => text?.toLowerCase().includes(query) === true

const secondaryMatch = (action: SpotlightActionData, query: string) => {
  if (includes(action.label, query)) return false
  if (includes(action.description, query)) return true

  return keywordsOf(action.keywords).includes(query)
}

export const defaultFilter: SpotlightFilter = (raw, items) => {
  const query = raw.trim().toLowerCase()
  const actions = flatActions(items)
  const byLabel = actions.filter((action) => includes(action.label, query))
  const byRest = actions.filter((action) => secondaryMatch(action, query))

  return toGroups([...byLabel, ...byRest])
}

type Limited = { readonly items: ReadonlyArray<SpotlightActions>; readonly count: number }

const limitedBy =
  (limit: number) =>
  (state: Limited, item: SpotlightActions): Limited => {
    if (state.count >= limit) return state
    if (!isActionsGroup(item)) return { items: [...state.items, item], count: state.count + 1 }
    const actions = item.actions.slice(0, limit - state.count)

    return { items: [...state.items, { group: item.group, actions }], count: state.count + actions.length }
  }

export const limitActions = (items: ReadonlyArray<SpotlightActions>, limit: number): ReadonlyArray<SpotlightActions> =>
  items.reduce<Limited>(limitedBy(limit), { items: [], count: 0 }).items

export type SpotlightOptions = {
  readonly actions?: ReadonlyArray<SpotlightActions>
  readonly filter?: SpotlightFilter
  readonly limit?: number
}

export const shownActions = (query: string, options: SpotlightOptions): ReadonlyArray<SpotlightActions> =>
  limitActions((options.filter ?? defaultFilter)(query, options.actions ?? []), options.limit ?? Infinity)

export const orderedActions = (items: ReadonlyArray<SpotlightActions>): ReadonlyArray<SpotlightActionData> =>
  items.flatMap((item) => (isActionsGroup(item) ? item.actions : [item]))
