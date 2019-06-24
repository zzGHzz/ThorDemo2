import { Framework } from '@vechain/connex-framework'
import { DriverNodeJS } from '@vechain/connex.driver-nodejs'
import { cry } from 'thor-devkit'

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

    let txids: string[] = [];
    let ret = undefined;

    // 
    ret = await sendNotRevertedTX(signinigService);
    txids.push(ret.txid);
    console.log('Broadcast TX with ID = ' + ret.txid);
    console.log('...');

    //
    ret = await sendRevertedTX(signinigService, connex);
    txids.push(ret.txid);
    console.log('Broadcast TX with ID = ' + ret.txid);
    console.log('...');

    ret = await sendTestTX(signinigService, txids[0]);
    txids.push(ret.txid);
    console.log('Broadcast TX with ID = ' + ret.txid);
    console.log('...');

    ret = await sendTestTX(signinigService, txids[1]);
    txids.push(ret.txid);
    console.log('Broadcast TX with ID = ' + ret.txid);
    console.log('...');

    checkTXs(connex, txids);
})();

function sendNotRevertedTX(signinigService: Connex.Vendor.SigningService<'tx'>) {
    signinigService.gas(21000);
    return signinigService.request([
        {
            to: acc2,
            value: '1000000000000000000',
            data: '0x'
        }
    ]);
}

function sendRevertedTX(signinigService: Connex.Vendor.SigningService<'tx'>, connex: Connex) {
    const energy_token_addr = '0x0000000000000000000000000000456E65726779';
    const transferABI = { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" };
    const transferMethod = connex.thor.account(energy_token_addr).method(transferABI);
    const energyClause = transferMethod.asClause(acc2, '1000000000000000000000');

    signinigService.gas(30000)
    return signinigService.request([
        {
            ...energyClause
        }
    ]);
}

function sendTestTX(signinigService: Connex.Vendor.SigningService<'tx'>, txid: string) {
    signinigService.gas(21000).dependsOn(txid);
    return signinigService.request([
        {
            to: acc2,
            value: '1000000000000000000',
            data: '0x'
        }
    ]);
}

async function checkTXs(connex: Connex, txids: string[]) {
    const MAX_ITER = 3;
    const checker = [false, false, false, false];
    const ticker = connex.thor.ticker();
    for (let i = 0; i < MAX_ITER; i++) {
        await ticker.next();

        console.log('--------------------------')
        console.log('Block Number = ' + connex.thor.status.head.number);
        console.log('--------------------------')
        for (let j in txids) {
            if (checker[j]) {
                continue;
            }

            console.log('...');
            console.log('Checking TX with ID = ' + txids[j]);
            console.log('...');

            const ret = await connex.thor.transaction(txids[j]).getReceipt();
            if (ret === null) {
                console.log('TX not found!');
            } else {
                console.log('TX found!');
                checker[j] = true;
            }
        }
        console.log('...');
    }
}

function buffer2hexstr(b: Buffer): string {
    return '0x' + b.toString('hex');
}

function genPrivateKey(): [string, string] {
    const sk = cry.secp256k1.generatePrivateKey();
    const addr = cry.publicKeyToAddress(cry.secp256k1.derivePublicKey(sk));
    return [buffer2hexstr(sk), buffer2hexstr(addr)];
}