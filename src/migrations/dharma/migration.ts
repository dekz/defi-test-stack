import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { artifacts } from './artifacts';
import { CollateralizedSimpleInterestTermsContractContract } from './generated-wrappers/collateralized_simple_interest_terms_contract';
import { CollateralizerContract } from './generated-wrappers/collateralizer';
import { ContractRegistryContract } from './generated-wrappers/contract_registry';
import { DebtKernelContract } from './generated-wrappers/debt_kernel';
import { DebtRegistryContract } from './generated-wrappers/debt_registry';
import { DebtTokenContract } from './generated-wrappers/debt_token';
import { PermissionsLibContract } from './generated-wrappers/permissions_lib';
import { RepaymentRouterContract } from './generated-wrappers/repayment_router';
import { SimpleInterestTermsContractContract } from './generated-wrappers/simple_interest_terms_contract';
import { TokenRegistryContract } from './generated-wrappers/token_registry';
import { TokenTransferProxyContract } from './generated-wrappers/token_transfer_proxy';

export interface DharmaContracts {
    dharma: {};
}

export async function runMigrationsAsync(
    contractAddresses: any,
    provider: Provider,
    txDefaults: Partial<TxData>,
): Promise<DharmaContracts> {
    console.log('Dharma');
    const web3Wrapper = new Web3Wrapper(provider);
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    const [owner] = addresses;

    const permissionLib = await PermissionsLibContract.deployFrom0xArtifactAsync(
        artifacts.PermissionsLib,
        provider,
        txDefaults,
    );
    const debtRegistry = await DebtRegistryContract.deployFrom0xArtifactAsync(
        artifacts.DebtRegistry,
        provider,
        txDefaults,
    );
    const debtToken = await DebtTokenContract.deployFrom0xArtifactAsync(
        artifacts.DebtToken,
        provider,
        txDefaults,
        debtRegistry.address,
    );
    const tokenTransferProxy = await TokenTransferProxyContract.deployFrom0xArtifactAsync(
        artifacts.TokenTransferProxy,
        provider,
        txDefaults,
    );
    const repaymentRouter = await RepaymentRouterContract.deployFrom0xArtifactAsync(
        artifacts.RepaymentRouter,
        provider,
        txDefaults,
        debtRegistry.address,
        tokenTransferProxy.address,
    );
    const debtKernel = await DebtKernelContract.deployFrom0xArtifactAsync(
        artifacts.DebtKernel,
        provider,
        txDefaults,
        tokenTransferProxy.address,
    );
    const tokenRegistry = await TokenRegistryContract.deployFrom0xArtifactAsync(
        artifacts.TokenRegistry,
        provider,
        txDefaults,
    );

    const collateralizer = await CollateralizerContract.deployFrom0xArtifactAsync(
        artifacts.Collateralizer,
        provider,
        txDefaults,
        debtKernel.address,
        debtRegistry.address,
        tokenRegistry.address,
        tokenTransferProxy.address,
    );
    const contractRegistry = await ContractRegistryContract.deployFrom0xArtifactAsync(
        artifacts.ContractRegistry,
        provider,
        txDefaults,
        collateralizer.address,
        debtKernel.address,
        debtRegistry.address,
        debtToken.address,
        repaymentRouter.address,
        tokenRegistry.address,
        tokenTransferProxy.address,
    );
    const simpleInterestTermsContract = await SimpleInterestTermsContractContract.deployFrom0xArtifactAsync(
        artifacts.SimpleInterestTermsContract,
        provider,
        txDefaults,
        contractRegistry.address,
    );
    const collateralizedSimpleInterestTermsContract = await CollateralizedSimpleInterestTermsContractContract.deployFrom0xArtifactAsync(
        artifacts.CollateralizedSimpleInterestTermsContract,
        provider,
        txDefaults,
        contractRegistry.address,
    );

    // Authorize token contract to make mutations to the registry
    await web3Wrapper.awaitTransactionSuccessAsync(
        await debtRegistry.addAuthorizedInsertAgent.sendTransactionAsync(debtToken.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await debtRegistry.addAuthorizedEditAgent.sendTransactionAsync(debtToken.address),
    );
    // Authorize kernel contract to mint and broker debt tokens
    await web3Wrapper.awaitTransactionSuccessAsync(
        await debtToken.addAuthorizedMintAgent.sendTransactionAsync(debtKernel.address),
    );
    // Set kernel to point at current debt token contract
    await web3Wrapper.awaitTransactionSuccessAsync(
        await debtKernel.setDebtToken.sendTransactionAsync(debtToken.address),
    );
    // Authorize kernel to make `transferFrom` calls on the token transfer proxy
    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenTransferProxy.addAuthorizedTransferAgent.sendTransactionAsync(debtKernel.address),
    );
    // Authorize repayment router to make `transferFrom` calls on the token transfer proxy
    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenTransferProxy.addAuthorizedTransferAgent.sendTransactionAsync(repaymentRouter.address),
    );
    // Authorize collateralizer to make `transferFrom` calls on the token transfer proxy.
    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenTransferProxy.addAuthorizedTransferAgent.sendTransactionAsync(collateralizer.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await collateralizer.addAuthorizedCollateralizeAgent.sendTransactionAsync(
            collateralizedSimpleInterestTermsContract.address,
        ),
    );
    // Authorize the token-uri operator to set token URIs on `DebtToken`.
    await web3Wrapper.awaitTransactionSuccessAsync(
        await debtToken.addAuthorizedTokenURIAgent.sendTransactionAsync(owner),
    );

    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenRegistry.setTokenAttributes.sendTransactionAsync(
            'ZRX',
            contractAddresses.zeroEx.zrxToken,
            '0x Token',
            18,
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenRegistry.setTokenAttributes.sendTransactionAsync(
            'WETH',
            contractAddresses.global.etherToken,
            'WETH',
            18,
        ),
    );
    return {
        dharma: {
            collateralizer: collateralizer.address,
            simpleInterestTermsContract: simpleInterestTermsContract.address,
            debtToken: debtToken.address,
            debtKernel: debtKernel.address,
            debtRegistry: debtRegistry.address,
            contractRegistry: contractRegistry.address,
            permissionLib: permissionLib.address,
            tokenTransferProxy: tokenTransferProxy.address,
            repaymentRouter: repaymentRouter.address,
            collateralizedSimpleInterestTermsContract: collateralizedSimpleInterestTermsContract.address,
            tokenRegistry: tokenRegistry.address,
        },
    };
}
