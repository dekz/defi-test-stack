import { Provider, TxData } from 'ethereum-types';

import { runMigrationsAsync as DharmaMigrationAsync } from './migrations/dharma/migration';
import { runMigrationsAsync as GlobalMigrationAsync } from './migrations/global/migration';
import { runMigrationsAsync as KyberMigrationAsync } from './migrations/kyber/migration';
import { runMigrationsAsync as ZeroExMigrationAsync } from './migrations/zeroEx/migration';

const migrations = [GlobalMigrationAsync, ZeroExMigrationAsync, KyberMigrationAsync, DharmaMigrationAsync];

export async function runMigrationsAsync(provider: Provider, txDefaults: Partial<TxData>): Promise<{}> {
    let contractAddresses = {};
    for (const migration of migrations) {
        contractAddresses = {
            ...contractAddresses,
            ...(await migration(contractAddresses, provider, txDefaults)),
        };
    }
    return contractAddresses;
}
