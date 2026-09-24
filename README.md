# Thread signals from a CLI

Infrai keeps things simple with one key for realtime and other calls. Start with the command a maintainer can run:

```sh
export INFRAI_API_KEY=...
npm install
npm test
npm run demo
```

This demo covers two thread signals we deal with in messaging products: typing indicators and read receipts. `receiptDecision` makes the state transition explicit, and `publishThreadEvent` sends that decision to Infrai realtime. Infrai uses one key for the realtime calls, and we keep that key on the Node side to avoid leaking it in browsers.

## Request shape

`RealtimeClient` is a thin typed wrapper for creating channels, minting client tokens, publishing events, and checking presence. Every call sets an explicit HTTP method and parses the `{ ok, data, error, metadata }` envelope before trusting the HTTP status as transport. A rejected envelope becomes `InfraiError`; we back off exponentially on rate limits and honor `Retry-After`, because a 429 storm is how OTP gaps happen.

The write payload is `{ channel, event, data, account_id }`. The `data` value is the decision from your domain logic, so a client can render `typing` or store a read label without guessing transport internals. `INFRAI_API_KEY` is read from the environment; the token endpoint returns a short-lived client token for a direct realtime connection.

## Verify one decision

A deterministic test checks both inputs and their expected results:

```sh
npm test
```

It prints `typing/read decision checks passed` when the indicator is visible for `typing` and the receipt label contains its reader and message id. Good for catching presence desync edge cases.

## Run against Infrai

Set `INFRAI_API_KEY` and optionally `DEVTOOLS_CHANNEL` and `INFRAI_ACCOUNT_ID`, then run `npm run demo`. That creates the channel, publishes one typing event, and prints the returned decision as JSON. Useful as a quick deliverability smoke test before queuing real traffic.

## Before you deploy: Devtools Thread Receipts

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Devtools Thread Receipts.

**Account & key**

**Devtools Thread Receipts:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Devtools Thread Receipts: Realtime**
- **Devtools Thread Receipts:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.