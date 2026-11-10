import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
import type { NodePath } from "@babel/traverse"
import { MutableRef } from "effect"
import { describe, expect, it } from "vitest"
import { typeOnly } from "./typeOnly.ts"

const sourceOf = (code: string, path: NodePath): string => code.slice(path.node.start ?? 0, path.node.end ?? 0)

const ignoredIn = (code: string): ReadonlyArray<string> => {
  const reasons = MutableRef.make<ReadonlyArray<string>>([])
  traverse(parse(code, { sourceType: "module", plugins: ["typescript"] }), {
    enter: (path: NodePath) => {
      const reason = typeOnly(path)
      if (reason !== undefined) MutableRef.update(reasons, (all) => [...all, `${sourceOf(code, path)}: ${reason}`])
    }
  })

  return MutableRef.get(reasons)
}

describe("type-only mutants", () => {
  it("a brand's name is ignored", () => {
    expect(ignoredIn(`const Name = Schema.String.pipe(Schema.brand("Name"))`)).toEqual([
      `"Name": a brand's name exists only in the type`
    ])
  })

  it("a service's key is ignored", () => {
    expect(ignoredIn(`class Repo extends Context.Service<Repo, {}>()("app/Repo") {}`)).toEqual([
      `"app/Repo": a service key is a label; nothing outside the service reads it`
    ])
  })

  it("a struct's field list is ignored, but not the schemas inside it", () => {
    expect(ignoredIn(`const Row = Schema.Struct({ id: UserId })`)).toEqual([
      "{ id: UserId }: Schema keeps unknown properties, so dropping a struct's fields only breaks the types"
    ])
  })

  it("a message's field list is ignored", () => {
    expect(ignoredIn(`const Message = defineMessageUnion({ Submit: { mode: Mode }, Reset: {} })`)).toEqual([
      "{ mode: Mode }: a message's fields only shape its type",
      "{}: a message's fields only shape its type"
    ])
  })

  it("a tagged error's field list is ignored, but not its tag", () => {
    expect(ignoredIn(`class Gone extends Schema.TaggedError<Gone>()("Gone", { id: Id }) {}`)).toEqual([
      "{ id: Id }: an error's fields only shape its type"
    ])
  })

  it("everything with behaviour is still mutated", () => {
    expect(
      ignoredIn(`
        const Tag = Schema.TaggedError<Tag>()("Tag", fields)
        const check = Schema.String.check(Schema.isMaxLength(80, { message: "Use 80 characters or fewer" }))
        const span = Effect.fn("Identity.signUp")(function* () {})
        const brand = other.brand("x")
        const named = Context.Tag("x")
        const struct = Schema.Struct(fields)
        const nested = { inner: { value: 1 } }
      `)
    ).toEqual([])
  })
})
