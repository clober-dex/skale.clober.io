import React, { useEffect } from 'react'
import { useNetwork } from 'wagmi'

import { Chain } from '../model/chain'
import { supportChains } from '../constants/chain'

type ChainContext = {
  selectedChain: Chain
  setSelectedChain: (chain: Chain) => void
}

const Context = React.createContext<ChainContext>({
  selectedChain: supportChains[0],
  setSelectedChain: (_) => _,
})

export const ChainProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { chain } = useNetwork()
  const [selectedChain, setSelectedChain] = React.useState<Chain>(
    supportChains[0], // TODO: cache localstorage
  )

  useEffect(() => {
    if (chain) {
      setSelectedChain(supportChains.find((c) => c.id === chain.id)!)
    }
  }, [chain])

  return (
    <Context.Provider value={{ selectedChain, setSelectedChain }}>
      {children}
    </Context.Provider>
  )
}

export const useChainContext = () => React.useContext(Context) as ChainContext
