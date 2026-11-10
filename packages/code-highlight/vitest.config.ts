import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "code-highlight-logic",
  include: ["src/**/*.test.ts"],
  covered: [
    "src/JsonViewer/jsonValue.ts",
    "src/JsonViewer/model.ts",
    "src/highlighter.ts",
    "src/CodeHighlight/model.ts"
  ],
  reportsDirectory: "coverage/logic"
})
