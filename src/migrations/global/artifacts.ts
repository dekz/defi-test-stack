import { ContractArtifact } from 'ethereum-types';

import { DummyERC20Token, DummyERC721Token, WETH9 } from '@0x/contract-artifacts';

export const artifacts = {
    DummyERC20Token: (DummyERC20Token as any) as ContractArtifact,
    DummyERC721Token: (DummyERC721Token as any) as ContractArtifact,
    WETH9: (WETH9 as any) as ContractArtifact,
};
