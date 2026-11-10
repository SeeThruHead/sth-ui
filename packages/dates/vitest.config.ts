import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "dates-logic",
  include: ["src/**/*.test.ts"],
  covered: [
    "src/date/date.ts",
    "src/Calendar/keys.ts",
    "src/Calendar/model.ts",
    "src/Calendar/levels.ts",
    "src/picker/selection.ts",
    "src/picker/model.ts",
    "src/picker/inputModel.ts",
    "src/picker/format.ts",
    "src/date/parse.ts",
    "src/DateInput/model.ts",
    "src/time/time.ts",
    "src/time/clock.ts",
    "src/time/spin.ts",
    "src/TimePicker/model.ts",
    "src/time/datetime.ts",
    "src/InlineDateTimePicker/model.ts",
    "src/DateTimePicker/model.ts",
    "src/time/grid.ts"
  ],
  reportsDirectory: "coverage/logic"
})
