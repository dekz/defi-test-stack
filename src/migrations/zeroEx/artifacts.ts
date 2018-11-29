import * as zeroExArtifacts from '@0x/contract-artifacts';
import { ContractArtifact } from 'ethereum-types';

export const artifacts = {
    ERC20Proxy: (zeroExArtifacts.ERC20Proxy as any) as ContractArtifact,
    ERC721Proxy: (zeroExArtifacts.ERC721Proxy as any) as ContractArtifact,
    Exchange: (zeroExArtifacts.Exchange as any) as ContractArtifact,
    Forwarder: (zeroExArtifacts.Forwarder as any) as ContractArtifact,
    OrderValidator: (zeroExArtifacts.OrderValidator as any) as ContractArtifact,
};
