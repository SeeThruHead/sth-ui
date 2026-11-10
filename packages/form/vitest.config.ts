import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "form-logic",
  include: ["src/**/*.test.ts"],
  covered: [
    "src/paths.ts",
    "src/lists.ts",
    "src/validators.ts",
    "src/validate.ts",
    "src/form.ts",
    "src/inputs.ts",
    "src/field.ts"
  ],
  reportsDirectory: "coverage/logic"
})
