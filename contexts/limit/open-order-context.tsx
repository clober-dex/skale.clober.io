import React, { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { getAddress } from 'viem'
import { useQuery } from '@tanstack/react-query'

import { OpenOrder } from '../../model/open-order'
import { fetchOpenOrders } from '../../apis/open-orders'
import { useChainContext } from '../chain-context'
import { Balances } from '../../model/balances'
import {
  CancelParamsList,
  ClaimOrderParamsStruct,
  ClaimParamsListMap,
  OrderKeyStruct,
} from '../../model/order-key'

type OpenOrderContext = {
  openOrders: OpenOrder[]
  claimable: Balances
  claimParamsListMap: ClaimParamsListMap
  cancelParamsList: CancelParamsList
}

const Context = React.createContext<OpenOrderContext>({
  openOrders: [],
  claimable: {},
  claimParamsListMap: {},
  cancelParamsList: [],
})

export const OpenOrderProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const { address: userAddress } = useAccount()
  const { selectedChain } = useChainContext()

  const { data: openOrders } = useQuery({
    queryKey: ['open-orders', selectedChain.id, userAddress],
    queryFn: () =>
      userAddress ? fetchOpenOrders(selectedChain.id, userAddress) : [],
    refetchIntervalInBackground: true,
    refetchInterval: 10 * 1000,
    initialData: [],
  })
  const claimable = useMemo(
    () =>
      openOrders.reduce((acc, openOrder) => {
        acc[getAddress(openOrder.outputToken.address)] =
          (acc[getAddress(openOrder.outputToken.address)] ?? 0n) +
          openOrder.claimableAmount
        return acc
      }, {} as Balances),
    [openOrders],
  )

  const claimParamsListMap = useMemo(
    () =>
      (
        Object.entries(
          openOrders
            .filter((openOrder) => openOrder.claimableAmount > 0n)
            .reduce(
              (acc, openOrder) => {
                acc[openOrder.outputToken.address] =
                  acc[openOrder.outputToken.address] ?? {}
                acc[openOrder.outputToken.address][openOrder.marketAddress] = [
                  ...(acc[openOrder.outputToken.address][
                    openOrder.marketAddress
                  ] ?? []),
                  {
                    isBid: openOrder.isBid,
                    priceIndex: openOrder.priceIndex,
                    orderIndex: openOrder.orderIndex,
                  },
                ] as OrderKeyStruct[]
                return acc
              },
              {} as {
                [currencyAddress in `0x${string}`]: {
                  [marketAddress in `0x${string}`]: OrderKeyStruct[]
                }
              },
            ),
        ).map(([currencyAddress, marketMap]) => [
          currencyAddress,
          Object.entries(marketMap).map(
            ([marketAddress, orderKeys]) =>
              ({
                market: getAddress(marketAddress),
                orderKeys,
              }) as ClaimOrderParamsStruct,
          ),
        ]) as [`0x${string}`, ClaimOrderParamsStruct[]][]
      ).reduce(
        (acc, [currencyAddress, claimOrderParamsList]) => ({
          ...acc,
          [getAddress(currencyAddress)]: claimOrderParamsList,
        }),
        {} as ClaimParamsListMap,
      ),
    [openOrders],
  )

  const cancelParamsList = useMemo(
    () =>
      Object.entries(
        openOrders.reduce(
          (acc, openOrder) => {
            acc[openOrder.marketAddress] = [
              ...(acc[openOrder.marketAddress] ?? []),
              openOrder.nftId,
            ]
            return acc
          },
          {} as {
            [marketAddress in `0x${string}`]: bigint[]
          },
        ),
      ).map(([marketAddress, nftIds]) => ({
        market: getAddress(marketAddress),
        tokenIds: nftIds,
      })) as CancelParamsList,
    [openOrders],
  )

  return (
    <Context.Provider
      value={{
        openOrders,
        claimable,
        claimParamsListMap,
        cancelParamsList,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useOpenOrderContext = () =>
  React.useContext(Context) as OpenOrderContext
