# Sample code for demonstrating forcible transaction dependency on VeChainThor

## Introduction
The data field `DependsOn` of the [transaction (TX) model]() is designed for enabling a forcible TX dependency on VeChainThor. If we set `DependsOn` of TX `tx1` the TX ID of another TX `tx2`, then `tx2` would be accepted by the system only after `tx1` has been included in the ledger and *not reverted*.

This sample code does the following:

1. Send TX `tx1` that will not be reverted (by calling `sendNotRevertedTX`)
2. Send TX `tx2` that will be reverted (by calling `sendRevertedTX`)
3. Send TX `tx3` that depends on `tx1` (by calling `sendTestTX`)
4. Send TX `tx4` that depends on `tx2` (by calling `sendTestTX`)

Function `checkTXs` checks the four sent TXs in the next three new blocks and shows whether each TX is found in the blocks and if found, whether it is reverted by the system.

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