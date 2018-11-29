import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils, signatureUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Provider, Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';

import { artifacts as globalArtifacts } from '../src/migrations/global/artifacts';
import { DummyERC20TokenContract } from '../src/migrations/global/generated-wrappers/dummy_erc20_token';
import { WETH9Contract } from '../src/migrations/global/generated-wrappers/weth9';
import { artifacts } from '../src/migrations/zeroEx/artifacts';
import { ExchangeContract } from '../src/migrations/zeroEx/generated-wrappers/exchange';

import { blockchainLifecycle, chaiSetup, getContractAddresses, provider, web3Wrapper } from './setup';

chaiSetup.configure();
const expect = chai.expect;

describe('ZeroEx', () => {
    let contractAddresses: any;
    let takerAddress: string;
    let makerAddress: string;
    let ownerAddress: string;
    const DECIMALS = 18;
    before(async () => {
        const addresses = await web3Wrapper.getAvailableAddressesAsync();
        contractAddresses = getContractAddresses();
        [ownerAddress, makerAddress, takerAddress] = addresses;
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    it('returns contract addresses', () => {
        expect(contractAddresses.zeroEx).to.not.be.undefined();
        expect(contractAddresses.zeroEx.erc20Proxy).to.not.be.undefined();
        expect(contractAddresses.zeroEx.erc721Proxy).to.not.be.undefined();
        expect(contractAddresses.zeroEx.exchange).to.not.be.undefined();
        expect(contractAddresses.zeroEx.forwarder).to.not.be.undefined();
        expect(contractAddresses.zeroEx.zrxToken).to.not.be.undefined();
        expect(contractAddresses.zeroEx.orderValidator).to.not.be.undefined();
    });
    it('trades WETH for ZRX', async () => {
        const zrxToken = new DummyERC20TokenContract(
            globalArtifacts.DummyERC20Token.compilerOutput.abi,
            contractAddresses.zeroEx.zrxToken,
            provider,
        );
        const etherToken = new WETH9Contract(
            globalArtifacts.WETH9.compilerOutput.abi,
            contractAddresses.global.etherToken,
            provider,
        );
        const exchange = new ExchangeContract(
            artifacts.Exchange.compilerOutput.abi,
            contractAddresses.zeroEx.exchange,
            provider,
        );
        // Set ZRX approval for maker
        await zrxToken.approve.sendTransactionAsync(
            contractAddresses.zeroEx.erc20Proxy,
            Web3Wrapper.toBaseUnitAmount(new BigNumber(100), DECIMALS),
            { from: makerAddress },
        );

        // Set WETH approval for taker
        await etherToken.approve.sendTransactionAsync(
            contractAddresses.zeroEx.erc20Proxy,
            Web3Wrapper.toBaseUnitAmount(new BigNumber(100), DECIMALS),
            { from: takerAddress },
        );
        const weiAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.1), DECIMALS);
        // Deposit ETH into WETH
        await etherToken.deposit.sendTransactionAsync({ from: takerAddress, value: weiAmount });

        const balanceBefore = await zrxToken.balanceOf.callAsync(takerAddress);
        const order = {
            makerAddress,
            takerAddress: '0x0000000000000000000000000000000000000000',
            makerAssetAmount: new BigNumber('10000000000000000000'),
            takerAssetAmount: weiAmount,
            expirationTimeSeconds: new BigNumber('9542113582354'),
            makerFee: new BigNumber('0'),
            takerFee: new BigNumber('0'),
            feeRecipientAddress: '0x0000000000000000000000000000000000000000',
            senderAddress: '0x0000000000000000000000000000000000000000',
            salt: new BigNumber('19052466733254429714476818064537822860304046808401214332715231112834546038980'),
            makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            takerAssetData: assetDataUtils.encodeERC20AssetData(etherToken.address),
            exchangeAddress: contractAddresses.zeroEx.exchange,
        };
        const orderHash = orderHashUtils.getOrderHashHex(order);
        const signature = await signatureUtils.ecSignHashAsync(provider, orderHash, makerAddress);
        const receipt = await web3Wrapper.awaitTransactionMinedAsync(
            await exchange.fillOrder.sendTransactionAsync(order, weiAmount, signature, { from: takerAddress }),
        );

        expect(receipt.status).to.be.eq(1);
        const balanceAfter = await zrxToken.balanceOf.callAsync(takerAddress);
        expect(balanceAfter).to.be.bignumber.greaterThan(balanceBefore);
    });
});
