import { Day } from "./Day/Day.ts"
import type { DayConfig } from "./Day/Day.ts"
import { Month } from "./Month/Month.ts"
import type { MonthConfig } from "./Month/Month.ts"
import { Calendar } from "./Calendar/Calendar.ts"
import type { CalendarConfig } from "./Calendar/Calendar.ts"
import { CalendarHeader } from "./CalendarHeader/CalendarHeader.ts"
import type { CalendarHeaderConfig } from "./CalendarHeader/CalendarHeader.ts"
import { MonthsList } from "./MonthsList/MonthsList.ts"
import type { MonthsListConfig } from "./MonthsList/MonthsList.ts"
import { PickerControl } from "./PickerControl/PickerControl.ts"
import type { PickerControlConfig } from "./PickerControl/PickerControl.ts"
import { YearsList } from "./YearsList/YearsList.ts"
import type { YearsListConfig } from "./YearsList/YearsList.ts"
import { WeekdaysRow } from "./WeekdaysRow/WeekdaysRow.ts"
import type { WeekdaysRowConfig } from "./WeekdaysRow/WeekdaysRow.ts"
import { DatePicker } from "./DatePicker/DatePicker.ts"
import type { DatePickerConfig } from "./DatePicker/DatePicker.ts"
import { MonthPicker } from "./MonthPicker/MonthPicker.ts"
import type { MonthPickerConfig } from "./MonthPicker/MonthPicker.ts"
import { YearPicker } from "./YearPicker/YearPicker.ts"
import type { YearPickerConfig } from "./YearPicker/YearPicker.ts"
import { DatePickerInput } from "./DatePickerInput/DatePickerInput.ts"
import type { DatePickerInputConfig } from "./DatePickerInput/DatePickerInput.ts"
import { MonthPickerInput } from "./MonthPickerInput/MonthPickerInput.ts"
import type { MonthPickerInputConfig } from "./MonthPickerInput/MonthPickerInput.ts"
import { YearPickerInput } from "./YearPickerInput/YearPickerInput.ts"
import type { YearPickerInputConfig } from "./YearPickerInput/YearPickerInput.ts"
import { DateInput } from "./DateInput/DateInput.ts"
import type { DateInputConfig } from "./DateInput/DateInput.ts"
import { MiniCalendar } from "./MiniCalendar/MiniCalendar.ts"
import type { MiniCalendarConfig } from "./MiniCalendar/MiniCalendar.ts"
import { TimeInput } from "./TimeInput/TimeInput.ts"
import type { TimeInputConfig } from "./TimeInput/TimeInput.ts"
import { TimeValue } from "./TimeValue/TimeValue.ts"
import { TimePicker } from "./TimePicker/TimePicker.ts"
import type { TimePickerConfig } from "./TimePicker/TimePicker.ts"
import { InlineDateTimePicker } from "./InlineDateTimePicker/InlineDateTimePicker.ts"
import type { InlineDateTimePickerConfig } from "./InlineDateTimePicker/InlineDateTimePicker.ts"
import { DateTimePicker } from "./DateTimePicker/DateTimePicker.ts"
import type { DateTimePickerConfig } from "./DateTimePicker/DateTimePicker.ts"
import { TimeGrid } from "./TimeGrid/TimeGrid.ts"
import type { TimeGridConfig } from "./TimeGrid/TimeGrid.ts"

export type DatesComponents = {
  readonly Day?: DayConfig
  readonly WeekdaysRow?: WeekdaysRowConfig
  readonly Month?: MonthConfig
  readonly PickerControl?: PickerControlConfig
  readonly CalendarHeader?: CalendarHeaderConfig
  readonly MonthsList?: MonthsListConfig
  readonly YearsList?: YearsListConfig
  readonly Calendar?: CalendarConfig
  readonly DatePicker?: DatePickerConfig
  readonly MonthPicker?: MonthPickerConfig
  readonly YearPicker?: YearPickerConfig
  readonly DatePickerInput?: DatePickerInputConfig
  readonly MonthPickerInput?: MonthPickerInputConfig
  readonly YearPickerInput?: YearPickerInputConfig
  readonly DateInput?: DateInputConfig
  readonly MiniCalendar?: MiniCalendarConfig
  readonly TimeInput?: TimeInputConfig
  readonly TimePicker?: TimePickerConfig
  readonly InlineDateTimePicker?: InlineDateTimePickerConfig
  readonly DateTimePicker?: DateTimePickerConfig
  readonly TimeGrid?: TimeGridConfig
}

export type DatesConfig = { readonly components?: DatesComponents }

export const createDates = (config: DatesConfig = {}) => {
  const components = config.components ?? {}

  return {
    Day: Day(components),
    WeekdaysRow: WeekdaysRow(components),
    Month: Month(components),
    PickerControl: PickerControl(components),
    CalendarHeader: CalendarHeader(components),
    MonthsList: MonthsList(components),
    YearsList: YearsList(components),
    Calendar: Calendar(components),
    DatePicker: DatePicker(components),
    MonthPicker: MonthPicker(components),
    YearPicker: YearPicker(components),
    DatePickerInput: DatePickerInput(components),
    MonthPickerInput: MonthPickerInput(components),
    YearPickerInput: YearPickerInput(components),
    DateInput: DateInput(components),
    MiniCalendar: MiniCalendar(components),
    TimeInput: TimeInput(components),
    TimeValue: TimeValue(components),
    TimePicker: TimePicker(components),
    InlineDateTimePicker: InlineDateTimePicker(components),
    DateTimePicker: DateTimePicker(components),
    TimeGrid: TimeGrid(components)
  }
}

export type Dates = ReturnType<typeof createDates>

export const dates = createDates()
