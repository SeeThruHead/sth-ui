import { env, stdout } from "node:process"
import { overridesOf, profileFor } from "../src/Capacity.ts"
import { machineOf } from "../src/Governor.ts"

stdout.write(`${profileFor(machineOf(), overridesOf(env)).moonConcurrency}\n`)
