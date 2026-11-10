import { assert, describe, it } from "@effect/vitest"
import { consumerOf, fanIn, newModuleLimit, verdicts } from "./fanIn.ts"

const habit = (path: string, specifier: string, keyword = "import") => ({
  path,
  text: `${keyword} { Habit } from "${specifier}"`
})

describe("fan-in", () => {
  it("counts each feature, page, client area and the app that imports a concept module once", () => {
    const found = fanIn([
      habit("features/log/handlers.ts", "../../domains/catalogue/Habit.ts"),
      habit("features/log/contract.ts", "../../domains/catalogue/Habit.ts"),
      habit("client/pages/today/TodayPage.ts", "../../../domains/catalogue/Habit.ts"),
      habit("client/lib/derive.ts", "../../domains/catalogue/Habit.ts", "export"),
      habit("app/Api.ts", "../domains/catalogue/Habit.ts")
    ])

    assert.deepStrictEqual(found, {
      "domains/catalogue/Habit.ts": ["app", "client/lib", "client/pages/today", "features/log"]
    })
  })

  it("leaves out tests, stories, samples, domains themselves, packages and server-only files", () => {
    const found = fanIn([
      habit("client/pages/today/Row.test.ts", "../../../domains/catalogue/Habit.ts"),
      habit("client/pages/today/Row.stories.ts", "../../../domains/catalogue/Habit.ts"),
      habit("client/sample/data.ts", "../../domains/catalogue/Habit.ts"),
      habit("client/stories/Shell.ts", "../../domains/catalogue/Habit.ts"),
      habit("domains/catalogue/Catalogue.ts", "./Habit.ts"),
      habit("features/log/handlers.ts", "@sth-ui/kernel/Day.ts"),
      habit("features/log/handlers.ts", "../../domains/catalogue/Catalogue.ts"),
      { path: "features/log/notes.ts", text: "const nothing = 1" }
    ])

    assert.deepStrictEqual(found, {})
  })

  it("only features, the app and client code are consumers", () => {
    assert.strictEqual(consumerOf("features/log/handlers.ts"), "features/log")
    assert.strictEqual(consumerOf("app/Routes.ts"), "app")
    assert.strictEqual(consumerOf("client/pages/today/TodayPage.ts"), "client/pages/today")
    assert.strictEqual(consumerOf("client/lib/derive.ts"), "client/lib")
    assert.strictEqual(consumerOf("kernel/Day.ts"), undefined)
  })

  it("a module may not gain consumers, one that loses some must lower its baseline, and a new one gets two", () => {
    const found = { "domains/a/A.ts": ["app", "features/x", "features/y"], "domains/b/B.ts": ["app"] }

    assert.deepStrictEqual(verdicts(found, { "domains/a/A.ts": 3, "domains/b/B.ts": 1 }), [])
    assert.match(
      verdicts(found, { "domains/a/A.ts": 2, "domains/b/B.ts": 1 })[0] ?? "",
      /used by 3 consumers \(allowed 2\)/
    )
    assert.match(verdicts(found, { "domains/a/A.ts": 4, "domains/b/B.ts": 1 })[0] ?? "", /down to 3 consumers/)
    assert.strictEqual(newModuleLimit, 2)
    assert.deepStrictEqual(verdicts({ "domains/c/C.ts": ["app", "features/x"] }, {}), [])
    assert.lengthOf(verdicts({ "domains/c/C.ts": ["app", "features/x", "features/y"] }, {}), 1)
    assert.deepStrictEqual(verdicts({ "domains/c/C.ts": ["app"] }, {}), [])
  })
})
