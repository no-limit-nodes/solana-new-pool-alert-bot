// Watch Raydium AMM v4, Raydium CPMM, Meteora DLMM, Orca Whirlpool and PumpSwap over one
// Yellowstone gRPC stream and print an alert when a liquidity pool is created.
// Run: npm start
// Optional: set WEBHOOK_URL to a Discord webhook to also post each alert there.
import Client, { CommitmentLevel, type SubscribeRequest, type SubscribeUpdate } from '@triton-one/yellowstone-grpc'
import bs58 from 'bs58'
import { DEXES, findPoolCreation } from './detect.js'

const ENDPOINT = process.env.NLN_GRPC_URL ?? 'https://grpc.mainnet.solana.nolimitnodes.com:443'
const WEBHOOK_URL = process.env.WEBHOOK_URL

const EMPTY: SubscribeRequest = {
  accounts: {}, slots: {}, transactions: {}, transactionsStatus: {},
  blocks: {}, blocksMeta: {}, entry: {}, blockFooter: {}, accountsDataSlice: [],
}

async function notify(text: string) {
  if (!WEBHOOK_URL) return
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    })
  } catch (err) {
    console.error('webhook failed:', (err as Error).message)
  }
}

function alert(update: SubscribeUpdate) {
  const tx = update.transaction?.transaction
  const dex = findPoolCreation(tx?.meta?.logMessages ?? [])
  if (!tx || !dex) return
  // postTokenBalances lists every token account the transaction left behind:
  // usually the new token and its pair (often wrapped SOL), sometimes an LP mint too.
  const mints = [...new Set((tx.meta?.postTokenBalances ?? []).map((b) => b.mint))]
  const link = `https://solscan.io/tx/${bs58.encode(tx.signature)}`
  console.log(`\n🆕 ${dex} pool  slot ${update.transaction!.slot}`)
  console.log(`   mints: ${mints.join(', ')}`)
  console.log(`   ${link}`)
  void notify(`New ${dex} pool\nmints: ${mints.join(', ')}\n${link}`)
}

if (!process.env.NLN_API_KEY) {
  console.error('Set NLN_API_KEY first: export NLN_API_KEY="your-api-key"')
  process.exit(1)
}

const client = new Client(ENDPOINT, process.env.NLN_API_KEY, {
  grpcMaxDecodingMessageSize: 64 * 1024 * 1024,
})
await client.connect()
const stream = await client.subscribe()

stream.on('data', (update: SubscribeUpdate) => {
  if (update.ping) stream.write({ ...EMPTY, ping: { id: 1 } }) // keep the connection open
  else alert(update)
})
stream.on('error', (err: Error) => { console.error(err.message); process.exit(1) })

stream.write({
  ...EMPTY,
  transactions: {
    pools: {
      vote: false,
      failed: false,                      // a failed create is not a pool
      accountInclude: Object.keys(DEXES), // any of the five programs
      accountExclude: [],
      accountRequired: [],
    },
  },
  commitment: CommitmentLevel.CONFIRMED,
})
console.log('watching', Object.values(DEXES).map((d) => d.name).join(', '))
process.on('SIGINT', () => { stream.end(); process.exit(0) })
