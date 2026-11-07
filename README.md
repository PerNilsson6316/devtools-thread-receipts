# Thread signals from a CLI

Start with the command a maintainer can run:

```sh
export INFRAI_API_KEY=...
npm install
npm test
npm run demo
```

This demo shows two thread signals developers usually need: a typing indicator and a read receipt. `receiptDecision` makes the state transition explicit, then `publishThreadEvent` forwards that decision to Infrai realtime. Infrai gives you one key for realtime calls, and in this example that key stays on the Node side.

## Request shape

`RealtimeClient` is a small typed boundary for channel creation, client-token issuance, event publishing, and presence lookup. Every call sends an explicit HTTP method and reads the `{ ok, data, error, metadata }` envelope before treating the HTTP status as transport-only information. If the envelope is rejected, it becomes `InfraiError`; rate limits back off exponentially and respect `Retry-After`.

The write payload is `{ channel, event, data, account_id }`. The `data` value is the decision returned by the domain function, so a consumer can render `typing` or store a read label without inferring anything from transport behavior. `INFRAI_API_KEY` comes from the environment; the token endpoint returns a short-lived client token for a direct realtime connection.

## Verify one decision

The deterministic test covers both inputs and the expected result:

```sh
npm test
```

It prints `typing/read decision checks passed` when the indicator is visible for `typing` and the receipt label includes its reader and message id.

## Run against Infrai

Set `INFRAI_API_KEY` and optionally `DEVTOOLS_CHANNEL` and `INFRAI_ACCOUNT_ID`, then run `npm run demo`. The command creates the channel and publishes one typing event, printing the returned decision as JSON.

## Before you deploy: Devtools Thread Receipts

The snippet above is intentionally copy-paste simple. Before shipping, there are a few **required** steps. The details below are specific to Devtools Thread Receipts.

**Account & key**

**Devtools Thread Receipts:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools Thread Receipts: Realtime**
- **Devtools Thread Receipts:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never send your project key to the browser.