import { Chain as WagmiChain } from 'viem'

export type Chain = WagmiChain & {
  expireIn: number
  defaultGasPrice: bigint
  icon?: string
}

export const toWagmiChain = (chain: Chain): WagmiChain => {
  return {
    id: chain.id,
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls,
    blockExplorers: chain.blockExplorers,
    contracts: chain.contracts,
  }
}
