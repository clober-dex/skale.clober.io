import { Aggregator } from '../model/aggregator'

import { CHAIN_IDS } from './chain'

export const AGGREGATORS: {
  [chain in CHAIN_IDS]: Aggregator[]
} = {
  [CHAIN_IDS.SKALE_EUROPA_TESTNET]: [],
}
