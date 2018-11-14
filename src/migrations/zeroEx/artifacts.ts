import { ContractArtifact } from 'ethereum-types';

import * as ERC20Proxy from '../../../artifacts/zeroEx/ERC20Proxy.json';
import * as ERC721Proxy from '../../../artifacts/zeroEx/ERC721Proxy.json';
import * as Exchange from '../../../artifacts/zeroEx/Exchange.json';
import * as Forwarder from '../../../artifacts/zeroEx/Forwarder.json';
import * as OrderValidator from '../../../artifacts/zeroEx/OrderValidator.json';

export const artifacts = {
    ERC20Proxy: (ERC20Proxy as any) as ContractArtifact,
    ERC721Proxy: (ERC721Proxy as any) as ContractArtifact,
    Exchange: (Exchange as any) as ContractArtifact,
    Forwarder: (Forwarder as any) as ContractArtifact,
    OrderValidator: (OrderValidator as any) as ContractArtifact,
};
