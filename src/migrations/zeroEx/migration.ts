import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { artifacts as globalArtifacts } from '../../migrations/global/artifacts';
import { DummyERC20TokenContract } from '../global/generated-wrappers/dummy_erc20_token';

import { artifacts } from './artifacts';
import { ERC20ProxyContract } from './generated-wrappers/erc20_proxy';
import { ERC721ProxyContract } from './generated-wrappers/erc721_proxy';
import { ExchangeContract } from './generated-wrappers/exchange';
import { ForwarderContract } from './generated-wrappers/forwarder';
import { OrderValidatorContract } from './generated-wrappers/order_validator';

export interface ZeroExContracts {
    zeroEx: {
        erc20Proxy: string;
        erc721Proxy: string;
        exchange: string;
        forwarder: string;
        orderValidator: string;
        zrxToken: string;
    };
}

export async function runMigrationsAsync(
    contractAddresses: any,
    provider: Provider,
    txDefaults: Partial<TxData>,
): Promise<ZeroExContracts> {
    console.log('0x');
    const web3Wrapper = new Web3Wrapper(provider);
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    const [owner, makerAddress] = addresses;
    const erc20Proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(artifacts.ERC20Proxy, provider, txDefaults);
    const erc721Proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC721Proxy as any,
        provider,
        txDefaults,
    );
    // ZRX
    const zrxToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
        globalArtifacts.DummyERC20Token,
        provider,
        txDefaults,
        '0x Token',
        'ZRX',
        new BigNumber(18),
        // tslint:disable-next-line:custom-no-magic-numbers
        new BigNumber(2).pow(256).minus(1),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await zrxToken.mint.sendTransactionAsync(await zrxToken.MAX_MINT_AMOUNT.callAsync(), { from: makerAddress }),
    );
    const zrxAssetData = assetDataUtils.encodeERC20AssetData((zrxToken as any).address);
    const etherTokenAssetData = assetDataUtils.encodeERC20AssetData(contractAddresses.global.etherToken);
    const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        zrxAssetData,
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync((erc20Proxy as any).address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync((erc721Proxy as any).address),
    );
    const forwarder = await ForwarderContract.deployFrom0xArtifactAsync(
        artifacts.Forwarder,
        provider,
        txDefaults,
        (exchange as any).address,
        zrxAssetData,
        etherTokenAssetData,
    );
    const orderValidator = await OrderValidatorContract.deployFrom0xArtifactAsync(
        artifacts.OrderValidator,
        provider,
        txDefaults,
        (exchange as any).address,
        zrxAssetData,
    );

    return {
        zeroEx: {
            erc20Proxy: (erc20Proxy as any).address,
            erc721Proxy: (erc721Proxy as any).address,
            zrxToken: (zrxToken as any).address,
            exchange: (exchange as any).address,
            forwarder: (forwarder as any).address,
            orderValidator: (orderValidator as any).address,
        },
    };
}
