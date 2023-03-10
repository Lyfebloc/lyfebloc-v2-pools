import { bn } from "../../utils/big-number";
import { shallowCopyAll } from "../../utils/common";
import BasePool, { IBasePoolParams, IBasePoolToken } from "../base";
import * as math from "./math";

export interface IStablePoolToken extends IBasePoolToken {}

export interface IStablePoolParams extends IBasePoolParams {
  tokens: IStablePoolToken[];
  amplificationParameter: string;
}

export default class StablePool extends BasePool {
  private _tokens: IStablePoolToken[];
  private _amplificationParameter: string;

  // ---------------------- Getters ----------------------

  get tokens() {
    // Shallow-copy to disallow direct changes
    return shallowCopyAll(this._tokens);
  }

  get amplificationParameter() {
    return bn(this._amplificationParameter).idiv(math.AMP_PRECISION).toString();
  }

  // ---------------------- Constructor ----------------------

  constructor(params: IStablePoolParams) {
    super(params);

    if (params.tokens.length > math.MAX_STABLE_TOKENS) {
      throw new Error("MAX_STABLE_TOKENS");
    }

    this._tokens = shallowCopyAll(params.tokens);

    if (bn(params.amplificationParameter).lt(math.MIN_AMP)) {
      throw new Error("MIN_AMP");
    }
    if (bn(params.amplificationParameter).gt(math.MAX_AMP)) {
      throw new Error("MAX_AMP");
    }

    this._amplificationParameter = bn(params.amplificationParameter)
      .times(math.AMP_PRECISION)
      .toString();
  }

  // ---------------------- Swap actions ----------------------

  public swapGivenIn(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountIn: string
  ): string {
    const tokenIndexIn = this._tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );
    const tokenIndexOut = this._tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenIn = this._tokens[tokenIndexIn];
    const tokenOut = this._tokens[tokenIndexOut];

    const scaledAmountOut = math._calcOutGivenIn(
      bn(this._amplificationParameter),
      this._tokens.map((t) => this._upScale(t.balance, t.decimals)),
      tokenIndexIn,
      tokenIndexOut,
      this._upScale(amountIn, tokenIn.decimals),
      {
        swapFeePercentage: this._upScale(this._swapFeePercentage, 18),
        tokenInDecimals: tokenIn.decimals,
      }
    );
    const amountOut = this._downScaleDown(scaledAmountOut, tokenOut.decimals);

    // In-place balance updates
    if (!this._query) {
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();
    }

    return amountOut.toString();
  }

  public swapGivenOut(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountOut: string
  ): string {
    const tokenIndexIn = this._tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );
    const tokenIndexOut = this._tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenIn = this._tokens[tokenIndexIn];
    const tokenOut = this._tokens[tokenIndexOut];

    const scaledAmountIn = math._calcInGivenOut(
      bn(this._amplificationParameter),
      this._tokens.map((t) => this._upScale(t.balance, t.decimals)),
      tokenIndexIn,
      tokenIndexOut,
      this._upScale(amountOut, tokenOut.decimals),
      {
        swapFeePercentage: this._upScale(this._swapFeePercentage, 18),
        tokenInDecimals: tokenIn.decimals,
      }
    );
    const amountIn = this._downScaleUp(scaledAmountIn, tokenIn.decimals);

    // In-place balance updates
    if (!this._query) {
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();
    }

    return amountIn.toString();
  }

  // ---------------------- LP actions ----------------------

  public joinExactTokensInForBptOut(amountsIn: {
    [symbol: string]: string;
  }): string {
    if (Object.keys(amountsIn).length !== this._tokens.length) {
      throw new Error("Invalid input");
    }

    const scaledBptOut = math._calcBptOutGivenExactTokensIn(
      bn(this._amplificationParameter),
      this._tokens.map((t) => this._upScale(t.balance, t.decimals)),
      this._tokens.map((t) => this._upScale(amountsIn[t.symbol], t.decimals)),
      this._upScale(this._lbptTotalSupply, 18),
      this._upScale(this._swapFeePercentage, 18)
    );
    const bptOut = this._downScaleDown(scaledBptOut, 18);

    // In-place balance updates
    if (!this._query) {
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .plus(amountsIn[token.symbol])
          .toString();
      }
      this._lbptTotalSupply = bn(this._lbptTotalSupply).plus(bptOut).toString();
    }

    return bptOut.toString();
  }

  public joinTokenInForExactBptOut(
    tokenInSymbol: string,
    bptOut: string
  ): string {
    const tokenIndex = this._tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );

    const tokenIn = this._tokens[tokenIndex];
    if (!tokenIn) {
      throw new Error("Invalid input");
    }

    const scaledAmountIn = math._calcTokenInGivenExactBptOut(
      bn(this._amplificationParameter),
      this._tokens.map((t) => this._upScale(t.balance, t.decimals)),
      tokenIndex,
      this._upScale(bptOut, 18),
      this._upScale(this._lbptTotalSupply, 18),
      this._upScale(this._swapFeePercentage, 18)
    );
    const amountIn = this._downScaleUp(scaledAmountIn, tokenIn.decimals);

    // In-place balance updates
    if (!this._query) {
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
      this._lbptTotalSupply = bn(this._lbptTotalSupply).plus(bptOut).toString();
    }

    return amountIn.toString();
  }

  public exitExactLbptInForTokenOut(
    tokenOutSymbol: string,
    llbptIn: string
  ): string {
    const tokenIndex = this._tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenOut = this._tokens[tokenIndex];
    if (!tokenOut) {
      throw new Error("Invalid input");
    }

    const scaledAmountOut = math._calcTokenOutGivenExactLbptIn(
      bn(this._amplificationParameter),
      this._tokens.map((t) => this._upScale(t.balance, t.decimals)),
      tokenIndex,
      this._upScale(llbptIn, 18),
      this._upScale(this._lbptTotalSupply, 18),
      this._upScale(this._swapFeePercentage, 18)
    );
    const amountOut = this._downScaleDown(scaledAmountOut, tokenOut.decimals);

    // In-place balance updates
    if (!this._query) {
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();
      this._lbptTotalSupply = bn(this._lbptTotalSupply).minus(llbptIn).toString();
    }

    return amountOut.toString();
  }

  public exitExactLbptInForTokensOut(llbptIn: string): string[] {
    // Exactly match the EVM version
    if (bn(llbptIn).gt(this._lbptTotalSupply)) {
      throw new Error("LBPT in exceeds total supply");
    }

    const scaledAmountsOut = math._calcTokensOutGivenExactLbptIn(
      this._tokens.map((t) => this._upScale(t.balance, t.decimals)),
      this._upScale(llbptIn, 18),
      this._upScale(this._lbptTotalSupply, 18)
    );
    const amountsOut = scaledAmountsOut.map((amount, i) =>
      this._downScaleDown(amount, this._tokens[i].decimals)
    );

    // In-place balance updates
    if (!this._query) {
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance).minus(amountsOut[i]).toString();
      }
      this._lbptTotalSupply = bn(this._lbptTotalSupply).minus(llbptIn).toString();
    }

    return amountsOut.map((a) => a.toString());
  }

  public exitLbptInForExactTokensOut(amountsOut: {
    [symbol: string]: string;
  }): string {
    if (Object.keys(amountsOut).length !== this._tokens.length) {
      throw new Error("Invalid input");
    }

    const scaledLbptIn = math._calcLbptInGivenExactTokensOut(
      bn(this._amplificationParameter),
      this._tokens.map((t) => this._upScale(t.balance, t.decimals)),
      this._tokens.map((t) => this._upScale(amountsOut[t.symbol], t.decimals)),
      this._upScale(this._lbptTotalSupply, 18),
      this._upScale(this._swapFeePercentage, 18)
    );
    const llbptIn = this._downScaleDown(scaledLbptIn, 18);

    // In-place balance updates
    if (!this._query) {
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .minus(amountsOut[token.symbol])
          .toString();
      }
      this._lbptTotalSupply = bn(this._lbptTotalSupply).minus(llbptIn).toString();
    }

    return llbptIn.toString();
  }
}
