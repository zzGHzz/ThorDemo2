# Demo code for "What you might not know about VeChainThor yet (Part II) - Forcible Transaction Dependency"

## Introduction
The data field `DependsOn` of the [transaction (TX) model]() is designed for enabling a forcible TX dependency on VeChainThor. If we set `DependsOn` of a TX using the TXID of another TX, then the TX would be accepted for processing only if the referred TX is already in the ledger and, moreover, *not reverted*.

This demo does the following:

1. Send TX `TX1` that will not be reverted (by calling `sendNotRevertedTX`)
2. Send TX `TX2` that will be reverted (by calling `sendRevertedTX`)
3. Send TX `TX3` that depends on a non-existing TXID (by calling `sendTestTX`)
3. Send TX `TX4` that depends on `TX1` (by calling `sendTestTX`)
4. Send TX `TX5` that depends on `TX2` (by calling `sendTestTX`)

Function `checkTXs` checks the five TXs in the next 5 new blocks and shows whether each TX is found in the blocks and if found, whether it is reverted.

## Installation
Download the code via

`git clone https://github.com/zzGHzz/ThorDemo2.git`

After that, install all the required packages and you are good to go. 

## Notice
The private key hard coded in the sample code is for this demo only. Please avoid using it in any other circumstance. 

This code connects VeChainThor's test net via

```typescript
const driver = await DriverNodeJS.connect("https://sync-testnet.vechain.org");
const connex = new Framework(driver);
```
