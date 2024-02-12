import { CHAIN_IDS } from './chain'

export const SUBGRAPH_URL: {
  [chain in CHAIN_IDS]: string
} = {
  [CHAIN_IDS.SKALE_EUROPA_TESTNET]:
    'https://dev-skale.clober-api.com/subgraphs/name/core-v1-subgraph',
}
