import * as CollateralizedSimpleInterestTermsContract from '@dharmaprotocol/contracts/artifacts/json/CollateralizedSimpleInterestTermsContract.json';
import * as Collateralizer from '@dharmaprotocol/contracts/artifacts/json/Collateralizer.json';
import * as ContractRegistry from '@dharmaprotocol/contracts/artifacts/json/ContractRegistry.json';
import * as DebtKernel from '@dharmaprotocol/contracts/artifacts/json/DebtKernel.json';
import * as DebtRegistry from '@dharmaprotocol/contracts/artifacts/json/DebtRegistry.json';
import * as DebtToken from '@dharmaprotocol/contracts/artifacts/json/DebtToken.json';
import * as DharmaMultiSigWallet from '@dharmaprotocol/contracts/artifacts/json/DharmaMultiSigWallet.json';
import * as PermissionsLib from '@dharmaprotocol/contracts/artifacts/json/PermissionsLib.json';
import * as RepaymentRouter from '@dharmaprotocol/contracts/artifacts/json/RepaymentRouter.json';
import * as SimpleInterestTermsContract from '@dharmaprotocol/contracts/artifacts/json/SimpleInterestTermsContract.json';
import * as TokenRegistry from '@dharmaprotocol/contracts/artifacts/json/TokenRegistry.json';
import * as TokenTransferProxy from '@dharmaprotocol/contracts/artifacts/json/TokenTransferProxy.json';
import { ContractArtifact } from 'ethereum-types';

function convertArtifact(artifact: any): ContractArtifact {
    return { compilerOutput: { abi: artifact.abi, evm: { bytecode: { object: artifact.bytecode } } } } as any;
}
export const artifacts = {
    DebtKernel: convertArtifact(DebtKernel),
    DebtToken: convertArtifact(DebtToken),
    DebtRegistry: convertArtifact(DebtRegistry),
    TokenTransferProxy: convertArtifact(TokenTransferProxy),
    DharmaMultiSigWallet: convertArtifact(DharmaMultiSigWallet),
    RepaymentRouter: convertArtifact(RepaymentRouter),
    TokenRegistry: convertArtifact(TokenRegistry),
    SimpleInterestTermsContract: convertArtifact(SimpleInterestTermsContract),
    CollateralizedSimpleInterestTermsContract: convertArtifact(CollateralizedSimpleInterestTermsContract),
    Collateralizer: convertArtifact(Collateralizer),
    PermissionsLib: convertArtifact(PermissionsLib),
    ContractRegistry: convertArtifact(ContractRegistry),
};
