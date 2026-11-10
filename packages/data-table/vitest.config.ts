import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "data-table-logic",
  include: ["src/**/*.test.ts"],
  covered: ["src/DataTable/model.ts", "src/DataTable/rows.ts"],
  reportsDirectory: "coverage/logic"
})
