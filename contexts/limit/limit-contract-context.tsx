import React, { useCallback } from 'react'
import { usePublicClient, useQueryClient, useWalletClient } from 'wagmi'

import { calculateValue } from '../../utils/order-book'
import { useChainContext } from '../chain-context'
import { GAS_PROTECTION } from '../../constants/gas'
import { useTransactionContext } from '../transaction-context'
import { formatUnits } from '../../utils/bigint'
import { Market } from '../../model/market'
import { writeContract } from '../../utils/wallet'
import { CHAIN_IDS } from '../../constants/chain'
import { CONTRACT_ADDRESSES } from '../../constants/addresses'
import { MarketRouter__factory } from '../../typechain'
import { approve20 } from '../../utils/approve20'
import { ClaimParamsList } from '../../model/order-key'

import { useLimitCurrencyContext } from './limit-currency-context'

type LimitContractContext = {
  limit: (
    market: Market,
    userAddress: `0x${string}`,
    priceIndex: number,
    rawAmount: bigint,
    baseAmount: bigint,
    claimBounty: bigint,
    postOnly: boolean,
    claimParamsList?: ClaimParamsList,
  ) => Promise<void>
}

const Context = React.createContext<LimitContractContext>({
  limit: () => Promise.resolve(),
})

export const LimitContractProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const queryClient = useQueryClient()

  const { selectedChain } = useChainContext()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { setConfirmation } = useTransactionContext()
  const { balances } = useLimitCurrencyContext()

  const limit = useCallback(
    async (
      market: Market,
      userAddress: `0x${string}`,
      priceIndex: number,
      rawAmount: bigint,
      baseAmount: bigint,
      claimBounty: bigint,
      postOnly: boolean,
      claimParamsList?: ClaimParamsList,
    ) => {
      if (rawAmount > 0n && baseAmount > 0n) {
        throw new Error('Cannot have both rawAmount and baseAmount')
      }
      if (!walletClient || !selectedChain) {
        return
      }
      const isBid = rawAmount > 0n
      const inputCurrency = isBid ? market.quoteToken : market.baseToken
      const amountIn = isBid ? market.rawToQuote(rawAmount) : baseAmount
      const marketRouter =
        CONTRACT_ADDRESSES[selectedChain.id as CHAIN_IDS].MarketRouter

      const { value, useNative, withClaim } = calculateValue(
        inputCurrency,
        amountIn,
        claimBounty,
        selectedChain.defaultGasPrice - GAS_PROTECTION,
        balances,
      )
      if (!claimParamsList) {
        throw new Error('claimParamsList is required')
      }

      try {
        setConfirmation({
          title: `Approve`,
          body: 'Please confirm in your wallet.',
          fields: [
            {
              currency: inputCurrency,
              label: inputCurrency.symbol,
              value: formatUnits(amountIn, inputCurrency.decimals),
            },
          ],
        })

        await approve20(
          selectedChain.id,
          walletClient,
          inputCurrency,
          userAddress,
          marketRouter,
          amountIn,
        )

        setConfirmation({
          title: `Limit ${isBid ? 'Bid' : 'Ask'}`,
          body: 'Please confirm in your wallet.',
          fields: [
            {
              currency: inputCurrency,
              label: inputCurrency.symbol,
              value: formatUnits(amountIn, inputCurrency.decimals),
            },
          ],
        })

        const limitOrderParams = {
          market: market.address,
          deadline: BigInt(
            Math.floor(new Date().getTime() / 1000 + selectedChain.expireIn),
          ),
          user: userAddress,
          rawAmount: isBid ? rawAmount : 0n,
          priceIndex,
          postOnly,
          useNative,
          claimBounty: claimBounty / 1000000000n, // GWEI
          baseAmount: isBid ? 0n : baseAmount,
        }

        if (withClaim) {
          await writeContract(publicClient, walletClient, {
            address: marketRouter,
            abi: MarketRouter__factory.abi,
            functionName: isBid ? 'limitBidAfterClaim' : 'limitAskAfterClaim',
            args: [claimParamsList, limitOrderParams],
            value,
          })
        } else {
          await writeContract(publicClient, walletClient, {
            address: marketRouter,
            abi: MarketRouter__factory.abi,
            functionName: isBid ? 'limitBid' : 'limitAsk',
            args: [limitOrderParams],
            value,
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        await Promise.all([
          queryClient.invalidateQueries(['limit-balances']),
          queryClient.invalidateQueries(['open-orders']),
          queryClient.invalidateQueries(['markets']),
        ])
        setConfirmation(undefined)
      }
    },
    [
      balances,
      publicClient,
      queryClient,
      selectedChain,
      setConfirmation,
      walletClient,
    ],
  )
  return (
    <Context.Provider
      value={{
        limit,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useLimitContractContext = () =>
  React.useContext(Context) as LimitContractContext
