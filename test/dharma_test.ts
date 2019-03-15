import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Dharma } from '@dharmaprotocol/dharma.js';
import * as chai from 'chai';

import { artifacts as globalArtifacts } from '../src/migrations/global/artifacts';
import { DummyERC20TokenContract } from '../src/migrations/global/generated-wrappers/dummy_erc20_token';
import { WETH9Contract } from '../src/migrations/global/generated-wrappers/weth9';

import { blockchainLifecycle, chaiSetup, getContractAddresses, provider, web3Wrapper } from './setup';
const { LoanRequest, Token, Debt } = Dharma.Types;

chaiSetup.configure();
const expect = chai.expect;

describe('Dharma', () => {
    let contractAddresses: any;
    const DECIMALS = 18;
    let dharma: Dharma;
    let debtor: string;
    let creditor: string;
    before(async () => {
        const addresses = await web3Wrapper.getAvailableAddressesAsync();
        const [_ownerAddress, userAddress] = addresses;
        contractAddresses = getContractAddresses();
        await blockchainLifecycle.startAsync();
        dharma = new Dharma(provider, {
            tokenRegistryAddress: contractAddresses.dharma.tokenRegistry,
            debtTokenAddress: contractAddresses.dharma.debtToken,
            debtRegistryAddress: contractAddresses.dharma.debtRegistry,
            collateralizerAddress: contractAddresses.dharma.collateralizer,
            collateralizedSimpleInterestTermsContractAddress:
                contractAddresses.dharma.collateralizedSimpleInterestTermsContract,
            repaymentRouterAddress: contractAddresses.dharma.repaymentRouter,
            kernelAddress: contractAddresses.dharma.debtKernel,
            tokenTransferProxyAddress: contractAddresses.dharma.tokenTransferProxy,
            simpleInterestTermsContractAddress: contractAddresses.dharma.simpleInterestTermsContract,
        });
        [debtor, creditor] = await web3Wrapper.getAvailableAddressesAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    it('returns contract addresses', () => {
        expect(contractAddresses.dharma).to.not.be.undefined();
        expect(contractAddresses.dharma.debtRegistry).to.not.be.undefined();
        expect(contractAddresses.dharma.debtToken).to.not.be.undefined();
        expect(contractAddresses.dharma.repaymentRouter).to.not.be.undefined();
        expect(contractAddresses.dharma.debtKernel).to.not.be.undefined();
        expect(contractAddresses.dharma.simpleInterestTermsContract).to.not.be.undefined();
        expect(contractAddresses.dharma.tokenTransferProxy).to.not.be.undefined();
    });
    it('simple interest terms', async () => {
        const terms = {
            principalAmount: 0.1,
            principalToken: 'WETH',
            collateralAmount: 20,
            collateralToken: 'ZRX',
            interestRate: 3.5,
            termDuration: 3,
            termUnit: 'months',
            expiresInDuration: 1,
            expiresInUnit: 'weeks',
        };
        const loanRequest = await LoanRequest.createAndSignAsDebtor(dharma, terms as any, debtor);
        let txHash = await Token.makeAllowanceUnlimitedIfNecessary(dharma, 'WETH', creditor);
        if (txHash) {
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        }
        txHash = await Token.makeAllowanceUnlimitedIfNecessary(dharma, 'ZRX', creditor);
        if (txHash) {
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        }
        txHash = await Token.makeAllowanceUnlimitedIfNecessary(dharma, 'WETH', debtor);
        if (txHash) {
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        }
        txHash = await Token.makeAllowanceUnlimitedIfNecessary(dharma, 'ZRX', debtor);
        if (txHash) {
            await web3Wrapper.awaitTransactionSuccessAsync(txHash);
        }
        const zrxToken = new DummyERC20TokenContract(
            globalArtifacts.DummyERC20Token.compilerOutput.abi,
            contractAddresses.zeroEx.zrxToken,
            provider,
        );
        // Mint ZRX to Creditor
        await web3Wrapper.awaitTransactionSuccessAsync(
            await zrxToken.mint.sendTransactionAsync(await zrxToken.MAX_MINT_AMOUNT.callAsync(), { from: creditor }),
        );
        const etherToken = new WETH9Contract(
            globalArtifacts.WETH9.compilerOutput.abi,
            contractAddresses.global.etherToken,
            provider,
        );
        const weiAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), DECIMALS);
        // Deposit ETH into WETH
        await etherToken.deposit.sendTransactionAsync({ from: creditor, value: weiAmount });
        await etherToken.deposit.sendTransactionAsync({ from: debtor, value: weiAmount });
        // Fill loan request as creditor
        await web3Wrapper.awaitTransactionSuccessAsync(await loanRequest.fillAsCreditor(creditor));
        const isFilled = await loanRequest.isFilled();
        expect(isFilled).to.be.true();
        // Pay back the loan
        const agreementId = loanRequest.getAgreementId();
        const debt = await Debt.fetch(dharma, agreementId);
        let outstandingAmount = await debt.getOutstandingAmount();
        await web3Wrapper.awaitTransactionSuccessAsync(await (debt as any).makeRepayment(outstandingAmount));
        outstandingAmount = await debt.getOutstandingAmount();
        expect(outstandingAmount).to.equal(0);
        await web3Wrapper.awaitTransactionSuccessAsync(await (debt as any).returnCollateral());
    });
});
