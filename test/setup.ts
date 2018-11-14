import { BlockchainLifecycle, web3Factory } from '@0x/dev-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import ChaiBigNumber = require('chai-bignumber');
import * as dirtyChai from 'dirty-chai';

import { runMigrationsAsync } from '../src/migration';

const ganacheConfigs = {
    shouldUseInProcessGanache: true,
    // shouldThrowErrorsOnGanacheRPCResponse: false,
};
export const web3Wrapper = new Web3Wrapper(web3Factory.getRpcProvider(ganacheConfigs));

export const chaiSetup = {
    configure(): void {
        chai.config.includeStack = true;
        chai.use(ChaiBigNumber());
        chai.use(dirtyChai);
        chai.use(chaiAsPromised);
    },
};

export const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
export const provider = web3Wrapper.getProvider();
let contractAddresses = {};
export function getContractAddresses(): any {
    return contractAddresses;
}

before(async () => {
    const addresses = await web3Wrapper.getAvailableAddressesAsync();
    const [ownerAddress] = addresses;
    contractAddresses = await runMigrationsAsync(provider, { from: ownerAddress });
    await blockchainLifecycle.startAsync();
});

after(async () => {
    await blockchainLifecycle.revertAsync();
});
