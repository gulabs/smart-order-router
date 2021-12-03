import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
import { SwapRouter02__factory } from '../types/other';
import { log } from '../util';
import { IMulticallProvider } from './multicall-provider';
import { ApprovalTypes } from '@uniswap/router-sdk';

type TokenApprovalTypes = {
  approvalTokenIn: ApprovalTypes;
  approvalTokenOut: ApprovalTypes;
};

const SWAP_ROUTER_ADDRESS = '0x075B36dE1Bd11cb361c5B3B1E80A9ab0e7aa8a60';

/**
 * Provider for accessing the SwapRouter02 Contract .
 *
 * @export
 * @interface IRouterProvider
 */
export interface ISwapRouterProvider {
  /**
   * Get the approval method needed for each token. Throws an error if either query fails.
   *
   * @param tokenInAmount The Currency Amount of tokenIn needed by the user
   * @param tokenOutAmount The Currency Amount of tokenOut needed by the user
   * @returns the Approval Types for each token.
   */
  getApprovalType(
    tokenInAmount: CurrencyAmount<Currency>,
    tokenOutAmount: CurrencyAmount<Currency>
  ): Promise<TokenApprovalTypes>;
}

export class SwapRouterProvider implements ISwapRouterProvider {
  constructor(protected multicall2Provider: IMulticallProvider) {}

  public async getApprovalType(
    tokenInAmount: CurrencyAmount<Currency>,
    tokenOutAmount: CurrencyAmount<Currency>
  ): Promise<TokenApprovalTypes> {
    const functionParams: [string, string][] = [
      [
        tokenInAmount.currency.wrapped.address,
        tokenInAmount.quotient.toString(),
      ],
      [
        tokenOutAmount.currency.wrapped.address,
        tokenOutAmount.quotient.toString(),
      ],
    ];

    const tx =
      await this.multicall2Provider.callSameFunctionOnContractWithMultipleParams<
        [string, string],
        ApprovalTypes
      >({
        address: SWAP_ROUTER_ADDRESS,
        contractInterface: SwapRouter02__factory.createInterface(),
        functionName: 'getApprovalType',
        functionParams,
      });

    if (!tx.results[0]?.success || !tx.results[1]?.success) {
      log.info(
        { results: tx.results },
        'Failed to get approval type from swap router for token in or token out'
      );
      throw new Error(
        'Failed to get approval type from swap router for token in or token out'
      );
    }

    const { result: approvalTokenIn } = tx.results![0];
    const { result: approvalTokenOut } = tx.results![1];

    return { approvalTokenIn, approvalTokenOut };
  }
}