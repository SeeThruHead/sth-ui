import { Schema } from "effect"

export const EventId = Schema.Union([Schema.String, Schema.Finite])
export type EventId = typeof EventId.Type

export const Recurrence = Schema.Struct({
  rrule: Schema.String,
  exdate: Schema.optional(Schema.Array(Schema.String)),
  dtstart: Schema.optional(Schema.String)
})
export type Recurrence = typeof Recurrence.Type

export const RecurringInstance = Schema.Struct({
  isRecurringInstance: Schema.Boolean,
  recurringEventId: EventId,
  recurrenceId: Schema.String,
  originalStart: Schema.String,
  originalEnd: Schema.String
})
export type RecurringInstance = typeof RecurringInstance.Type

export const ScheduleEvent = Schema.Struct({
  id: EventId,
  title: Schema.String,
  start: Schema.String,
  end: Schema.String,
  color: Schema.String,
  variant: Schema.optional(Schema.Literals(["filled", "light"])),
  display: Schema.optional(Schema.Literals(["default", "background"])),
  payload: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  resourceId: Schema.optional(EventId),
  recurrence: Schema.optional(Recurrence),
  recurringEventId: Schema.optional(EventId),
  recurrenceId: Schema.optional(Schema.String),
  recurringInstance: Schema.optional(RecurringInstance)
})
export type ScheduleEvent = typeof ScheduleEvent.Type

export const ScheduleResource = Schema.Struct({
  id: EventId,
  label: Schema.String,
  color: Schema.optional(Schema.String),
  payload: Schema.optional(Schema.Record(Schema.String, Schema.Unknown))
})
export type ScheduleResource = typeof ScheduleResource.Type

export const ScheduleResourceGroup = Schema.Struct({ label: Schema.String, resourceIds: Schema.Array(EventId) })
export type ScheduleResourceGroup = typeof ScheduleResourceGroup.Type

export type ScheduleViewLevel = "day" | "week" | "month" | "year"
