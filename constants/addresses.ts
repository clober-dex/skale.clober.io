import { CHAIN_IDS } from './chain'

export const CONTRACT_ADDRESSES: {
  [chain in CHAIN_IDS]: {
    MarketRouter: `0x${string}`
    OrderCanceler: `0x${string}`
  }
} = {
  [CHAIN_IDS.SKALE_EUROPA_TESTNET]: {
    MarketRouter: '0xBe84BD49aAf710Cc11FA9675c79D107af8552f17' as `0x${string}`,
    OrderCanceler:
      '0x1fA03eDB1B8839a5319A7D2c1Ae6AAE492342bAD' as `0x${string}`,
  },
}
