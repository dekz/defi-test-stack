#!/usr/bin/env node
import { web3Factory } from '@0x/dev-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import { writeFileSync } from 'fs';

import { runMigrationsAsync } from './migration';

(async () => {
    let providerConfigs;
    let provider: Provider;
    let txDefaults;

    providerConfigs = { shouldUseInProcessGanache: false };
    provider = web3Factory.getRpcProvider(providerConfigs);
    const web3Wrapper = new Web3Wrapper(provider);
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    const [owner] = addresses;
    txDefaults = {
        from: owner,
    };

    const contractAddresses = await runMigrationsAsync(provider, txDefaults);
    const prettyAddresses = JSON.stringify(contractAddresses, null, 2);
    writeFileSync('./contract_addresses.json', prettyAddresses);
    console.log(contractAddresses);
    process.exit(0);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
