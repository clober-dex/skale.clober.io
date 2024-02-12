import React, { useMemo } from 'react'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getAddress, isAddressEqual, zeroAddress } from 'viem'

import { Balances } from '../../model/balances'
import { Currency } from '../../model/currency'
import { Prices } from '../../model/prices'
import { fetchCurrencies } from '../../apis/swap/currencies'
import { AGGREGATORS } from '../../constants/aggregators'
import { CHAIN_IDS } from '../../constants/chain'
import { fetchPrices } from '../../apis/swap/prices'
import { useChainContext } from '../chain-context'
import { ERC20_PERMIT_ABI } from '../../abis/@openzeppelin/erc20-permit-abi'

type SwapCurrencyContext = {
  currencies: Currency[]
  prices: Prices
  balances: Balances
}

const Context = React.createContext<SwapCurrencyContext>({
  currencies: [],
  prices: {},
  balances: {},
})

export const SwapCurrencyProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const { address: userAddress } = useAccount()
  const { data: balance } = useBalance({ address: userAddress })
  const { selectedChain } = useChainContext()

  const { data: currencies } = useQuery({
    queryKey: ['swap-currencies', selectedChain.id],
    queryFn: async () =>
      fetchCurrencies(AGGREGATORS[selectedChain.id as CHAIN_IDS]),
  })

  const { data: prices } = useQuery({
    queryKey: ['swap-prices', selectedChain.id],
    queryFn: async () => {
      return fetchPrices(AGGREGATORS[selectedChain.id as CHAIN_IDS])
    },
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  })

  const uniqueCurrencies = useMemo(() => {
    if (!currencies) {
      return []
    }
    return currencies
      .filter((currency) => !isAddressEqual(currency.address, zeroAddress))
      .filter(
        (currency, index, self) =>
          self.findIndex((c) => c.address === currency.address) === index,
      )
  }, [currencies])

  const results = useReadContracts({
    contracts: uniqueCurrencies.map((currency) => ({
      address: currency.address,
      abi: ERC20_PERMIT_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })),
    allowFailure: true,
  })

  const { data: balances } = useQuery({
    queryKey: [
      'swap-balances',
      userAddress,
      balance ? balance.value.toString() : '0',
      uniqueCurrencies,
    ],
    queryFn: async () => {
      if (!userAddress || !uniqueCurrencies || !results.data) {
        return {}
      }
      return results.data.reduce(
        (acc: {}, { result }, index: number) => {
          const currency = uniqueCurrencies[index]
          return {
            ...acc,
            [getAddress(currency.address)]: result ?? 0n,
          }
        },
        {
          [zeroAddress]: balance?.value ?? 0n,
        },
      )
    },
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  }) as { data: Balances }

  return (
    <Context.Provider
      value={{
        currencies: currencies ?? [],
        prices: prices ?? {},
        balances: balances ?? {},
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useSwapCurrencyContext = () =>
  React.useContext(Context) as SwapCurrencyContext
