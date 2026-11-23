// Pool-creation instruction per DEX program, matched against that program's own log lines.
// Program IDs are mainnet.
export const DEXES: Record<string, { name: string; create: RegExp }> = {
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': { name: 'Raydium AMM v4', create: /^Program log: initialize2/ },
  CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C: { name: 'Raydium CPMM', create: /^Program log: Instruction: Initialize(WithPermission)?$/ },
  LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo: { name: 'Meteora DLMM', create: /^Program log: Instruction: Initialize\w*LbPair\w*$/ },
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: { name: 'Orca Whirlpool', create: /^Program log: Instruction: InitializePool\w*$/ },
  pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA: { name: 'PumpSwap', create: /^Program log: Instruction: CreatePool$/ },
}

// Walk the logs, tracking which program is running, and return the DEX whose create instruction ran.
// The stack matters: "Instruction: Initialize" can also come from the token program, a wallet or a router.
export function findPoolCreation(logs: string[]): string | undefined {
  const stack: string[] = []
  for (const line of logs) {
    const call = line.match(/^Program (\w+) invoke/)
    if (call) { stack.push(call[1]); continue }
    if (/^Program \w+ (success|failed)/.test(line)) { stack.pop(); continue }
    const dex = DEXES[stack.at(-1) ?? '']
    if (dex?.create.test(line)) return dex.name
  }
}
