import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { artifacts as globalArtifacts } from '../../migrations/global/artifacts';
import { DummyERC20TokenContract } from '../global/generated-wrappers/dummy_erc20_token';

import { artifacts } from './artifacts';
import { ConversionRatesContract } from './generated-wrappers/conversion_rates';
import { ExpectedRateContract } from './generated-wrappers/expected_rate';
import { FeeBurnerContract } from './generated-wrappers/fee_burner';
import { KyberGenesisTokenContract } from './generated-wrappers/kyber_genesis_token';
import { KyberNetworkContract } from './generated-wrappers/kyber_network';
import { KyberNetworkCrystalContract } from './generated-wrappers/kyber_network_crystal';
import { KyberNetworkProxyContract } from './generated-wrappers/kyber_network_proxy';
import { KyberReserveContract } from './generated-wrappers/kyber_reserve';
import { SanityRatesContract } from './generated-wrappers/sanity_rates';
import { WhiteListContract } from './generated-wrappers/white_list';
const ZERO = new BigNumber(0);

export interface KyberContracts {
    kyber: {};
}

const kyberConfig: any = {
    KyberNetwork: {
        maxGasPrice: 50000000000,
        negDiffInBPS: 20,
    },
    FeeBurner: {
        reserveFees: 25,
        kncRate: 500,
        taxFeesBPS: 2000,
    },
    ExpectedRate: {
        minExpectedRateSlippage: 50,
        quantityFactor: 1,
    },
    SanityRates: {
        reasonableDiff: 1000,
        KNCSanityRate: '1840144285714286',
        ZRXSanityRate: '17321646037735852',
    },
    WhiteList: {
        sgdToETHRate: '1984126984126984',
        defaultCategory: 0,
        defaultCap: 5000,
        userCategory: 1,
        userCap: 10000,
        kgtCategory: 2,
        kgtCap: 0,
        partnerCategory: 3,
        partnerCap: 1000000,
    },
    ConversionRates: {
        validDurationBlock: 1000000000,
        bytes14: '0x0000000000000000000000000000',
        KNCBaseBuy: '549000000000000000000',
        KNCBaseSell: '1813123931381047',
        ZRXBaseBuy: '61079439106994400000',
        ZRXBaseSell: '16400993988000000',
    },
    feeSharingWallets: {},
};

const tokenConfig = [
    {
        minimalRecordResolution: '1000000000000000',
        maxPerBlockImbalance: '9078768104330450960384',
        maxTotalImbalance: '57896044618658097711785492504343953926634992332820282019728792003956564819968',
    },
    {
        minimalRecordResolution: '1000000000000000',
        maxPerBlockImbalance: '1168266203186998149120',
        maxTotalImbalance: '57896044618658097711785492504343953926634992332820282019728792003956564819968',
    },
    {
        minimalRecordResolution: '1000000000000000',
        maxPerBlockImbalance: '469529020651',
        maxTotalImbalance: '57896044618658097711785492504343953926634992332820282019728792003956564819968',
    },
    {
        minimalRecordResolution: '1000000000000000',
        maxPerBlockImbalance: '87906198134633072',
        maxTotalImbalance: '57896044618658097711785492504343953926634992332820282019728792003956564819968',
    },
];

const DECIMALS = 18;

export async function runMigrationsAsync(
    contractAddresses: any,
    provider: Provider,
    txDefaults: Partial<TxData>,
): Promise<KyberContracts> {
    console.log('Kyber');
    const web3Wrapper = new Web3Wrapper(provider);
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    const [admin, operator, alerter, reserveWallet, taxWallet] = addresses;

    const kncToken = await KyberNetworkCrystalContract.deployFrom0xArtifactAsync(
        artifacts.KyberNetworkCrystal,
        provider,
        txDefaults,
    );
    const kgtToken = await KyberGenesisTokenContract.deployFrom0xArtifactAsync(
        artifacts.KyberGenesisToken,
        provider,
        txDefaults,
    );

    // Deploy contracts
    const network = await KyberNetworkContract.deployFrom0xArtifactAsync(
        artifacts.KyberNetwork,
        provider,
        txDefaults,
        admin,
    );
    const networkProxy = await KyberNetworkProxyContract.deployFrom0xArtifactAsync(
        artifacts.KyberNetworkProxy,
        provider,
        txDefaults,
        admin,
    );
    const conversionRates = await ConversionRatesContract.deployFrom0xArtifactAsync(
        artifacts.ConversionRates,
        provider,
        txDefaults,
        admin,
    );
    const sanityRates = await SanityRatesContract.deployFrom0xArtifactAsync(
        artifacts.SanityRates,
        provider,
        txDefaults,
        admin,
    );
    const reserve = await KyberReserveContract.deployFrom0xArtifactAsync(
        artifacts.KyberReserve,
        provider,
        txDefaults,
        network.address,
        conversionRates.address,
        admin,
    );
    const feeBurner = await FeeBurnerContract.deployFrom0xArtifactAsync(
        artifacts.FeeBurner,
        provider,
        txDefaults,
        admin,
        kncToken.address,
        network.address,
    );
    const whitelist = await WhiteListContract.deployFrom0xArtifactAsync(
        artifacts.WhiteList,
        provider,
        txDefaults,
        admin,
        kgtToken.address,
    );
    const expectedRate = await ExpectedRateContract.deployFrom0xArtifactAsync(
        artifacts.ExpectedRate,
        provider,
        txDefaults,
        network.address,
        admin,
    );

    // Setup operators
    await web3Wrapper.awaitTransactionSuccessAsync(
        await network.addOperator.sendTransactionAsync(operator, txDefaults),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await conversionRates.addOperator.sendTransactionAsync(operator, txDefaults),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await reserve.addOperator.sendTransactionAsync(operator, txDefaults),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(await reserve.addAlerter.sendTransactionAsync(alerter, txDefaults));
    await web3Wrapper.awaitTransactionSuccessAsync(
        await feeBurner.addOperator.sendTransactionAsync(operator, txDefaults),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.addOperator.sendTransactionAsync(operator, txDefaults),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(await expectedRate.addOperator.sendTransactionAsync(operator));
    await web3Wrapper.awaitTransactionSuccessAsync(
        await sanityRates.addOperator.sendTransactionAsync(operator, txDefaults),
    );

    // Setup Kyber Network Proxy
    await web3Wrapper.awaitTransactionSuccessAsync(
        await networkProxy.setKyberNetworkContract.sendTransactionAsync(network.address),
    );

    // Reserve
    await web3Wrapper.awaitTransactionSuccessAsync(
        await reserve.setContracts.sendTransactionAsync(network.address, conversionRates.address, sanityRates.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await network.addReserve.sendTransactionAsync(reserve.address, true),
    );
    if (!contractAddresses.zeroEx.zrxToken) {
        throw new Error('Cannot find ZRX');
    }
    const reserveTokens = [contractAddresses.zeroEx.zrxToken, kncToken.address];
    for (const address of reserveTokens) {
        await web3Wrapper.awaitTransactionSuccessAsync(
            await reserve.approveWithdrawAddress.sendTransactionAsync(address, reserveWallet, true),
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await network.listPairForReserve.sendTransactionAsync(reserve.address, address, true, true, true),
        );
    }

    // Fee Burner
    await web3Wrapper.awaitTransactionSuccessAsync(
        await feeBurner.setReserveData.sendTransactionAsync(
            reserve.address,
            new BigNumber(kyberConfig.FeeBurner.reserveFees),
            reserveWallet,
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await feeBurner.setKNCRate.sendTransactionAsync(new BigNumber(kyberConfig.FeeBurner.kncRate)),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await feeBurner.setTaxInBps.sendTransactionAsync(new BigNumber(kyberConfig.FeeBurner.taxFeesBPS)),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(await feeBurner.setTaxWallet.sendTransactionAsync(taxWallet));
    // Fee sharing wallets
    const bobWallet = addresses[7];
    const aliceWallet = addresses[8];
    const bobFees = new BigNumber(4000);
    const aliceFees = new BigNumber(5000);
    await web3Wrapper.awaitTransactionSuccessAsync(
        await feeBurner.setWalletFees.sendTransactionAsync(bobWallet, bobFees),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await feeBurner.setWalletFees.sendTransactionAsync(aliceWallet, aliceFees),
    );

    // Expected Rate
    await web3Wrapper.awaitTransactionSuccessAsync(
        await expectedRate.setWorstCaseRateFactor.sendTransactionAsync(
            new BigNumber(kyberConfig.ExpectedRate.minExpectedRateSlippage),
            {
                from: operator,
            },
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await expectedRate.setQuantityFactor.sendTransactionAsync(
            new BigNumber(kyberConfig.ExpectedRate.quantityFactor),
            {
                from: operator,
            },
        ),
    );

    // Conversion Rates
    let index = 0;
    const baseBuy = [];
    const baseSell = [];
    const bytes14 = [];
    for (const address of reserveTokens) {
        const erc20Token = new DummyERC20TokenContract(
            globalArtifacts.DummyERC20Token.compilerOutput.abi,
            address,
            provider,
        );
        const symbol = await erc20Token.symbol.callAsync();
        if (!symbol) {
            throw new Error('No ERC20 symbol for token: ' + address);
        }
        await web3Wrapper.awaitTransactionSuccessAsync(await conversionRates.addToken.sendTransactionAsync(address));
        await web3Wrapper.awaitTransactionSuccessAsync(
            await conversionRates.setTokenControlInfo.sendTransactionAsync(
                address,
                new BigNumber(tokenConfig[index].minimalRecordResolution),
                new BigNumber(tokenConfig[index].maxPerBlockImbalance),
                new BigNumber(tokenConfig[index].maxTotalImbalance),
            ),
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await conversionRates.setQtyStepFunction.sendTransactionAsync(address, [ZERO], [ZERO], [ZERO], [ZERO], {
                from: operator,
            }),
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await conversionRates.setImbalanceStepFunction.sendTransactionAsync(
                address,
                [ZERO],
                [ZERO],
                [ZERO],
                [ZERO],
                {
                    from: operator,
                },
            ),
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await conversionRates.enableTokenTrade.sendTransactionAsync(address),
        );
        baseBuy.push(new BigNumber(kyberConfig.ConversionRates[`${symbol}BaseBuy`]));
        baseSell.push(new BigNumber(kyberConfig.ConversionRates[`${symbol}BaseSell`]));
        bytes14.push(kyberConfig.ConversionRates.bytes14);
        index++;
    }

    await web3Wrapper.awaitTransactionSuccessAsync(
        await conversionRates.setValidRateDurationInBlocks.sendTransactionAsync(
            new BigNumber(kyberConfig.ConversionRates.validDurationBlock),
        ),
    );

    const blockNumber = (await web3Wrapper.awaitTransactionSuccessAsync(
        await conversionRates.setReserveAddress.sendTransactionAsync(reserve.address),
    )).blockNumber;

    await web3Wrapper.awaitTransactionSuccessAsync(
        await conversionRates.setBaseRate.sendTransactionAsync(
            reserveTokens,
            baseBuy,
            baseSell,
            bytes14,
            bytes14,
            new BigNumber(blockNumber),
            reserveTokens.map(_e => ZERO),
            { from: operator },
        ),
    );

    // Sanity Rates
    const reasonableDiffs = [];
    const sanityRatesValues = [];
    for (const address of reserveTokens) {
        const erc20Token = new DummyERC20TokenContract(
            globalArtifacts.DummyERC20Token.compilerOutput.abi,
            address,
            provider,
        );
        const symbol = await erc20Token.symbol.callAsync();
        if (!symbol) {
            throw new Error('No ERC20 symbol for token: ' + address);
        }
        reasonableDiffs.push(new BigNumber(kyberConfig.SanityRates.reasonableDiff));
        sanityRatesValues.push(new BigNumber(kyberConfig.SanityRates[`${symbol}SanityRate`]));
    }

    await web3Wrapper.awaitTransactionSuccessAsync(
        await sanityRates.setReasonableDiff.sendTransactionAsync(reserveTokens, reasonableDiffs),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await sanityRates.setSanityRates.sendTransactionAsync(reserveTokens, sanityRatesValues, { from: operator }),
    );

    // Whitelist
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setSgdToEthRate.sendTransactionAsync(new BigNumber(kyberConfig.WhiteList.sgdToETHRate), {
            from: operator,
        }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setCategoryCap.sendTransactionAsync(
            new BigNumber(kyberConfig.WhiteList.defaultCategory),
            new BigNumber(kyberConfig.WhiteList.defaultCap),
            { from: operator },
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setCategoryCap.sendTransactionAsync(
            new BigNumber(kyberConfig.WhiteList.userCategory),
            new BigNumber(kyberConfig.WhiteList.userCap),
            { from: operator },
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setUserCategory.sendTransactionAsync(
            taxWallet,
            new BigNumber(kyberConfig.WhiteList.userCategory),
            {
                from: operator,
            },
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setCategoryCap.sendTransactionAsync(
            new BigNumber(kyberConfig.WhiteList.kgtCategory),
            new BigNumber(kyberConfig.WhiteList.kgtCap),
            { from: operator },
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setCategoryCap.sendTransactionAsync(
            new BigNumber(kyberConfig.WhiteList.partnerCategory),
            new BigNumber(kyberConfig.WhiteList.partnerCap),
            { from: operator },
        ),
    );
    // Fee sharing wallets category cap
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setUserCategory.sendTransactionAsync(
            bobWallet,
            new BigNumber(kyberConfig.WhiteList.partnerCategory),
            {
                from: operator,
            },
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await whitelist.setUserCategory.sendTransactionAsync(
            aliceWallet,
            new BigNumber(kyberConfig.WhiteList.partnerCategory),
            {
                from: operator,
            },
        ),
    );

    // Kyber Network
    await web3Wrapper.awaitTransactionSuccessAsync(
        await network.setKyberProxy.sendTransactionAsync(networkProxy.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(await network.setFeeBurner.sendTransactionAsync(feeBurner.address));
    await web3Wrapper.awaitTransactionSuccessAsync(await network.setWhiteList.sendTransactionAsync(whitelist.address));
    await web3Wrapper.awaitTransactionSuccessAsync(
        await network.setExpectedRate.sendTransactionAsync(expectedRate.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await network.setParams.sendTransactionAsync(
            new BigNumber(kyberConfig.KyberNetwork.maxGasPrice),
            new BigNumber(kyberConfig.KyberNetwork.negDiffInBPS),
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(await network.setEnable.sendTransactionAsync(true));

    // Transfer Tokens
    for (const address of reserveTokens) {
        const erc20Token = new DummyERC20TokenContract(
            globalArtifacts.DummyERC20Token.compilerOutput.abi,
            address,
            provider,
        );
        const decimals = await erc20Token.decimals.callAsync();
        const amount = new BigNumber(100000).mul(new BigNumber(10).pow(decimals as any));
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Token.transfer.sendTransactionAsync(reserve.address, amount, txDefaults),
        );
    }
    // tslint:disable-next-line:custom-no-magic-numbers
    const weiAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber('20'), DECIMALS);
    await web3Wrapper.awaitTransactionSuccessAsync(
        await web3Wrapper.sendTransactionAsync({ to: reserve.address, value: weiAmount, from: alerter }),
    );

    return {
        kyber: {
            kncToken: kncToken.address,
            kgtToken: kgtToken.address,
            network: network.address,
            networkProxy: networkProxy.address,
            expectedRate: expectedRate.address,
            whitelist: whitelist.address,
            feeBurner: feeBurner.address,
            reserve: reserve.address,
            sanityRates: sanityRates.address,
        },
    };
}
