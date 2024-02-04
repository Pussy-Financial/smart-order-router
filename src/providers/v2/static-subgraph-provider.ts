import { ChainId, Token } from '@pussyfinancial/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import _ from 'lodash';

import { WRAPPED_NATIVE_CURRENCY } from '../../util/chains';
import { log } from '../../util/log';
import {
  ARB_ARBITRUM,
  BTC_BNB,
  BUSD_BNB,
  CELO,
  CEUR_CELO,
  CUSD_CELO,
  DAI_ARBITRUM,
  DAI_ARBITRUM_SEPOLIA,
  DAI_AVAX,
  DAI_BNB,
  DAI_CELO,
  DAI_HARDHAT,
  DAI_MAINNET,
  DAI_MOONBEAM,
  DAI_OPTIMISM,
  DAI_OPTIMISM_SEPOLIA,
  ETH_BNB,
  OP_ARBITRUM_SEPOLIA,
  OP_OPTIMISM,
  OP_OPTIMISM_SEPOLIA,
  USDC_ARBITRUM,
  USDC_ARBITRUM_SEPOLIA,
  USDC_AVAX,
  USDC_BASE,
  USDC_BNB,
  USDC_HARDHAT,
  USDC_MAINNET,
  USDC_MOONBEAM,
  USDC_OPTIMISM,
  USDC_OPTIMISM_SEPOLIA,
  USDC_POLYGON,
  USDT_ARBITRUM,
  USDT_ARBITRUM_SEPOLIA,
  USDT_BNB,
  USDT_HARDHAT,
  USDT_MAINNET,
  USDT_OPTIMISM,
  USDT_OPTIMISM_SEPOLIA,
  WBTC_ARBITRUM,
  WBTC_ARBITRUM_SEPOLIA,
  WBTC_HARDHAT,
  WBTC_MAINNET,
  WBTC_MOONBEAM,
  WBTC_OPTIMISM,
  WBTC_OPTIMISM_SEPOLIA,
  WETH_POLYGON,
  WMATIC_POLYGON,
} from '../token-provider';

import { IV2SubgraphProvider, V2SubgraphPool } from './subgraph-provider';

type ChainTokenList = {
  readonly [chainId in ChainId]: Token[];
};

const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.MAINNET]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET]!,
    DAI_MAINNET,
    USDC_MAINNET,
    USDT_MAINNET,
    WBTC_MAINNET,
  ],
  [ChainId.HARDHAT]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.HARDHAT]!,
    DAI_HARDHAT,
    USDC_HARDHAT,
    USDT_HARDHAT,
    WBTC_HARDHAT,
  ],
  [ChainId.OPTIMISM_SEPOLIA]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISM_SEPOLIA]!,
    USDC_OPTIMISM_SEPOLIA,
    DAI_OPTIMISM_SEPOLIA,
    USDT_OPTIMISM_SEPOLIA,
    WBTC_OPTIMISM_SEPOLIA,
    OP_OPTIMISM_SEPOLIA
  ],
  [ChainId.ARBITRUM_SEPOLIA]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_SEPOLIA]!,
    USDC_ARBITRUM_SEPOLIA,
    DAI_ARBITRUM_SEPOLIA,
    USDT_ARBITRUM_SEPOLIA,
    WBTC_ARBITRUM_SEPOLIA,
    OP_ARBITRUM_SEPOLIA
  ],
  //...
  [ChainId.GOERLI]: [WRAPPED_NATIVE_CURRENCY[ChainId.GOERLI]!],
  [ChainId.SEPOLIA]: [WRAPPED_NATIVE_CURRENCY[ChainId.SEPOLIA]!],
  //v2 not deployed on [arbitrum, polygon, celo, gnosis, moonbeam, bnb, avalanche] and their testnets
  [ChainId.OPTIMISM]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISM]!,
    USDC_OPTIMISM,
    DAI_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
    OP_OPTIMISM
  ],
  [ChainId.ARBITRUM_ONE]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_ONE]!,
    WBTC_ARBITRUM,
    DAI_ARBITRUM,
    USDC_ARBITRUM,
    USDT_ARBITRUM,
    ARB_ARBITRUM,
  ],
  [ChainId.ARBITRUM_GOERLI]: [],
  [ChainId.OPTIMISM_GOERLI]: [],
  [ChainId.POLYGON]: [USDC_POLYGON, WETH_POLYGON, WMATIC_POLYGON],
  [ChainId.POLYGON_MUMBAI]: [],
  [ChainId.CELO]: [CELO, CUSD_CELO, CEUR_CELO, DAI_CELO],
  [ChainId.CELO_ALFAJORES]: [],
  [ChainId.GNOSIS]: [],
  [ChainId.MOONBEAM]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.MOONBEAM],
    DAI_MOONBEAM,
    USDC_MOONBEAM,
    WBTC_MOONBEAM,
  ],
  [ChainId.BNB]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.BNB],
    BUSD_BNB,
    DAI_BNB,
    USDC_BNB,
    USDT_BNB,
    BTC_BNB,
    ETH_BNB,
  ],
  [ChainId.AVALANCHE]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.AVALANCHE],
    USDC_AVAX,
    DAI_AVAX,
  ],
  [ChainId.BASE_GOERLI]: [],
  [ChainId.BASE]: [WRAPPED_NATIVE_CURRENCY[ChainId.BASE], USDC_BASE ],
};

/**
 * Provider that does not get data from an external source and instead returns
 * a hardcoded list of Subgraph pools.
 *
 * Since the pools are hardcoded, the liquidity/price values are dummys and should not
 * be depended on.
 *
 * Useful for instances where other data sources are unavailable. E.g. subgraph not available.
 *
 * @export
 * @class StaticV2SubgraphProvider
 */
export class StaticV2SubgraphProvider implements IV2SubgraphProvider {
  constructor(private chainId: ChainId) {}

  public async getPools(
    tokenIn?: Token,
    tokenOut?: Token
  ): Promise<V2SubgraphPool[]> {
    log.info('In static subgraph provider for V2');
    const bases = BASES_TO_CHECK_TRADES_AGAINST[this.chainId];

    const basePairs: [Token, Token][] = _.flatMap(
      bases,
      (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase])
    );

    if (tokenIn && tokenOut) {
      basePairs.push(
        [tokenIn, tokenOut],
        ...bases.map((base): [Token, Token] => [tokenIn, base]),
        ...bases.map((base): [Token, Token] => [tokenOut, base])
      );
    }

    const pairs: [Token, Token][] = _(basePairs)
      .filter((tokens): tokens is [Token, Token] =>
        Boolean(tokens[0] && tokens[1])
      )
      .filter(
        ([tokenA, tokenB]) =>
          tokenA.address !== tokenB.address && !tokenA.equals(tokenB)
      )
      .value();

    const poolAddressSet = new Set<string>();

    const subgraphPools: V2SubgraphPool[] = _(pairs)
      .map(([tokenA, tokenB]) => {
        const poolAddress = Pair.getAddress(tokenA, tokenB);

        if (poolAddressSet.has(poolAddress)) {
          return undefined;
        }
        poolAddressSet.add(poolAddress);

        const [token0, token1] = tokenA.sortsBefore(tokenB)
          ? [tokenA, tokenB]
          : [tokenB, tokenA];

        return {
          id: poolAddress,
          liquidity: '100',
          token0: {
            id: token0.address,
          },
          token1: {
            id: token1.address,
          },
          supply: 100,
          reserve: 100,
          reserveUSD: 100,
        };
      })
      .compact()
      .value();

    return subgraphPools;
  }
}
