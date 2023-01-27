import { getLyfeblocContract } from "@lyfebloc/v2-deployments";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { initFromOnchain } from "../../src/initializers/weighted";
import WeightedPool, { IWeightedPoolToken } from "../../src/pools/weighted";
import { bn } from "../../src/utils/big-number";
import { isSameResult } from "../../src/utils/test";
import * as query from "../../src/utils/test/pools/query";

describe("WeightedPool", () => {
  let sdkPool: WeightedPool;
  let evmVault: Contract;
  let evmHelpers: Contract;

  before(async () => {
    const network = "mainnet";

    sdkPool = await initFromOnchain(
      ethers.provider,
      // WETH/DAI 60/40 on Mainnet
      "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
      network
    );

    evmVault = await getLyfeblocContract("20210418-vault", "Vault", network);
    evmHelpers = await getLyfeblocContract(
      "20210418-vault",
      "LyfeblocHelpers",
      network
    );
  });

  describe("swapGivenIn", () => {
    let tokenIn: IWeightedPoolToken;
    let tokenOut: IWeightedPoolToken;
    let amountIn: string;

    afterEach(async () => {
      const evmExecution = query.swapGivenIn(
        evmVault,
        sdkPool.id,
        [tokenIn, tokenOut],
        tokenIn.symbol,
        tokenOut.symbol,
        amountIn
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.swapGivenIn(tokenIn.symbol, tokenOut.symbol, amountIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenIn = sdkPool.tokens[0];
      tokenOut = sdkPool.tokens[1];
      // 0.1% of the balance
      amountIn = bn(tokenIn.balance)
        .div(1000)
        .decimalPlaces(tokenIn.decimals)
        .toString();
    });

    it("extreme values", () => {
      tokenIn = sdkPool.tokens[1];
      tokenOut = sdkPool.tokens[0];
      // 25% of the balance
      amountIn = bn(tokenIn.balance)
        .div(4)
        .decimalPlaces(tokenIn.decimals)
        .toString();
    });
  });

  describe("swapGivenOut", () => {
    let tokenIn: IWeightedPoolToken;
    let tokenOut: IWeightedPoolToken;
    let amountOut: string;

    afterEach(async () => {
      const evmExecution = query.swapGivenOut(
        evmVault,
        sdkPool.id,
        [tokenIn, tokenOut],
        tokenIn.symbol,
        tokenOut.symbol,
        amountOut
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkPool.swapGivenOut(tokenIn.symbol, tokenOut.symbol, amountOut)
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenIn = sdkPool.tokens[0];
      tokenOut = sdkPool.tokens[1];
      // 0.1% of the balance
      amountOut = bn(tokenOut.balance)
        .div(1000)
        .decimalPlaces(tokenOut.decimals)
        .toString();
    });

    it("extreme values", () => {
      tokenIn = sdkPool.tokens[1];
      tokenOut = sdkPool.tokens[0];
      // 25% of the balance
      amountOut = bn(tokenOut.balance)
        .div(4)
        .decimalPlaces(tokenOut.decimals)
        .toString();
    });
  });

  describe("joinExactTokensInForBptOut", () => {
    let amountsIn: { [symbol: string]: string };

    afterEach(async () => {
      const evmExecution = query.joinExactTokensInForBptOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        sdkPool.tokens.map((t) => amountsIn[t.symbol])
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.joinExactTokensInForBptOut(amountsIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      amountsIn = {
        DAI: "100000",
        WETH: "500",
      };
    });

    it("extreme values", () => {
      amountsIn = {
        DAI: "1",
        WETH: "10000",
      };
    });
  });

  describe("joinTokenInForExactBptOut", () => {
    let tokenIn: IWeightedPoolToken;
    let bptOut: string;

    afterEach(async () => {
      const evmExecution = query.joinTokenInForExactBptOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        tokenIn.symbol,
        bptOut
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.joinTokenInForExactBptOut(tokenIn.symbol, bptOut))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenIn = sdkPool.tokens[0];
      bptOut = "10";
    });

    it("extreme values", () => {
      tokenIn = sdkPool.tokens[1];
      bptOut = "1000000000";
    });
  });

  describe("exitExactLbptInForTokenOut", () => {
    let tokenOut: IWeightedPoolToken;
    let llbptIn: string;

    afterEach(async () => {
      const evmExecution = query.exitExactLbptInForTokenOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        tokenOut.symbol,
        llbptIn
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.exitExactLbptInForTokenOut(tokenOut.symbol, llbptIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenOut = sdkPool.tokens[0];
      llbptIn = "100";
    });

    it("extreme values", () => {
      tokenOut = sdkPool.tokens[1];
      llbptIn = "10000000";
    });
  });

  describe("exitExactLbptInForTokensOut", () => {
    let llbptIn: string;

    afterEach(async () => {
      const evmExecution = query.exitExactLbptInForTokensOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        llbptIn
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.exitExactLbptInForTokensOut(llbptIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      llbptIn = "1000";
    });

    it("extreme values", () => {
      llbptIn = "99999999";
    });
  });

  describe("exitLbptInForExactTokensOut", () => {
    let amountsOut: { [symbol: string]: string };

    afterEach(async () => {
      const evmExecution = query.exitLbptInForExactTokensOut(
        evmHelpers,
        sdkPool.id,
        sdkPool.tokens,
        sdkPool.tokens.map((t) => amountsOut[t.symbol])
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.exitLbptInForExactTokensOut(amountsOut))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      amountsOut = {
        DAI: "100000",
        WETH: "100",
      };
    });

    it("extreme values", () => {
      amountsOut = {
        DAI: "100000000",
        WETH: "100000000",
      };
    });
  });
});
