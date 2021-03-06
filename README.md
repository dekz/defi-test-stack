[![CircleCI](https://circleci.com/gh/dekz/defi-test-stack.svg?style=svg)](https://circleci.com/gh/dekz/defi-test-stack)

# DeFi Test Stack

Included projects:

-   [0x](https://0x.org)
-   [Kyber](https://kyber.network/)
-   [Dharma](https://dharma.io/)

This project aims to build an interoperable environment for the projects in the DeFi stack. A full stack can be deployed to Ganache or a Testnet/private network.

Utility tokens aim to be shared over multiple projects. So the ZRX token deployed by 0x can be traded with a Kyber reserve manager and offered in a loan in Dharma.

### Install

```
yarn
yarn generate_contract_wrappers
yarn build
yarn test
```

### Running the snapshot

#### Docker

The deployed contracts can be ran via a Docker container:

```
docker run -p 8545:8545 -ti dekz/defi-test-stack:latest
```

#### Locally

To make use of the snapshot download the [defi_snapshot.zip](https://github.com/dekz/defi-test-stack/releases) and extract the contents. With Ganache-cli installed, in a terminal run the following command:

```
ganache-cli --gasLimit 10000000 --db defi_snapshot --noVMErrorsOnRPCResponse -p 8545 --networkId 50 -m \"concert load couple harbor equip island argue ramp clarify fence smart topic\"",
```

The default mnemonic is:

```
concert load couple harbor equip island argue ramp clarify fence smart topic
```

With the following available accounts:

```
Available Accounts
==================
(0) 0x5409ed021d9299bf6814279a6a1411a7e866a631 (~100 ETH)
(1) 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb (~100 ETH)
(2) 0xe36ea790bc9d7ab70c55260c66d52b1eca985f84 (~100 ETH)
(3) 0xe834ec434daba538cd1b9fe1582052b880bd7e63 (~100 ETH)
(4) 0x78dc5d2d739606d31509c31d654056a45185ecb6 (~100 ETH)
(5) 0xa8dda8d7f5310e4a9e24f8eba77e091ac264f872 (~100 ETH)
```

If this is not to your preference you can modify this project settings and generate your own snapshot.

### Generate a snapshot

```
yarn clean
yarn ganache-cli
```

As Ganache is now running in that terminal, in another terminal run the following:

```
yarn generate_snapshot
```

The result will be a defi_snapshot.zip file which you can run.

### Deployed Addresses

As a result of running the deployment migrations you will receive a list of deployed contracts, for example:

```javascript
{
  "global": {
    "etherToken": "0x1dc4c1cefef38a777b15aa20260a54e584b16c48"
  },
  "zeroEx": {
    "erc20Proxy": "0x1d7022f5b17d2f8b695918fb48fa1089c9f85401",
    "erc721Proxy": "0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c",
    "zrxToken": "0x0b1ba0af832d7c05fd64161e0db78e85978e8082",
    "exchange": "0x48bacb9266a570d521063ef5dd96e61686dbe788",
    "forwarder": "0xbe0037eaf2d64fe5529bca93c18c9702d3930376",
    "orderValidator": "0x07f96aa816c1f244cbc6ef114bb2b023ba54a2eb"
  },
  "kyber": {
    "kncToken": "0x6a4a62e5a7ed13c361b176a5f62c2ee620ac0df8",
    "kgtToken": "0x6dfff22588be9b3ef8cf0ad6dc9b84796f9fb45f",
    "network": "0xcfc18cec799fbd1793b5c43e773c98d4d61cc2db",
    "networkProxy": "0xf22469f31527adc53284441bae1665a7b9214dba",
    "expectedRate": "0xdc688d29394a3f1e6f1e5100862776691afaf3d2",
    "whitelist": "0xe86bb98fcf9bff3512c74589b78fb168200cc546",
    "feeBurner": "0xb69e673309512a9d726f87304c6984054f87a93b",
    "reserve": "0x131855dda0aaff096f6854854c55a4debf61077a",
    "sanityRates": "0x8d61158a366019ac78db4149d75fff9dda51160d"
  },
  "dharma": {
    "collateralizer": "0xc7124963ab16c33e5bf421d4c0090116622b3074",
    "simpleInterestTermsContract": "0x7209185959d7227fb77274e1e88151d7c4c368d3",
    "debtToken": "0xc1be2c0bb387aa13d5019a9c518e8bc93cb53360",
    "debtKernel": "0x10a736a7b223f1fe1050264249d1abb975741e75",
    "debtRegistry": "0xdff540fe764855d3175dcfae9d91ae8aee5c6d6f",
    "contractRegistry": "0xc6b0d3c45a6b5092808196cb00df5c357d55e1d5",
    "permissionLib": "0x5315e44798395d4a952530d131249fe00f554565",
    "tokenTransferProxy": "0xda54ecf5a234d6cd85ce93a955860834aca75878",
    "repaymentRouter": "0x33def1aa867be09809f3a01ce41d5ec1888846c9",
    "collateralizedSimpleInterestTermsContract": "0x3f16ca81691dab9184cb4606c361d73c4fd2510a",
    "tokenRegistry": "0xb125995f5a4766c451cd8c34c4f5cac89b724571"
  }
}
```

## Contributing

We welcome all contributions to this project. If you are adding your own protocol or project then please note you may be requested to maintain your portion.

Firstly select your ABI output json you wish to add, we require the ABI and bytecode fields to be present. Then add your selected ABI's to the `package.json` config section like so:

```json
    "config": {
        ...
        "abis_new_project": "./artifacts/new_project/@(Contract1|Contract2).json",
    },
```

Add the following under scripts in the `package.json`

```json
    "generate_contract_wrappers": "yarn wrappers:global && yarn wrappers:0x && yarn wrappers:kyber && yarn wrappers:new_project",
    "wrappers:new_project": "abi-gen --abis ${npm_package_config_abis_new_project} ${npm_package_config_abi_gen_args} --output src/migrations/new_project/generated-wrappers",
```

After running `yarn generate_contract_wrappers` your ABI will be translated into Typescript wrappers which can be used in your migrations. Create a new migrations directory:

```
mkdir src/migrations/new_project
touch src/migrations/new_project/artifacts.ts
touch src/migrations/new_project/migration.ts
```

Your migration file needs to export the following function in wich you will perform the necessary deployment and set up required for your project:

```typescript
export async function runMigrationsAsync(
    contractAddresses: any,
    provider: Provider,
    txDefaults: Partial<TxData>,
): Promise<{}>;
```

Ensure you return the deployed contract addresses from your `runMigrationsAsync` function to make it available for other projects and tests.

Add your migration to the main migration entrypoint `src/migrations.ts`.

```typescript
import { runMigrationsAsync as NewProjectMigrationAsync } from './migrations/new_project/migration';

const migrations = [GlobalMigrationAsync, ZeroExMigrationAsync, KyberMigrationAsync, NewProjectMigrationAsync];
```

Build and run the tests

```
yarn build
yarn test
```

## Maintainers

-   0x: @dekz
-   Kyber: @ayobuenavista
