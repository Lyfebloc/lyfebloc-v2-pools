import BigNumber, { bn, scale } from "../../utils/big-number";
import * as fp from "../../utils/math/fixed-point";
import * as math from "../../utils/math/math";

export interface IBasePoolToken {
  address: string;
  symbol: string;
  balance: string;
  decimals: number;
}

export interface IBasePoolParams {
  id: string;
  address: string;
  lbptTotalSupply: string;
  swapFeePercentage: string;
  query?: boolean;
}

export default abstract class BasePool {
  private MIN_SWAP_FEE_PERCENTAGE = bn("0.000001"); // 0.0001%
  private MAX_SWAP_FEE_PERCENTAGE = bn("0.1"); // 10%

  protected _id: string;
  protected _address: string;
  protected _lbptTotalSupply: string;
  protected _swapFeePercentage: string;
  protected _query = true;

  // ---------------------- Getters ----------------------

  get id() {
    return this._id;
  }

  get address() {
    return this._address;
  }

  get lbptTotalSupply() {
    return this._lbptTotalSupply;
  }

  get swapFeePercentage() {
    return this._swapFeePercentage;
  }

  get query() {
    return this._query;
  }

  // ---------------------- Constructor ----------------------

  constructor(params: IBasePoolParams) {
    this._id = params.id;
    this._address = params.address;
    this._lbptTotalSupply = params.lbptTotalSupply;
    this.setSwapFeePercentage(params.swapFeePercentage);

    if (params.query) {
      this._query = params.query;
    }
  }

  // ---------------------- Setters ----------------------

  public setSwapFeePercentage(swapFeePercentage: string) {
    if (bn(swapFeePercentage).lt(this.MIN_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MIN_SWAP_FEE_PERCENTAGE");
    }
    if (bn(swapFeePercentage).gt(this.MAX_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MAX_SWAP_FEE_PERCENTAGE");
    }

    this._swapFeePercentage = swapFeePercentage;
  }

  public setQuery(query: boolean) {
    this._query = query;
  }

  // ---------------------- Internal ----------------------

  protected _upScale(amount: BigNumber | string, decimals: number): BigNumber {
    return math.mul(scale(amount, decimals), bn(10).pow(18 - decimals));
  }

  protected _downScaleDown(
    amount: BigNumber | string,
    decimals: number
  ): BigNumber {
    return scale(
      math.divDown(bn(amount), bn(10).pow(18 - decimals)),
      -decimals
    );
  }

  protected _downScaleUp(
    amount: BigNumber | string,
    decimals: number
  ): BigNumber {
    return scale(math.divUp(bn(amount), bn(10).pow(18 - decimals)), -decimals);
  }

  protected _subtractSwapFeeAmount(
    amount: BigNumber | string,
    decimals: number
  ): BigNumber {
    const scaledAmount = scale(amount, decimals);
    const scaledAmountWithoutFees = fp.sub(
      scaledAmount,
      fp.mulUp(scaledAmount, this._upScale(this._swapFeePercentage, 18))
    );
    return scale(scaledAmountWithoutFees, -decimals);
  }

  protected _addSwapFeeAmount(
    amount: BigNumber | string,
    decimals: number
  ): BigNumber {
    const scaledAmount = scale(amount, decimals);
    const scaledAmountWithFees = fp.divUp(
      scaledAmount,
      fp.sub(fp.ONE, this._upScale(this._swapFeePercentage, 18))
    );
    return scale(scaledAmountWithFees, -decimals);
  }
}
