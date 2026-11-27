<h1 align="center">Solana New Pool Alert Bot: Detect New Raydium, Meteora, Orca and PumpSwap Pools</h1>

<p align="center">
  <b>Get an alert, with token mints and an explorer link, the moment a new Solana liquidity pool is created.</b><br>
  <sub>A small TypeScript bot that watches five DEX programs over one Yellowstone gRPC stream from <a href="https://nolimitnodes.com/">NoLimitNodes</a>, with an optional Discord webhook. Companion code for a NoLimitNodes Academy lesson.</sub>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square"></a>
  <a href="#files"><img alt="TypeScript" src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square"></a>
  <a href="#supported-dexes"><img alt="5 DEX programs" src="https://img.shields.io/badge/DEX%20programs-5-green?style=flat-square"></a>
  <a href="https://nolimitnodes.com/"><img alt="Powered by NoLimitNodes" src="https://img.shields.io/badge/powered%20by-NoLimitNodes-FBDE00?style=flat-square&labelColor=000000"></a>
  <a href="#how-it-works"><img alt="Yellowstone gRPC" src="https://img.shields.io/badge/transport-Yellowstone%20gRPC-brightgreen?style=flat-square"></a>
  <a href="https://solana.com"><img alt="Solana Mainnet" src="https://img.shields.io/badge/solana-mainnet-9945FF?style=flat-square"></a>
</p>

<p align="center">
  <a href="#quickstart-run-the-pool-alert-bot">Quickstart</a> ·
  <a href="#supported-dexes">DEXes</a> ·
  <a href="#configuration">Config</a> ·
  <a href="#use-cases">Use cases</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#faq">FAQ</a> ·
  <a href="#learn-more-on-nolimitnodes-academy">Academy</a>
</p>

---

## What this is

A Solana new pool alert bot in TypeScript. It **detects new Solana liquidity pools the moment they are created** on Raydium AMM v4, Raydium CPMM, Meteora DLMM, Orca Whirlpool and PumpSwap, and prints an alert with the slot, the token mints and a Solscan link. It catches PumpFun graduations too, because each graduation creates a PumpSwap pool. Set one environment variable and every alert also goes to a Discord webhook.

This repo is the companion code for the [NoLimitNodes Academy](https://nolimitnodes.com/academy) walkthrough **[Build a Solana new-pool alert bot](https://nolimitnodes.com/academy/build-new-pool-alert-bot-solana)**. The lesson explains how the detection works and why each design choice was made. This repo is the finished bot, ready to run.

> **Alerts only. Not financial advice.** The bot never trades. New pools carry real risks such as rugs and honeypots. Check a token's mint and freeze authority before you trade it.

**If you've been looking for any of these, you're in the right place:**

- A **Solana new liquidity pool alert** you can run yourself
- A **Raydium new pool detector** for AMM v4 (`initialize2`) and CPMM
- A **Meteora DLMM new pool monitor** that catches the `InitializeLbPair` variants
- An **Orca Whirlpool new pool listener** (`InitializePool` and `InitializePoolV2`)
- A **PumpFun graduation alert** via the PumpSwap `CreatePool` instruction
- A **new token pool Discord bot** that posts to a webhook
- A **Yellowstone gRPC example** that filters several programs on one stream
- A **logsSubscribe alternative** that also gives you the full transaction

## Who this is for

- **Solana bot developers** who need a pool-creation trigger to build on
- **Traders and researchers** who want to see new pools as they land, then do their own checks
- **Discord community operators** who want new-pool alerts in a channel
- **Developers learning Yellowstone gRPC** who want a real project one step past a hello-world client

## Quickstart: run the pool alert bot

You need Node.js 20 or newer and a NoLimitNodes API key on a plan that includes Yellowstone gRPC ([pricing](https://nolimitnodes.com/pricing)).

### Step 1. Get an API key

Go to **[app.nolimitnodes.com/register](https://app.nolimitnodes.com/register)** and create an account. You get a 5-day free Pro trial, no credit card required. Copy your API key from the dashboard.

### Step 2. Clone, test and run

```bash
git clone https://github.com/no-limit-nodes/solana-new-pool-alert-bot.git
cd solana-new-pool-alert-bot
npm install

export NLN_API_KEY="your-api-key"
npm test                             # offline check of the log matcher
npm start                            # start watching for new pools
```

Example output:

```text
$ npm start
watching Raydium AMM v4, Raydium CPMM, Meteora DLMM, Orca Whirlpool, PumpSwap

🆕 PumpSwap pool  slot 381204517
   mints: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU, So11111111111111111111111111111111111111112
   https://solscan.io/tx/5VfYm...

🆕 Meteora DLMM pool  slot 381204533
   mints: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, 9nEqaUcb...
   https://solscan.io/tx/3Hk2r...
```

*Example output is trimmed.*

Leave it running. PumpSwap pools from PumpFun graduations usually show up first, because they are the most frequent. Open the explorer link on the first alert and check that the transaction really created a pool.

### Scripts

| Command | What it runs |
|---|---|
| `npm start` | `tsx src/pool-bot.ts`, the bot |
| `npm test` | `tsx src/detect.test.ts`, offline matcher tests. Prints `detect: all checks passed` |
| `npm run typecheck` | `tsc` with no emit |

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `NLN_API_KEY` | required | Your NoLimitNodes API key. The bot exits with a message if it is not set |
| `NLN_GRPC_URL` | `https://grpc.mainnet.solana.nolimitnodes.com:443` | Yellowstone gRPC endpoint |
| `WEBHOOK_URL` | none | A Discord webhook URL that also receives every alert. A failed post is logged as `webhook failed:` and the bot keeps running |

## Supported DEXes

The bot only alerts when the create instruction is logged by the DEX program itself.

| DEX | Program ID | Create instruction in the logs |
|---|---|---|
| Raydium AMM v4 | `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8` | `initialize2` |
| Raydium CPMM | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | `Initialize` (and `InitializeWithPermission`) |
| Meteora DLMM | `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo` | `InitializeLbPair` (and variants such as `InitializeCustomizablePermissionlessLbPair`) |
| Orca Whirlpool | `whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc` | `InitializePool` (and `V2`) |
| PumpSwap | `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` | `CreatePool` |

The program table and the regexes live in `DEXES` in [`src/detect.ts`](src/detect.ts). Program IDs are mainnet.

### The subscription

One named filter (`pools`) covers all five programs at `confirmed` commitment:

| Field | Value | Why |
|---|---|---|
| `vote` | `false` | Vote transactions never create pools |
| `failed` | `false` | A failed create is not a pool |
| `accountInclude` | the five program IDs | Match any transaction that touches any of them |
| `accountExclude`, `accountRequired` | empty | Not needed here |
| `commitment` | `CONFIRMED` | The lesson explains why `confirmed` beats `processed` for alerts |

The client raises `grpcMaxDecodingMessageSize` to 64 MB, because full transactions can be larger than the gRPC default, and it answers every server `ping` to keep the connection open.

## Files

| File | What it does |
|---|---|
| [`src/detect.ts`](src/detect.ts) | The program table and the stack-based log matcher (`findPoolCreation`) |
| [`src/pool-bot.ts`](src/pool-bot.ts) | Connects, subscribes to the five programs, answers pings, prints alerts and posts to the webhook |
| [`src/detect.test.ts`](src/detect.test.ts) | Offline tests with real log shapes, including the cases the bot must ignore |

The tests cover a real PumpSwap pool creation, a PumpSwap `Buy` that must not match, an `Instruction: Initialize` written by another program that must not count as Raydium CPMM, a Meteora DLMM variant, and Orca `InitializePoolV2`.

## Make it yours

- **Add a DEX.** Add its program ID and create-instruction regex to `DEXES` in `src/detect.ts`. The filter picks it up automatically.
- **Screen the token before you trade.** Check whether the mint and freeze authorities are still active. See the [token risk scanner guide](https://nolimitnodes.com/blog/solana-token-risk-scanner-mint-freeze-authority).
- **Reconnect.** The bot exits on a stream error and does not reconnect. Wrap the setup in a retry loop with exponential backoff, like the [`reconnect.ts` example](https://github.com/no-limit-nodes/yellowstone-grpc-typescript-client/blob/main/src/reconnect.ts).
- **Never miss a pool.** Validators truncate very long logs. For full coverage, decode the instructions against each program's IDL instead of reading the logs.
- **Go deeper.** [Detecting new Solana liquidity pools](https://nolimitnodes.com/blog/detect-new-solana-liquidity-pools-raydium-meteora-orca-pumpswap) covers more DEXes, pool fields and edge cases.

## Use cases

### Alerts and monitoring

- **New pool feed in Discord.** Set `WEBHOOK_URL` and every alert lands in a channel.
- **PumpFun graduation watcher.** Each graduation creates a PumpSwap pool, so PumpSwap alerts double as graduation alerts.
- **Listing research.** Log alerts to a file or database to study how often each DEX gets new pools.

### Building on top

- **Trigger for a screening pipeline.** Pass the mints from each alert to a token risk check before anyone acts on them.
- **Starting point for a trading bot.** The alert gives you the slot, the mints and the signature. Execution, risk limits and position sizing are yours to build.
- **Template for other program events.** Swap the regexes in `DEXES` to detect a different instruction on any program.

## How it works

Every pool starts as one transaction that calls a DEX program's create instruction. The bot:

1. **Streams** every successful transaction that touches any of the five DEX programs, using one Yellowstone gRPC filter at `confirmed` commitment.
2. **Walks the log lines** with a call stack, so it knows which program wrote each line. A bare `Instruction: Initialize` could come from the token program, a wallet or a router. The stack makes sure the bot only checks a line against the DEX that actually wrote it.
3. **Alerts** when the create instruction of that DEX ran. It reads the mints from `postTokenBalances`, so it doesn't need a second RPC call. That list is usually the new token and its pair (often wrapped SOL), sometimes an LP mint too.

The full reasoning is in [the lesson](https://nolimitnodes.com/academy/build-new-pool-alert-bot-solana).

## Yellowstone gRPC vs logsSubscribe: when to pick which

`logsSubscribe` over WebSocket takes only one address per subscription and sends only the logs. To watch five DEXes you need five subscriptions, and to get the mints you need a second call per alert. Yellowstone gRPC covers all five programs in one filter and includes the full transaction, so the bot reads the mints straight from the update. `logsSubscribe` is still fine for watching a single program when you only need the log lines. For a wider comparison, see [5 ways to get real-time Solana data, compared](https://nolimitnodes.com/academy/ways-to-get-real-time-solana-data-compared).

## Repo layout

```text
solana-new-pool-alert-bot/
├── src/
│   ├── detect.ts          # DEX table and stack-based log matcher
│   ├── detect.test.ts     # offline matcher tests (npm test)
│   └── pool-bot.ts        # Yellowstone gRPC stream, alerts, webhook (npm start)
├── package.json
├── package-lock.json
├── tsconfig.json
├── LICENSE
└── README.md
```

## FAQ

<details>
<summary><b>How do I detect new liquidity pools on Solana?</b></summary>

Subscribe to transactions that mention each DEX program at `confirmed` commitment, then look for that program's pool-creation instruction in its own log lines. Examples are `CreatePool` on PumpSwap and `InitializeLbPair` on Meteora DLMM. Tracking which program wrote each line stops a router's or token program's `Initialize` from causing false alerts.
</details>

<details>
<summary><b>Why not use logsSubscribe over WebSocket?</b></summary>

`logsSubscribe` takes only one address per subscription and sends only the logs. Yellowstone gRPC covers all five DEX programs in one filter and includes the full transaction, so the bot can read the token mints from `postTokenBalances` without a second RPC call. That means fewer connections and no extra request per alert.
</details>

<details>
<summary><b>Does it catch PumpFun graduations?</b></summary>

Yes. When a PumpFun token graduates, it gets a new PumpSwap pool, and the bot reports that pool under PumpSwap. These are usually the most frequent alerts, so they tend to show up first after you start the bot. Open the Solscan link to confirm the transaction really created a pool.
</details>

<details>
<summary><b>Can the bot buy tokens automatically?</b></summary>

No. It only sends alerts, and nothing in this repo signs or sends transactions. New pools carry real risks such as rugs and honeypots, so treat an alert as a prompt to investigate, not a signal to buy. Check whether a token's mint and freeze authorities are still active before you trade it.
</details>

<details>
<summary><b>How do I send Solana new pool alerts to Discord?</b></summary>

Create a webhook in your Discord channel settings, then run `export WEBHOOK_URL="<your webhook url>"` before `npm start`. The bot posts each alert as a message with the DEX name, the mints and the Solscan link. If a post fails, it logs `webhook failed:` and keeps watching.
</details>

<details>
<summary><b>How do I add another DEX to the pool detector?</b></summary>

Add an entry to `DEXES` in `src/detect.ts` with the program ID, a display name and a regex for its create instruction log line. The subscription filter is built from the keys of `DEXES`, so the new program is streamed automatically. Add a test case with a real log sample to `src/detect.test.ts`.
</details>

<details>
<summary><b>Can the bot miss a new pool?</b></summary>

Yes, in some cases. Validators truncate very long logs, so a create instruction buried deep in a large transaction may not appear. The bot also exits on a stream error and does not reconnect. For full coverage, add a reconnect loop and decode instructions against each program's IDL instead of reading logs.
</details>

## Learn more on NoLimitNodes Academy

- [Build a Solana new-pool alert bot](https://nolimitnodes.com/academy/build-new-pool-alert-bot-solana): the full walkthrough for this repo
- [Your first Yellowstone gRPC client in TypeScript](https://nolimitnodes.com/academy/first-yellowstone-grpc-client-typescript): the connection, request format and ping handling this bot reuses ([code](https://github.com/no-limit-nodes/yellowstone-grpc-typescript-client))
- [Solana AMM pool types: Raydium, Orca, Meteora, PumpSwap](https://nolimitnodes.com/academy/solana-amm-pool-types-raydium-orca-meteora-pumpswap): what the five pool types this bot detects actually are
- [Slots, blocks and commitment levels, explained](https://nolimitnodes.com/academy/solana-slots-blocks-commitment-explained): why the bot alerts at `confirmed`
- [5 ways to get real-time Solana data, compared](https://nolimitnodes.com/academy/ways-to-get-real-time-solana-data-compared): gRPC next to RPC polling, WebSockets, webhooks and shreds
- [Practice quizzes](https://nolimitnodes.com/academy/practice): test what you know in 60 seconds

## Contributing

Issues and pull requests are welcome. If you add a DEX, include a test in `src/detect.test.ts` with a real log sample, and run `npm test` and `npm run typecheck` before you open the PR.

## License

[MIT](./LICENSE).

## Related resources

- [NoLimitNodes](https://nolimitnodes.com/)
- [NoLimitNodes gRPC nodes](https://nolimitnodes.com/products/grpc-nodes)
- [NoLimitNodes pool creations data](https://nolimitnodes.com/products/pool-creations)
- [Yellowstone gRPC quickstart](https://nolimitnodes.com/docs/quickstarts/yellowstone-grpc)
- [Detecting new Solana liquidity pools](https://nolimitnodes.com/blog/detect-new-solana-liquidity-pools-raydium-meteora-orca-pumpswap)
- [Yellowstone gRPC vs WebSockets for real-time Solana data](https://nolimitnodes.com/blog/yellowstone-grpc-vs-websockets-real-time-solana-data)
- [Yellowstone gRPC source (rpcpool/yellowstone-grpc)](https://github.com/rpcpool/yellowstone-grpc)
- [Raydium](https://raydium.io), [Meteora](https://www.meteora.ag), [Orca](https://www.orca.so), [PumpFun](https://pump.fun)

---

<p align="center">
  <b>Ready to catch new Solana pools as they are created?</b><br>
  <a href="https://app.nolimitnodes.com/register">Register, get a 5-day free Pro trial, grab your API key →</a>
</p>
