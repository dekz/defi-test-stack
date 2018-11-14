import { ContractArtifact } from 'ethereum-types';

import * as DummyERC20Token from '../artifacts/global/DummyERC20Token.json';
import * as DummyERC721Token from '../artifacts/global/DummyERC721Token.json';
import * as WETH9 from '../artifacts/global/WETH9.json';

export const artifacts = {
    DummyERC20Token: (DummyERC20Token as any) as ContractArtifact,
    DummyERC721Token: (DummyERC721Token as any) as ContractArtifact,
    WETH9: (WETH9 as any) as ContractArtifact,
};
