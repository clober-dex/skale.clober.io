import { Market } from '../../model/market'

export const dummyMarkets = [
  new Market(
    '0xcA4C669093572c5a23DE04B848a7f706eCBdFAC2',
    '0x0207EA1fC260325Dd67FdEc06C1b4ED6f6DF3924',
    3000n,
    1n,
    {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      name: 'USD Coin (Arb1)',
      symbol: 'USDC',
      decimals: 6,
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
    },
    1000000000000n,
    1n,
    [
      {
        price: 49629646176819n,
        rawAmount: 100000n,
        isBid: true,
      },
      {
        price: 18166966985638n,
        rawAmount: 181958n,
        isBid: true,
      },
    ],
    [
      {
        price: 1001834679998354n,
        rawAmount: 977972068n,
        isBid: false,
      },
      {
        price: 101370945330790181n,
        rawAmount: 1008817n,
        isBid: false,
      },
    ],
  ),
]
