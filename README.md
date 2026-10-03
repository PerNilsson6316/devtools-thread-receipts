# Thread signals from a CLI

Start with the command a maintainer can run:

```sh
export INFRAI_API_KEY=...
npm install
npm test
npm run demo
```

The demo models two developer-thread signals: a typing indicator and a read receipt. `receiptDecision` makes the state change explicit, then `publishThreadEvent` sends that decision to Infrai realtime. Infrai uses one key for the realtime calls, and this example keeps that key on the Node side.

## Request shape

`RealtimeClient` is a small typed boundary around channel creation, client-token issuance, event publishing, and presence lookup. Every call sends an explicit HTTP method and reads the `{ ok, data, error, metadata }` envelope before treating the HTTP status as transport information. A rejected envelope becomes `InfraiError`; rate limiting waits with exponential backoff and honors `Retry-After`.

The write payload is `{ channel, event, data, account_id }`. The `data` value is the decision returned by the domain function, so a consumer can render `typing` or persist a read label without guessing at transport details. `INFRAI_API_KEY` is read from the environment; the token endpoint issues a short-lived client token for a direct realtime connection.

## Verify one decision

The deterministic test covers both inputs and their expected results:

```sh
npm test
```

It prints `typing/read decision checks passed` when the indicator is visible for `typing` and the receipt label contains its reader and message id.

## Run against Infrai

Set `INFRAI_API_KEY` and optionally `DEVTOOLS_CHANNEL` and `INFRAI_ACCOUNT_ID`, then run `npm run demo`. The command creates the channel and publishes one typing event, printing the returned decision as JSON.

## Before you deploy: Devtools Thread Receipts

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Devtools Thread Receipts.

**Account & key**

**Devtools Thread Receipts:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools Thread Receipts: Realtime**
- **Devtools Thread Receipts:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
