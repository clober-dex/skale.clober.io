import React, { useMemo } from 'react'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getAddress, zeroAddress } from 'viem'

import { Balances } from '../../model/balances'
import { ERC20_PERMIT_ABI } from '../../abis/@openzeppelin/erc20-permit-abi'

import { useMarketContext } from './market-context'

type LimitCurrencyContext = {
  balances: Balances
}

const Context = React.createContext<LimitCurrencyContext>({
  balances: {},
})

export const LimitCurrencyProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const { address: userAddress } = useAccount()
  const { data: balance } = useBalance({ address: userAddress })
  const { markets } = useMarketContext()

  const uniqueCurrencies = useMemo(() => {
    return [
      ...markets.map((market) => market.quoteToken),
      ...markets.map((market) => market.baseToken),
    ].filter(
      (currency, index, self) =>
        self.findIndex((c) => c.address === currency.address) === index,
    )
  }, [markets])

  const results = useReadContracts({
    contracts: uniqueCurrencies.map((currency) => ({
      address: currency.address,
      abi: ERC20_PERMIT_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    })),
  })

  const { data: balances } = useQuery({
    queryKey: [
      'limit-balances',
      userAddress,
      balance ? balance.value.toString() : '0',
      uniqueCurrencies,
    ],
    queryFn: async () => {
      if (!userAddress || !results.data) {
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
        balances: balances ?? {},
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useLimitCurrencyContext = () =>
  React.useContext(Context) as LimitCurrencyContext
