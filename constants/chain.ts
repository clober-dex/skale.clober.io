import { skaleEuropaTestnet } from 'viem/chains'

import { Chain } from '../model/chain'

export const supportChains: Chain[] =
  process.env.BUILD === 'dev'
    ? [
        {
          ...skaleEuropaTestnet,
          defaultGasPrice: 0n,
          expireIn: 240,
        },
      ]
    : [
        {
          ...skaleEuropaTestnet,
          defaultGasPrice: 0n,
          expireIn: 240,
        },
      ]

export const findSupportChain = (chainId: number): Chain | undefined =>
  supportChains.find((chain) => chain.id === chainId)

export enum CHAIN_IDS {
  SKALE_EUROPA_TESTNET = skaleEuropaTestnet.id,
}
