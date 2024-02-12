import { skaleEuropaTestnet } from 'viem/chains'

import { Chain } from '../model/chain'

export const supportChains: Chain[] =
  process.env.BUILD === 'dev'
    ? [
        {
          ...skaleEuropaTestnet,
          name: 'SKALE Europa',
          defaultGasPrice: 0n,
          expireIn: 240,
          icon: '/skale.png',
        },
      ]
    : [
        {
          ...skaleEuropaTestnet,
          name: 'SKALE Europa',
          defaultGasPrice: 0n,
          expireIn: 240,
          icon: '/skale.png',
        },
      ]

export const findSupportChain = (chainId: number): Chain | undefined =>
  supportChains.find((chain) => chain.id === chainId)

export enum CHAIN_IDS {
  SKALE_EUROPA_TESTNET = skaleEuropaTestnet.id,
}
