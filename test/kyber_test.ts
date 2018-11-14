import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';

import { artifacts as globalArtifacts } from '../src/artifacts';
import { DummyERC20TokenContract } from '../src/migrations/global/generated-wrappers/dummy_erc20_token';
import { artifacts } from '../src/migrations/kyber/artifacts';
import { KyberNetworkProxyContract } from '../src/migrations/kyber/generated-wrappers/kyber_network_proxy';

import { blockchainLifecycle, chaiSetup, getContractAddresses, provider, web3Wrapper } from './setup';

chaiSetup.configure();
const expect = chai.expect;

describe('Kyber', () => {
    let contractAddresses: any;
    let txDefaults: any;
    let userAddress: string;
    let ownerAddress: string;
    const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const DECIMALS = 18;
    before(async () => {
        const addresses = await web3Wrapper.getAvailableAddressesAsync();
        [ownerAddress, userAddress] = addresses;
        contractAddresses = getContractAddresses();
        txDefaults = {
            from: userAddress,
        };
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    it('returns contract addresses', () => {
        expect(contractAddresses.kyber).to.not.be.undefined();
        expect(contractAddresses.kyber.kncToken).to.not.be.undefined();
        expect(contractAddresses.kyber.kgtToken).to.not.be.undefined();
        expect(contractAddresses.kyber.network).to.not.be.undefined();
        expect(contractAddresses.kyber.networkProxy).to.not.be.undefined();
        expect(contractAddresses.kyber.reserve).to.not.be.undefined();
    });
    it('swaps ETH for ZRX', async () => {
        const zrxToken = contractAddresses.zeroEx.zrxToken;
        const proxyContract = new KyberNetworkProxyContract(
            artifacts.KyberNetworkProxy.compilerOutput.abi,
            contractAddresses.kyber.networkProxy,
            provider,
            txDefaults,
        );
        const erc20Token = new DummyERC20TokenContract(
            globalArtifacts.DummyERC20Token.compilerOutput.abi,
            zrxToken,
            provider,
        );
        const balanceBefore = await erc20Token.balanceOf.callAsync(userAddress);
        const weiAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(0.1), DECIMALS);
        const [expectedRate] = await proxyContract.getExpectedRate.callAsync(ETH_ADDRESS, zrxToken, weiAmount);

        const receipt = await web3Wrapper.awaitTransactionMinedAsync(
            await proxyContract.swapEtherToToken.sendTransactionAsync(zrxToken, expectedRate, {
                ...txDefaults,
                value: weiAmount,
            }),
        );
        expect(receipt.status).to.be.eq(1);
        const balanceAfter = await erc20Token.balanceOf.callAsync(userAddress);
        expect(balanceAfter).to.be.bignumber.greaterThan(balanceBefore);
    });
});
