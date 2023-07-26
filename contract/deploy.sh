#!/bin/sh

# build the contract
npm run build

# deploy the contract
near dev-deploy --wasmFile build/contract.wasm
# near dev-deploy --accountId luckymoneytest.testnet --wasmFile build/contract.wasm