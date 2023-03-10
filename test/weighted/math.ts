import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import * as sdkWeightedMath from "../../src/pools/weighted/math";
import { scale, scaleAll } from "../../src/utils/big-number";
import { deployContract, isSameResult, toEvmBn } from "../../src/utils/test";

describe("WeightedMath", () => {
  let deployer: SignerWithAddress;

  let evmWeightedMath: Contract;

  before(async () => {
    [deployer] = await ethers.getSigners();

    evmWeightedMath = await deployContract({
      name: "WeightedMath",
      from: deployer,
    });
  });

  describe("_calculateInvariant", () => {
    let normalizedWeights: string[];
    let balances: string[];

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calculateInvariant(
        scaleAll(normalizedWeights, 18).map(toEvmBn),
        scaleAll(balances, 18).map(toEvmBn)
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calculateInvariant(
            scaleAll(normalizedWeights, 18),
            scaleAll(balances, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("two tokens", () => {
      normalizedWeights = ["0.5", "0.5"];
      balances = ["1000", "1500"];
    });

    it("three tokens", () => {
      normalizedWeights = ["0.3", "0.3", "0.4"];
      balances = ["1000", "1000", "2000"];
    });

    it("empty invariant", () => {
      normalizedWeights = [];
      balances = [];
    });
  });

  describe("_calcOutGivenIn", () => {
    let balanceIn: string;
    let weightIn: string;
    let balanceOut: string;
    let weightOut: string;
    let amountIn: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcOutGivenIn(
        toEvmBn(scale(balanceIn, 18)),
        toEvmBn(scale(weightIn, 18)),
        toEvmBn(scale(balanceOut, 18)),
        toEvmBn(scale(weightOut, 18)),
        toEvmBn(scale(amountIn, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcOutGivenIn(
            scale(balanceIn, 18),
            scale(weightIn, 18),
            scale(balanceOut, 18),
            scale(weightOut, 18),
            scale(amountIn, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balanceIn = "1000";
      weightIn = "0.4";
      balanceOut = "3000";
      weightOut = "0.6";
      amountIn = "10";
    });

    it("extreme balances", () => {
      balanceIn = "10000000";
      weightIn = "0.5";
      balanceOut = "1";
      weightOut = "0.5";
      amountIn = "10";
    });

    it("extreme weights", () => {
      balanceIn = "1000";
      weightIn = "0.001";
      balanceOut = "2000";
      weightOut = "0.999";
      amountIn = "10";
    });
  });

  describe("_calcInGivenOut", () => {
    let balanceIn: string;
    let weightIn: string;
    let balanceOut: string;
    let weightOut: string;
    let amountOut: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcOutGivenIn(
        toEvmBn(scale(balanceIn, 18)),
        toEvmBn(scale(weightIn, 18)),
        toEvmBn(scale(balanceOut, 18)),
        toEvmBn(scale(weightOut, 18)),
        toEvmBn(scale(amountOut, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcOutGivenIn(
            scale(balanceIn, 18),
            scale(weightIn, 18),
            scale(balanceOut, 18),
            scale(weightOut, 18),
            scale(amountOut, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balanceIn = "100";
      weightIn = "0.2";
      balanceOut = "1000";
      weightOut = "0.8";
      amountOut = "100";
    });

    it("extreme balances", () => {
      balanceIn = "90000000";
      weightIn = "0.3";
      balanceOut = "0.1";
      weightOut = "0.7";
      amountOut = "0.01";
    });

    it("extreme weights", () => {
      balanceIn = "1000";
      weightIn = "0.999";
      balanceOut = "2000";
      weightOut = "0.001";
      amountOut = "500";
    });
  });

  describe("_calcBptOutGivenExactTokensIn", () => {
    let balances: string[];
    let normalizedWeights: string[];
    let amountsIn: string[];
    let lbptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcBptOutGivenExactTokensIn(
        scaleAll(balances, 18).map(toEvmBn),
        scaleAll(normalizedWeights, 18).map(toEvmBn),
        scaleAll(amountsIn, 18).map(toEvmBn),
        toEvmBn(scale(lbptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcBptOutGivenExactTokensIn(
            scaleAll(balances, 18),
            scaleAll(normalizedWeights, 18),
            scaleAll(amountsIn, 18),
            scale(lbptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balances = ["100", "200", "300"];
      normalizedWeights = ["0.2", "0.4", "0.4"];
      amountsIn = ["50", "100", "100"];
      lbptTotalSupply = "1000";
      swapFee = "0.01";
    });
  });

  describe("_calcBptOutGivenExactTokenIn", () => {
    let balance: string;
    let normalizedWeight: string;
    let amountIn: string;
    let lbptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcBptOutGivenExactTokensIn(
        [toEvmBn(scale(balance, 18))],
        [toEvmBn(scale(normalizedWeight, 18))],
        [toEvmBn(scale(amountIn, 18))],
        toEvmBn(scale(lbptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcBptOutGivenExactTokenIn(
            scale(balance, 18),
            scale(normalizedWeight, 18),
            scale(amountIn, 18),
            scale(lbptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balance = "10000";
      normalizedWeight = "1";
      amountIn = "100";
      lbptTotalSupply = "1000";
      swapFee = "0.01";
    });
  });

  describe("_calcTokenInGivenExactBptOut", () => {
    let balance: string;
    let normalizedWeight: string;
    let bptAmountOut: string;
    let lbptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcTokenInGivenExactBptOut(
        toEvmBn(scale(balance, 18)),
        toEvmBn(scale(normalizedWeight, 18)),
        toEvmBn(scale(bptAmountOut, 18)),
        toEvmBn(scale(lbptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcTokenInGivenExactBptOut(
            scale(balance, 18),
            scale(normalizedWeight, 18),
            scale(bptAmountOut, 18),
            scale(lbptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balance = "1000";
      normalizedWeight = "0.6";
      bptAmountOut = "10";
      lbptTotalSupply = "1000";
      swapFee = "0.01";
    });
  });

  describe("_calcLbptInGivenExactTokensOut", () => {
    let balances: string[];
    let normalizedWeights: string[];
    let amountsOut: string[];
    let lbptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcLbptInGivenExactTokensOut(
        scaleAll(balances, 18).map(toEvmBn),
        scaleAll(normalizedWeights, 18).map(toEvmBn),
        scaleAll(amountsOut, 18).map(toEvmBn),
        toEvmBn(scale(lbptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcLbptInGivenExactTokensOut(
            scaleAll(balances, 18),
            scaleAll(normalizedWeights, 18),
            scaleAll(amountsOut, 18),
            scale(lbptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balances = ["100", "200", "300"];
      normalizedWeights = ["0.2", "0.4", "0.4"];
      amountsOut = ["50", "100", "100"];
      lbptTotalSupply = "1000";
      swapFee = "0.01";
    });
  });

  describe("_calcLbptInGivenExactTokenOut", () => {
    let balance: string;
    let normalizedWeight: string;
    let amountOut: string;
    let lbptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcLbptInGivenExactTokensOut(
        [toEvmBn(scale(balance, 18))],
        [toEvmBn(scale(normalizedWeight, 18))],
        [toEvmBn(scale(amountOut, 18))],
        toEvmBn(scale(lbptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcLbptInGivenExactTokenOut(
            scale(balance, 18),
            scale(normalizedWeight, 18),
            scale(amountOut, 18),
            scale(lbptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balance = "100";
      normalizedWeight = "0.2";
      amountOut = "50";
      lbptTotalSupply = "1000";
      swapFee = "0.01";
    });
  });

  describe("_calcTokenOutGivenExactLbptIn", () => {
    let balance: string;
    let normalizedWeight: string;
    let lbptAmountIn: string;
    let lbptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcTokenOutGivenExactLbptIn(
        toEvmBn(scale(balance, 18)),
        toEvmBn(scale(normalizedWeight, 18)),
        toEvmBn(scale(lbptAmountIn, 18)),
        toEvmBn(scale(lbptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcTokenOutGivenExactLbptIn(
            scale(balance, 18),
            scale(normalizedWeight, 18),
            scale(lbptAmountIn, 18),
            scale(lbptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balance = "1000";
      normalizedWeight = "0.3";
      lbptAmountIn = "10";
      lbptTotalSupply = "100";
      swapFee = "0.01";
    });
  });

  describe("_calcTokensOutGivenExactLbptIn", () => {
    let balances: string[];
    let lbptAmountIn: string;
    let lbptTotalSupply: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcTokensOutGivenExactLbptIn(
        scaleAll(balances, 18).map(toEvmBn),
        toEvmBn(scale(lbptAmountIn, 18)),
        toEvmBn(scale(lbptTotalSupply, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcTokensOutGivenExactLbptIn(
            scaleAll(balances, 18),
            scale(lbptAmountIn, 18),
            scale(lbptTotalSupply, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balances = ["100", "1000", "5000"];
      lbptAmountIn = "23.58";
      lbptTotalSupply = "200";
    });
  });

  describe("_calcDueTokenProtocolSwapFeeAmount", () => {
    let balance: string;
    let normalizedWeight: string;
    let previousInvariant: string;
    let currentInvariant: string;
    let protocolSwapFeePercentage: string;

    afterEach(async () => {
      const evmExecution = evmWeightedMath._calcDueTokenProtocolSwapFeeAmount(
        toEvmBn(scale(balance, 18)),
        toEvmBn(scale(normalizedWeight, 18)),
        toEvmBn(scale(previousInvariant, 18)),
        toEvmBn(scale(currentInvariant, 18)),
        toEvmBn(scale(protocolSwapFeePercentage, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkWeightedMath._calcDueTokenProtocolSwapFeeAmount(
            scale(balance, 18),
            scale(normalizedWeight, 18),
            scale(previousInvariant, 18),
            scale(currentInvariant, 18),
            scale(protocolSwapFeePercentage, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balance = "1000";
      normalizedWeight = "0.3";
      previousInvariant = "100000000";
      currentInvariant = "100000999";
      protocolSwapFeePercentage = "0.01";
    });
  });
});
