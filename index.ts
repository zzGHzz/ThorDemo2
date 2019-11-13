import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleNet, SimpleWallet } from '@vechain/connex.driver-nodejs';
import { cry } from 'thor-devkit'

const sk = '0x29a9c5eabe185f68abeb41f4d68e04a5004c146eaa3fd8a76aa3a87b33b6f1a7';
const acc1 = '0x8580C3BFF10f2886B7CF183a8Eb51e76d75B42c4';
const acc2 = '0x91436f1E5008B2E6093E114A25842F060012685d';

const val = '1000000000000000000';

(async () => {
    const net = new SimpleNet("https://sync-testnet.vechain.org");
    const wallet = new SimpleWallet();
    const driver = await Driver.connect(net, wallet);
    const connex = new Framework(driver);

    wallet.import(sk);

    const signinigService = connex.vendor.sign('tx');
    signinigService.signer(acc1);

    let txids: string[] = [];
    let ret = undefined;
 
    // TX1
    ret = await sendNotRevertedTX(signinigService);
    txids.push(ret.txid);
    console.log('Sent TX1 with ID = ' + ret.txid);
    console.log('...');

    // TX2
    ret = await sendRevertedTX(signinigService, connex);
    txids.push(ret.txid);
    console.log('Sent TX2 with ID = ' + ret.txid);
    console.log('...');

    // TX3
    let id = '0x';
    for(let i =0 ; i < 63; i++){
        id += '0';
    }
    id += '1';
    ret = await sendTestTX(signinigService, id);
    txids.push(ret.txid);
    console.log('Sent TX3 with ID = ' + ret.txid);
    console.log('TX3 depends on an nonexisting TXID');
    console.log('...');

    // TX4
    ret = await sendTestTX(signinigService, txids[0]);
    txids.push(ret.txid);
    console.log('Sent TX4 with ID = ' + ret.txid);
    console.log('TX4 depends on TX1');
    console.log('...');

    // TX5
    ret = await sendTestTX(signinigService, txids[1]);
    txids.push(ret.txid);
    console.log('Sent TX5 with ID = ' + ret.txid);
    console.log('TX5 depends on TX2');
    console.log('...');

    // Check the status of the five TXs in the next five blocks
    checkTXs(connex, txids);
})();

function sendNotRevertedTX(signinigService: Connex.Vendor.SigningService<'tx'>) {
    signinigService.gas(21000);
    return signinigService.request([
        {
            to: acc2,
            value: val,
            data: '0x'
        }
    ]);
}

function sendRevertedTX(signinigService: Connex.Vendor.SigningService<'tx'>, connex: Connex) {
    // Create a clause for tranfering 1 VTHO from acc1 to acc2
    const energy_token_addr = '0x0000000000000000000000000000456E65726779';
    const transferABI = { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" };
    const transferMethod = connex.thor.account(energy_token_addr).method(transferABI);
    const energyClause = transferMethod.asClause(acc2, val);

    // Set the gas amount so that the TX will be reverted due to the out-of-gas error
    signinigService.gas(30000);

    return signinigService.request([
        {
            ...energyClause
        }
    ]);
}

function sendTestTX(signinigService: Connex.Vendor.SigningService<'tx'>, txid: string) {
    // Assign DependsOn 
    signinigService.dependsOn(txid);

    signinigService.gas(21000);
    return signinigService.request([
        {
            to: acc2,
            value: val,
            data: '0x'
        }
    ]);
}

async function checkTXs(connex: Connex, txids: string[]) {
    const MAX_ITER = 5;
    const checker = [false, false, false, false, false];
    const ticker = connex.thor.ticker();
    for (let i = 0; i < MAX_ITER; i++) {
        // Wait until the next block detected
        await ticker.next();

        console.log('--------------------------')
        console.log('Block Number = ' + connex.thor.status.head.number);
        console.log('--------------------------')
        for (let j = 0; j < txids.length; j++) {
            if (checker[j]) {
                continue;
            }

            let tx_str = 'TX' + (j+1);

            console.log('...');
            console.log('Checking ' + tx_str + ' with ID = ' + txids[j]);
            console.log('...');

            // Get the TX receipt
            const ret = await connex.thor.transaction(txids[j]).getReceipt();

            // Check TX status
            if (ret === null) {
                console.log(tx_str + ' not found!');
            } else {
                console.log(tx_str + ' found! If reverted: ' + ret.reverted);
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