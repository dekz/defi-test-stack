import { Provider, TxData } from 'ethereum-types';

import { artifacts } from '../../migrations/global/artifacts';

import { WETH9Contract } from './generated-wrappers/weth9';
export interface GlobalContracts {
    global: {
        etherToken: string;
    };
}

export async function runMigrationsAsync(
    _contractAddresses: any,
    provider: Provider,
    txDefaults: Partial<TxData>,
): Promise<GlobalContracts> {
    console.log('Global');
    const etherToken = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9 as any, provider, txDefaults);
    return {
        global: {
            etherToken: (etherToken as any).address,
        },
    };
}
