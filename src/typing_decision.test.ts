import assert from "node:assert/strict";
import { receiptDecision } from "./receipt_thread";

assert.deepEqual(receiptDecision({ kind: "typing" }), { visible: true, label: "typing" });
assert.deepEqual(receiptDecision({ kind: "read", reader: "cli-user", messageId: "m-7" }), { visible: false, label: "read:cli-user:m-7" });
console.log("typing/read decision checks passed");
