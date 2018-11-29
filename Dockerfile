FROM node:11.1.0

WORKDIR /usr/src/app

RUN npm install -g ganache-cli@6.1.6
COPY defi_snapshot ./defi_snapshot

ENV MNEMONIC "concert load couple harbor equip island argue ramp clarify fence smart topic"
ENV NETWORK_ID 50

EXPOSE 8545
CMD [ "sh", "-c", "ganache-cli --gasLimit 10000000 --db defi_snapshot --noVMErrorsOnRPCResponse -p 8545 --networkId \"$NETWORK_ID\" -m \"$MNEMONIC\""]
