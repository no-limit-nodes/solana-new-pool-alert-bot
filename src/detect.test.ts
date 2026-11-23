// Offline check of the log matcher. Run: npm test
import assert from 'node:assert/strict'
import { findPoolCreation } from './detect.js'

// Shortened logs from a real PumpSwap pool creation.
const pumpswapCreate = [
  'Program ComputeBudget111111111111111111111111111111 invoke [1]',
  'Program ComputeBudget111111111111111111111111111111 success',
  'Program pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA invoke [1]',
  'Program log: Instruction: CreatePool',
  'Program 11111111111111111111111111111111 invoke [2]',
  'Program 11111111111111111111111111111111 success',
  'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb invoke [2]',
  'Program log: Instruction: InitializeMint2',
  'Program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb success',
  'Program pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA success',
]
assert.equal(findPoolCreation(pumpswapCreate), 'PumpSwap')

// A swap on the same program is not a pool creation.
const pumpswapBuy = [
  'Program pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA invoke [1]',
  'Program log: Instruction: Buy',
  'Program pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA success',
]
assert.equal(findPoolCreation(pumpswapBuy), undefined)

// "Instruction: Initialize" written by another program must not count as Raydium CPMM.
const foreignInitialize = [
  'Program SomeRouter1111111111111111111111111111111111 invoke [1]',
  'Program log: Instruction: Initialize',
  'Program SomeRouter1111111111111111111111111111111111 success',
]
assert.equal(findPoolCreation(foreignInitialize), undefined)

// Meteora DLMM variants and Orca V2 match the same family.
const dlmm = [
  'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo invoke [1]',
  'Program log: Instruction: InitializeCustomizablePermissionlessLbPair',
  'Program LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo success',
]
assert.equal(findPoolCreation(dlmm), 'Meteora DLMM')
const orcaV2 = [
  'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [1]',
  'Program log: Instruction: InitializePoolV2',
  'Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success',
]
assert.equal(findPoolCreation(orcaV2), 'Orca Whirlpool')

console.log('detect: all checks passed')
