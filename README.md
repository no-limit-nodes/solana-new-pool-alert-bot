# Solana New Pool Alert Bot (Raydium, Meteora, Orca, PumpSwap)

A small TypeScript bot that **detects new Solana liquidity pools the moment they are created**. It watches Raydium AMM v4, Raydium CPMM, Meteora DLMM, Orca Whirlpool and PumpSwap over a single Yellowstone gRPC stream, and prints an alert with the token mints and an explorer link for every new pool. It catches PumpFun graduations too, because each graduation creates a PumpSwap pool. You can also post the alerts to a Discord webhook.

This repository is the companion code for the [NoLimitNodes Academy](https://nolimitnodes.com/academy) walkthrough **[Build a Solana new-pool alert bot](https://nolimitnodes.com/academy/build-new-pool-alert-bot-solana)**. The lesson explains how the detection works and why each design choice was made. This repo is the finished bot, ready to run.

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

## How it works

Every pool starts as one transaction that calls a DEX program's create instruction. The bot:

1. **Streams** every successful transaction that touches any of the five DEX programs, using one Yellowstone gRPC filter at `confirmed` commitment.
2. **Walks the log lines** with a call stack, so it knows which program wrote each line. A bare `Instruction: Initialize` could come from the token program or a router. The stack makes sure the bot only checks a line against the DEX that actually wrote it.
3. **Alerts** when the create instruction of that DEX ran. It reads the mints from `postTokenBalances`, so it doesn't need a second RPC call.

| DEX | Program ID | Create instruction in the logs |
|---|---|---|
| Raydium AMM v4 | `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8` | `initialize2` |
| Raydium CPMM | `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C` | `Initialize` |
| Meteora DLMM | `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo` | `InitializeLbPair` (and variants) |
| Orca Whirlpool | `whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc` | `InitializePool` (and `V2`) |
| PumpSwap | `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` | `CreatePool` |

The full reasoning, including why `confirmed` beats `processed` for alerts, is in [the lesson](https://nolimitnodes.com/academy/build-new-pool-alert-bot-solana).

## Quick start

You need Node.js 20 or newer and a [NoLimitNodes](https://nolimitnodes.com) API key on a plan that includes Yellowstone gRPC ([pricing](https://nolimitnodes.com/pricing)).

```bash
git clone https://github.com/no-limit-nodes/solana-new-pool-alert-bot.git
cd solana-new-pool-alert-bot
npm install

export NLN_API_KEY="your-api-key"   # https://app.nolimitnodes.com/register
npm test                             # offline check of the log matcher
npm start                            # start watching for new pools
```

Optional settings:

| Variable | Default | Purpose |
|---|---|---|
| `NLN_API_KEY` | required | Your NoLimitNodes API key |
| `NLN_GRPC_URL` | `https://grpc.mainnet.solana.nolimitnodes.com:443` | Yellowstone gRPC endpoint |
| `WEBHOOK_URL` | none | A Discord webhook URL that also receives every alert |

Leave it running. PumpSwap pools from PumpFun graduations usually show up first, because they are the most frequent. Open the explorer link on the first alert and check that the transaction really created a pool.

## Files

| File | What it does |
|---|---|
| [`src/detect.ts`](src/detect.ts) | The program table and the stack-based log matcher |
| [`src/pool-bot.ts`](src/pool-bot.ts) | Connects, subscribes to the five programs, answers pings and prints alerts |
| [`src/detect.test.ts`](src/detect.test.ts) | Offline tests with real log shapes, including the cases the bot must ignore |

## Make it yours

- **Add a DEX.** Add its program ID and create-instruction regex to `DEXES` in `src/detect.ts`. The filter picks it up automatically.
- **Screen the token before you trade.** Check whether the mint and freeze authorities are still active. See the [token risk scanner guide](https://nolimitnodes.com/blog/solana-token-risk-scanner-mint-freeze-authority).
- **Reconnect.** The stream ends if the connection drops. Wrap the setup in a retry loop with exponential backoff, like the [`reconnect.ts` example](https://github.com/no-limit-nodes/yellowstone-grpc-typescript-client/blob/main/src/reconnect.ts).
- **Never miss a pool.** Validators truncate very long logs. For full coverage, decode the instructions against each program's IDL instead of reading the logs.
- **Go deeper.** [Detecting new Solana liquidity pools](https://nolimitnodes.com/blog/detect-new-solana-liquidity-pools-raydium-meteora-orca-pumpswap) covers more DEXes, pool fields and edge cases.

## FAQ

**How do I detect new liquidity pools on Solana?**
Subscribe to transactions that mention each DEX program at `confirmed` commitment, and look for that program's pool-creation instruction (for example `CreatePool` on PumpSwap or `InitializeLbPair` on Meteora DLMM) in that program's own log lines.

**Why not use `logsSubscribe` over WebSocket?**
`logsSubscribe` takes only one address per subscription and sends only the logs. Yellowstone gRPC covers all five programs in one filter and includes the full transaction, so the bot can read the mints without a second call.

**Does it catch PumpFun graduations?**
Yes. A graduation creates a PumpSwap pool, and the bot reports it under PumpSwap.

**Can the bot buy automatically?**
No, it only sends alerts. New pools carry real risks such as rugs and honeypots. Check a token's mint and freeze authority before you trade it.

## Learn more on NoLimitNodes Academy

- [Build a Solana new-pool alert bot](https://nolimitnodes.com/academy/build-new-pool-alert-bot-solana): the full walkthrough for this repo
- [Your first Yellowstone gRPC client in TypeScript](https://nolimitnodes.com/academy/first-yellowstone-grpc-client-typescript): the connection, request format and ping handling this bot reuses ([code](https://github.com/no-limit-nodes/yellowstone-grpc-typescript-client))
- [Slots, blocks and commitment levels, explained](https://nolimitnodes.com/academy/solana-slots-blocks-commitment-explained)
- [5 ways to get real-time Solana data, compared](https://nolimitnodes.com/academy/ways-to-get-real-time-solana-data-compared)
- [Practice quizzes](https://nolimitnodes.com/academy/practice): test what you know in 60 seconds

## License

MIT
