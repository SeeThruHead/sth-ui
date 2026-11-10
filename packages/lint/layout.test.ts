import { assert, describe, it } from "@effect/vitest"
import { isPureDomainModule, isServerOnlyDomainFile, isSharedService } from "./layout.ts"

describe("layout", () => {
  it("a domain's service, repository, migrations and named extra services are server-only", () => {
    assert.isTrue(isServerOnlyDomainFile("domains/catalogue/Catalogue.ts"))
    assert.isTrue(isServerOnlyDomainFile("domains/catalogue/CatalogueRepo.ts"))
    assert.isTrue(isServerOnlyDomainFile("domains/catalogue/migrations.ts"))
    assert.isTrue(isServerOnlyDomainFile("domains/notifications/WebPush.ts"))
    assert.isFalse(isServerOnlyDomainFile("domains/catalogue/Habit.ts"))
    assert.isFalse(isServerOnlyDomainFile("features/habits/handlers.ts"))
  })

  it("every other file directly in a domain is a pure concept module the client may share", () => {
    assert.isTrue(isPureDomainModule("domains/catalogue/Habit.ts"))
    assert.isTrue(isPureDomainModule("domains/settings/Preferences.ts"))
    assert.isFalse(isPureDomainModule("domains/tracking/Tracking.ts"))
    assert.isFalse(isPureDomainModule("domains/tracking/Entry.test.ts"))
    assert.isFalse(isPureDomainModule("client/lib/derive.ts"))
  })

  it("services of the shared domains other than their migrations may be used across features", () => {
    assert.isTrue(isSharedService("domains/catalogue/Catalogue.ts"))
    assert.isTrue(isSharedService("domains/tracking/TrackingRepo.ts"))
    assert.isTrue(isSharedService("domains/configuration/Configuration.ts"))
    assert.isTrue(isSharedService("domains/transactions/TransactionsRepo.ts"))
    assert.isFalse(isSharedService("domains/catalogue/migrations.ts"))
    assert.isFalse(isSharedService("domains/settings/Settings.ts"))
    assert.isFalse(isSharedService("features/log/handlers.ts"))
  })
})
