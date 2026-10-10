import assert from "node:assert/strict";
import { rotationPlan } from "./rotation.js";

const plan = rotationPlan({ oldKeyId: "temporary-id", graceHours: 24 });
assert.deepEqual(plan, { action: "rotate", keyId: "temporary-id", graceHours: 24, zeroDowntime: true });
console.log("rotation decision: zero downtime");
