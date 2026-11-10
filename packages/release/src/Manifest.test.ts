import { describe, expect, it } from "@effect/vitest"
import { Result } from "effect"
import {
  canaryVersion,
  combinedExports,
  combinedManifest,
  ConflictingDependency,
  distTag,
  NotAReleaseTag,
  npmrc,
  publishedImports,
  releaseVersion,
  UnpublishedDependency
} from "./Manifest.ts"

const release = {
  version: "0.1.0",
  registry: "https://registry.npmjs.org/",
  repository: "https://github.com/SeeThruHead/sth-ui"
}

const icons = { folder: "icons", manifest: { name: "@sth-ui/icons", dependencies: { foldkit: "0.170.0" } } }

const core = {
  folder: "core",
  manifest: {
    name: "@sth-ui/core",
    dependencies: { "@sth-ui/icons": "workspace:*", effect: "4.1.2", foldkit: "0.170.0" }
  }
}

const tiptap = {
  folder: "tiptap",
  manifest: { name: "@sth-ui/tiptap", dependencies: { "@sth-ui/core": "workspace:*", "@tiptap/core": "3.33.0" } }
}

describe("versions", () => {
  it("names canaries by commit date and sha, keeping semver valid", () => {
    expect(canaryVersion("20261105110142", "ae72433f9d")).toBe("0.0.0-canary.20261105110142.ae72433f")
    expect(canaryVersion("20261105110142", "01234567")).toBe("0.0.0-canary.20261105110142.g01234567")
    expect(canaryVersion("20261105110142", "12345678")).toBe("0.0.0-canary.20261105110142.12345678")
  })

  it("takes a release's version from its v-prefixed tag and refuses anything else", () => {
    expect(releaseVersion("v0.1.0")).toEqual(Result.succeed("0.1.0"))
    expect(releaseVersion("v12.3.45")).toEqual(Result.succeed("12.3.45"))
    expect(releaseVersion("0.1.0")).toEqual(Result.fail(new NotAReleaseTag({ tag: "0.1.0" })))
    expect(releaseVersion("v0.1")).toEqual(Result.fail(new NotAReleaseTag({ tag: "v0.1" })))
    expect(new NotAReleaseTag({ tag: "nope" }).message).toBe(
      "nope is not a release tag; a release is tagged like v0.1.0"
    )
  })

  it("publishes releases as latest and canaries under their own tag, so a plain install gets the release", () => {
    expect(distTag("0.1.0")).toBe("latest")
    expect(distTag(canaryVersion("20261105110142", "ae72433f"))).toBe("canary")
  })
})

describe("the one published package", () => {
  it("ships every part in its own folder of a single @seethruhead/sth-ui package, with the outside dependencies they share", () => {
    expect(Result.getOrThrow(combinedManifest([icons, core, tiptap], release))).toEqual({
      name: "@seethruhead/sth-ui",
      version: "0.1.0",
      description: "Mantine ported to Foldkit and Effect, in one package",
      license: "MIT",
      type: "module",
      repository: { type: "git", url: release.repository },
      exports: combinedExports(["icons", "core", "tiptap"]),
      files: [
        "icons/lib",
        "icons/src",
        "core/lib",
        "core/src",
        "tiptap/lib",
        "tiptap/src",
        "!**/*.test.ts",
        "!**/*.stories.ts",
        "LICENSE",
        "NOTICE",
        "LLMS.md"
      ],
      dependencies: { "@tiptap/core": "3.33.0", effect: "4.1.2", foldkit: "0.170.0" },
      publishConfig: { registry: release.registry, access: "public" }
    })
  })

  it("points each part's .ts paths, as the workspace writes them, at its built files", () => {
    const exports = combinedExports(["core"])
    const built = { types: "./core/lib/*.d.ts", default: "./core/lib/*.js" }

    expect(exports).toEqual({
      "./package.json": "./package.json",
      "./core/*.ts": built,
      "./core/*.js": built,
      "./core/*": built
    })
  })

  it("leaves out dependencies when no part has any", () => {
    expect(
      Result.getOrThrow(combinedManifest([{ folder: "icons", manifest: { name: "@sth-ui/icons" } }], release))
    ).not.toHaveProperty("dependencies")
  })

  it("refuses a workspace dependency that is not being published", () => {
    const leaky = {
      folder: "core",
      manifest: { name: "@sth-ui/core", dependencies: { "@sth-ui/testing": "workspace:*" } }
    }

    expect(combinedManifest([leaky], release)).toEqual(
      Result.fail(new UnpublishedDependency({ from: "@sth-ui/core", dependency: "@sth-ui/testing" }))
    )
    expect(new UnpublishedDependency({ from: "a", dependency: "b" }).message).toBe(
      "a depends on b from the workspace, which is not published"
    )
  })

  it("refuses parts that ask for different versions of the same outside dependency", () => {
    const older = { folder: "form", manifest: { name: "@sth-ui/form", dependencies: { effect: "4.1.1" } } }
    const error = new ConflictingDependency({ dependency: "effect", ranges: ["4.1.2", "4.1.1"] })

    expect(combinedManifest([icons, core, older], release)).toEqual(Result.fail(error))
    expect(error.message).toBe(
      "the packages ask for different versions of effect (4.1.2, 4.1.1); sth-ui ships them as one package, so they must agree"
    )
  })

  it("rewrites imports between parts to the one package, and leaves everything else alone", () => {
    const source = [
      'import { Button } from "@sth-ui/core/components/Button/Button.ts"',
      "export * from '@sth-ui/code-highlight/CodeHighlight.ts'",
      'import "@sth-ui/testing/Suites.ts"',
      "See `@sth-ui/core/src/components/Button/demos/usage.ts`, or @sth-ui/coreish."
    ].join("\n")

    expect(publishedImports(source, ["core", "code-highlight"])).toBe(
      [
        'import { Button } from "@seethruhead/sth-ui/core/components/Button/Button.ts"',
        "export * from '@seethruhead/sth-ui/code-highlight/CodeHighlight.ts'",
        'import "@sth-ui/testing/Suites.ts"',
        "See `@seethruhead/sth-ui/core/src/components/Button/demos/usage.ts`, or @sth-ui/coreish."
      ].join("\n")
    )
    expect(publishedImports(source, [])).toBe(source)
  })

  it("writes an .npmrc that names the registry and leaves the login to npm", () => {
    expect(npmrc(release.registry)).toBe("registry=https://registry.npmjs.org/\n")
  })
})
