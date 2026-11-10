import { describe, expect, it } from "@effect/vitest"
import { getDataPath, getPath, insertPath, removePath, reorderPath, replacePath, setPath, splitPath } from "./paths.ts"

const values = {
  name: "John",
  age: 42,
  description: ["male", "mid-age"],
  job: { title: "Engineer", permissions: { admin: false, user: true } },
  duties: [
    {
      title: "Drink coffee",
      when: [{ morning: true }, { afternoon: false }],
      info: { activity: [{ date: "yesterday", event: "log" }] }
    },
    {
      title: "Do the job",
      when: [{ morning: false }, { afternoon: true }],
      info: { activity: [{ date: "yesterday", event: "log" }] }
    }
  ]
}

describe("form paths, as @mantine/form's", () => {
  it("splits paths and refuses prototype-polluting ones", () => {
    expect(splitPath("a.b.0.c")).toEqual(["a", "b", "0", "c"])
    expect(splitPath(undefined)).toEqual([])
    expect(splitPath(0)).toEqual([])
    expect(splitPath("a.__proto__.polluted")).toEqual([])
    expect(splitPath("constructor.prototype.polluted")).toEqual([])
    expect(splitPath("my__proto__field.constructorName")).toEqual(["my__proto__field", "constructorName"])
  })

  it("gets values from objects and lists", () => {
    expect(getPath("name", values)).toBe("John")
    expect(getPath("job.permissions", values)).toEqual({ admin: false, user: true })
    expect(getPath("description.1", values)).toBe("mid-age")
    expect(getPath("duties.0.when.0.morning", values)).toBe(true)
    expect(getPath("duties.1.info.activity.0.date", values)).toBe("yesterday")
    expect(getPath("random", values)).toBe(undefined)
    expect(getPath("name.random.path", values)).toBe(undefined)
    expect(getPath("duties.3.title", values)).toBe(undefined)
    expect(getPath("a.b.c", undefined)).toBe(undefined)
    expect(getPath("a.b.c", null)).toBe(undefined)
    expect(getPath("__proto__", values)).toBe(undefined)
  })

  it("sets values without changing the original", () => {
    expect(setPath("name", "Jane", values)).toEqual({ ...values, name: "Jane" })
    expect(setPath("description.0", "female", values)).toEqual({ ...values, description: ["female", "mid-age"] })
    expect(setPath("job.permissions.user", false, values)).toEqual({
      ...values,
      job: { title: "Engineer", permissions: { admin: false, user: false } }
    })
    expect(getPath("duties.1.info.activity.0.event", setPath("duties.1.info.activity.0.event", "test", values))).toBe(
      "test"
    )
    expect(values.name).toBe("John")
    expect(setPath("list.3", "d", { list: ["a"] })).toEqual({ list: ["a", undefined, undefined, "d"] })
    expect(setPath("missing.deep.key", 1, values)).toBe(values)
    expect(setPath("__proto__.polluted", "YES", { name: "" })).toEqual({ name: "" })
    expect(Reflect.get({}, "polluted")).toBeUndefined()
  })

  it("inserts, removes, reorders and replaces list items", () => {
    expect(insertPath("a", 4, 1, { a: [1, 2, 3] })).toEqual({ a: [1, 4, 2, 3] })
    expect(insertPath("a", 4, undefined, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3, 4] })
    expect(insertPath("a.1.b", 4, undefined, { a: [{ b: [1] }, { b: [1, 2] }] })).toEqual({
      a: [{ b: [1] }, { b: [1, 2, 4] }]
    })
    expect(insertPath("a", 4, 0, { a: 1 })).toEqual({ a: 1 })
    expect(removePath("a", 1, { a: [1, 2, 3] })).toEqual({ a: [1, 3] })
    expect(removePath("b.c.d.0", 1, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3] })
    expect(reorderPath("a", { from: 2, to: 0 }, { a: [1, 2, 3] })).toEqual({ a: [3, 1, 2] })
    expect(reorderPath("a", { from: 1, to: 2 }, { a: [1, 2, 3] })).toEqual({ a: [1, 3, 2] })
    expect(reorderPath("a.c", { from: 1, to: 2 }, { a: { c: 1 } })).toEqual({ a: { c: 1 } })
    expect(replacePath("field", "new", 1, { field: ["old", "old"] })).toEqual({ field: ["old", "new"] })
    expect(replacePath("field", "new", 1, { field: "old" })).toEqual({ field: "old" })
    expect(replacePath("field", "new", 2, { field: ["old"] })).toEqual({ field: ["old"] })
  })

  it("names data paths after the form", () => {
    expect(getDataPath(undefined, "field")).toBe("field")
    expect(getDataPath("", "field")).toBe("field")
    expect(getDataPath("form", "field")).toBe("form-field")
  })
})
