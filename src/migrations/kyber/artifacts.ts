import { ContractArtifact } from 'ethereum-types';

import * as ConversionRates from '../../../artifacts/kyber/ConversionRates.json';
import * as ExpectedRate from '../../../artifacts/kyber/ExpectedRate.json';
import * as FeeBurner from '../../../artifacts/kyber/FeeBurner.json';
import * as KyberGenesisToken from '../../../artifacts/kyber/KyberGenesisToken.json';
import * as KyberNetwork from '../../../artifacts/kyber/KyberNetwork.json';
import * as KyberNetworkCrystal from '../../../artifacts/kyber/KyberNetworkCrystal.json';
import * as KyberNetworkProxy from '../../../artifacts/kyber/KyberNetworkProxy.json';
import * as KyberReserve from '../../../artifacts/kyber/KyberReserve.json';
import * as SanityRates from '../../../artifacts/kyber/SanityRates.json';
import * as WhiteList from '../../../artifacts/kyber/WhiteList.json';

function convertArtifact(artifact: any): ContractArtifact {
    return { compilerOutput: { abi: artifact.abi, evm: { bytecode: { object: artifact.bytecode } } } } as any;
}
export const artifacts = {
    KyberNetwork: convertArtifact(KyberNetwork),
    KyberNetworkProxy: convertArtifact(KyberNetworkProxy),
    KyberReserve: convertArtifact(KyberReserve),
    ConversionRates: convertArtifact(ConversionRates),
    FeeBurner: convertArtifact(FeeBurner),
    ExpectedRate: convertArtifact(ExpectedRate),
    WhiteList: convertArtifact(WhiteList),
    SanityRates: convertArtifact(SanityRates),
    KyberNetworkCrystal: convertArtifact(KyberNetworkCrystal),
    KyberGenesisToken: convertArtifact(KyberGenesisToken),
};
