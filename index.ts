import { Framework } from '@vechain/connex-framework'
import { DriverNodeJS } from '@vechain/connex.driver-nodejs'
import { cry, Transaction } from 'thor-devkit'

// function buffer2hexstr(b: Buffer): string {
//     return '0x' + b.toString('hex');
// }

// function genPrivateKey(): [string, string] {
//     const sk_buffer = cry.secp256k1.generatePrivateKey();
//     const addr = buffer2hexstr(cry.publicKeyToAddress(cry.secp256k1.derivePublicKey(sk_buffer)));
//     const sk = buffer2hexstr(sk_buffer);
//     return [sk, addr];
// }

// let x: string;
// let y: string;
// [x, y] = genPrivateKey();

const sk = '0x29a9c5eabe185f68abeb41f4d68e04a5004c146eaa3fd8a76aa3a87b33b6f1a7';
const acc1 = '0x8580C3BFF10f2886B7CF183a8Eb51e76d75B42c4';
const acc2 = '0x91436f1E5008B2E6093E114A25842F060012685d';

(async () => {
    const driver = await DriverNodeJS.connect("https://sync-testnet.vechain.org");
    const connex = new Framework(driver);

    const wallet = driver.wallet;
    wallet.add(sk);

    const signinigService = connex.vendor.sign('tx');
    signinigService.signer(acc1);

    signinigService.gas(21000);
    let ret = await signinigService.request([
        {
            to: acc2,
            value: '1000000000000000000',
            data: '0x'
        }
    ]);
    const txid1 = ret.txid;
    console.log(txid1);
    // const receipt1 = await connex.thor.transaction(txid1).getReceipt();
    // console.log('Reverted: ' + receipt1.reverted);

    const energy_token_addr = '0x0000000000000000000000000000456E65726779';
    const transferABI = { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" };
    const transferMethod = connex.thor.account(energy_token_addr).method(transferABI);
    const energyClause = transferMethod.asClause(acc2, '1000000000000000000000');

    signinigService.gas(30000)
    ret = await signinigService.request([
        {
            ...energyClause
        }
    ]);
    const txid2 = ret.txid;
    console.log(txid2);
    // const receipt2 = await connex.thor.transaction(txid2).getReceipt();
    // console.log('Reverted: ' + receipt1.reverted);    

    signinigService.gas(21000).dependsOn(txid1);
    ret = await signinigService.request([
        {
            to: acc2,
            value: '1000000000000000000',
            data: '0x'
        }
    ]);
    const txid3 = ret.txid;
    console.log(txid3);

    signinigService.gas(21000).dependsOn(txid2);
    ret = await signinigService.request([
        {
            to: acc2,
            value: '1000000000000000000',
            data: '0x'
        }
    ]);
    const txid4 = ret.txid;
    console.log(txid4);
})();