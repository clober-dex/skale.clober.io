import { parseUnits } from 'viem'

import {
  Bar,
  DatafeedConfiguration,
  ErrorCallback,
  HistoryCallback,
  IBasicDataFeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
} from '../public/static/charting_library'
import { CHAIN_IDS } from '../constants/chain'
import { fetchChartLogs, fetchLatestChartLog } from '../apis/chart-logs'
import { Market } from '../model/market'

import { getPriceDecimals } from './prices'
import { SUPPORTED_INTERVALS } from './chart'

const configurationData: Partial<DatafeedConfiguration> &
  Required<
    Pick<
      DatafeedConfiguration,
      'supported_resolutions' | 'exchanges' | 'symbols_types'
    >
  > = {
  supported_resolutions: ['60', '1D', '1W', '1M'] as ResolutionString[],
  exchanges: [
    {
      value: 'Clober',
      name: 'Clober',
      desc: 'Clober',
    },
  ],
  symbols_types: [
    {
      name: 'crypto',
      // `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
      value: 'crypto',
    },
  ],
}

export default class DataFeed implements IBasicDataFeed {
  private listenerGuids: Set<string> = new Set<string>()

  private chainId: CHAIN_IDS
  private market: Market
  constructor(chainId: CHAIN_IDS, market: Market) {
    this.chainId = chainId
    this.market = market
  }
  onReady(callback: OnReadyCallback) {
    setTimeout(() => callback(configurationData))
  }

  async searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: SearchSymbolsCallback,
  ) {
    onResult([])
  }

  async resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback,
  ) {
    const { close } = await fetchLatestChartLog(
      this.chainId,
      this.market.address,
    )
    if (close === '0') {
      onError('cannot resolve symbol')
      return
    }

    onResolve({
      name: symbolName, // display name for users
      ticker: symbolName,
      full_name: symbolName,
      description: symbolName,
      type: 'crypto',
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: 'Clober',
      listed_exchange: 'Clober',
      minmov: 1,
      pricescale:
        10 **
        getPriceDecimals(parseUnits(close, 18), this.market.d, this.market.r),
      has_intraday: true, // has minutes historical data
      has_weekly_and_monthly: false, // has weekly data
      visible_plots_set: 'ohlcv',
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      data_status: 'streaming',
      format: 'price',
    } as LibrarySymbolInfo)
  }

  async getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: HistoryCallback,
    onError: ErrorCallback,
  ) {
    try {
      const { from, to } = periodParams
      const resolutionKey = (SUPPORTED_INTERVALS.find(
        (interval) => interval[0] === resolution,
      ) || SUPPORTED_INTERVALS[0])[1]

      const chartLogs = await fetchChartLogs(
        this.chainId,
        this.market.address,
        resolutionKey,
        from,
        to,
      )
      if (chartLogs.length === 0) {
        onResult([], {
          noData: false,
        })
        return
      }

      const bars = chartLogs.map<Bar>((v, index) => ({
        time: Number(v.timestamp),
        open: Number(index === 0 ? v.open : chartLogs[index - 1].close),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
        volume: Number(v.baseVolume),
      }))

      onResult(bars, {
        noData: false,
      })
    } catch (error) {
      onError((error as Error).message)
    }
  }

  subscribeBars(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    symbolInfo: LibrarySymbolInfo,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    resolution: ResolutionString,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTick: SubscribeBarsCallback,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    listenerGuid: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onResetCacheNeededCallback: () => void,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unsubscribeBars(listenerGuid: string) {}
}
