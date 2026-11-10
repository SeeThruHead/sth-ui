import { isEventsOverlap } from "./dayLayout.ts"
import { timeOf } from "./datetime.ts"
import type { DateTimeString } from "./datetime.ts"
import type { EventId, ScheduleEvent } from "./events.ts"

export type PreventEventOverlap = boolean | ((stillEvent: ScheduleEvent, movingEvent: ScheduleEvent) => boolean)

export type PlacementRejection = "overlap" | "rejected"

export type Placement =
  | { readonly valid: true; readonly conflicts: ReadonlyArray<ScheduleEvent>; readonly reason: null }
  | { readonly valid: false; readonly conflicts: ReadonlyArray<ScheduleEvent>; readonly reason: PlacementRejection }

export type PlacementInput = {
  readonly event: ScheduleEvent
  readonly start: DateTimeString
  readonly end: DateTimeString
  readonly events: ReadonlyArray<ScheduleEvent>
  readonly preventEventOverlap?: PreventEventOverlap
  readonly resourceId?: EventId
}

const seriesOf = (event: ScheduleEvent) => event.recurringEventId ?? event.recurringInstance?.recurringEventId

const occurrenceOf = (event: ScheduleEvent) => event.recurrenceId ?? event.recurringInstance?.recurrenceId

const isSameEvent = (event: ScheduleEvent, other: ScheduleEvent): boolean => {
  if (event.id === other.id) return true
  const series = seriesOf(event)
  if (series === undefined) return false
  if (series !== seriesOf(other)) return false
  const occurrence = occurrenceOf(event)
  if (occurrence === undefined) return false

  return occurrence === occurrenceOf(other)
}

const spansWholeDays = (event: ScheduleEvent): boolean => {
  if (timeOf(event.start) !== "00:00:00") return false
  const end = timeOf(event.end)

  return end === "00:00:00" || end === "23:59:59"
}

const isConflict = (input: PlacementInput, candidate: ScheduleEvent) => (other: ScheduleEvent) => {
  if (other.display === "background") return false
  if (isSameEvent(input.event, other)) return false
  if (input.resourceId !== undefined && other.resourceId !== input.resourceId) return false
  if (spansWholeDays(other) !== spansWholeDays(candidate)) return false
  if (!isEventsOverlap(other, candidate)) return false

  return typeof input.preventEventOverlap === "function" ? input.preventEventOverlap(other, candidate) : true
}

export const eventPlacementConflicts = (input: PlacementInput): ReadonlyArray<ScheduleEvent> => {
  if (input.preventEventOverlap === undefined || input.preventEventOverlap === false) return []
  const candidate: ScheduleEvent = {
    ...input.event,
    start: input.start,
    end: input.end,
    ...(input.resourceId === undefined ? {} : { resourceId: input.resourceId })
  }

  return input.events.filter(isConflict(input, candidate))
}

export const validatePlacement = (input: PlacementInput & { readonly allow?: () => boolean }): Placement => {
  const conflicts = eventPlacementConflicts(input)
  if (conflicts.length > 0) return { valid: false, conflicts, reason: "overlap" }
  if (input.allow !== undefined && !input.allow()) return { valid: false, conflicts: [], reason: "rejected" }

  return { valid: true, conflicts: [], reason: null }
}
