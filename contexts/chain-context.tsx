import React, { useCallback, useEffect } from 'react'
import { skaleEuropaTestnet } from 'viem/chains'
import { useAccount, useSwitchChain } from 'wagmi'

import { Chain } from '../model/chain'
import { findSupportChain, supportChains } from '../constants/chain'
import { setQueryParams } from '../utils/url'

type ChainContext = {
  selectedChain: Chain
  setSelectedChain: (chain: Chain) => void
}

const Context = React.createContext<ChainContext>({
  selectedChain: supportChains.find(
    (chain) => chain.id === skaleEuropaTestnet.id,
  )!,
  setSelectedChain: (_) => _,
})

const LOCAL_STORAGE_CHAIN_KEY = 'chain'
const QUERY_PARAM_CHAIN_KEY = 'chain'

export const ChainProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { chain: connectedChain } = useAccount()
  const [selectedChain, _setSelectedChain] = React.useState<Chain>(
    supportChains[0],
  )
  const { switchChain } = useSwitchChain({
    mutation: {
      onSuccess(data) {
        const chain = findSupportChain(data.id)
        if (chain) {
          _setSelectedChain(chain)
        }
      },
    },
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryParamChain = params.get(QUERY_PARAM_CHAIN_KEY)
      ? findSupportChain(parseInt(params.get(QUERY_PARAM_CHAIN_KEY)!, 10))
      : undefined
    const localStorageChain = localStorage.getItem(LOCAL_STORAGE_CHAIN_KEY)
      ? findSupportChain(
          parseInt(localStorage.getItem(LOCAL_STORAGE_CHAIN_KEY)!, 10),
        )
      : undefined
    const walletConnectedChain = connectedChain
      ? findSupportChain(connectedChain.id)
      : undefined

    if (queryParamChain) {
      _setSelectedChain(queryParamChain)
      localStorage.setItem(
        LOCAL_STORAGE_CHAIN_KEY,
        queryParamChain.id.toString(),
      )
      if (switchChain) {
        switchChain({ chainId: queryParamChain.id })
      }
      setQueryParams({
        chain: queryParamChain.id.toString(),
      })
    } else if (walletConnectedChain) {
      _setSelectedChain(walletConnectedChain)
      setQueryParams({
        chain: walletConnectedChain.id.toString(),
      })
      localStorage.setItem(
        LOCAL_STORAGE_CHAIN_KEY,
        walletConnectedChain.id.toString(),
      )
    } else if (localStorageChain) {
      _setSelectedChain(localStorageChain)
      setQueryParams({
        chain: localStorageChain.id.toString(),
      })
      if (switchChain) {
        switchChain({ chainId: localStorageChain.id })
      }
    } else {
      setQueryParams({
        chain: supportChains[0].id.toString(),
      })
    }
  }, [connectedChain, switchChain])

  const setSelectedChain = useCallback(
    (_chain: Chain) => {
      _setSelectedChain(_chain)
      localStorage.setItem(LOCAL_STORAGE_CHAIN_KEY, _chain.id.toString())
      setQueryParams({
        chain: _chain.id.toString(),
      })
      if (switchChain) {
        switchChain({ chainId: _chain.id })
      }
    },
    [switchChain],
  )

  return (
    <Context.Provider value={{ selectedChain, setSelectedChain }}>
      {children}
    </Context.Provider>
  )
}

export const useChainContext = () => React.useContext(Context) as ChainContext
