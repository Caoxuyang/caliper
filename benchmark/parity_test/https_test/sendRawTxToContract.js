'use strict';
const Web3 = require('web3');
const http = require('http');
const util_parity = require('../../../src/parity/util.js');
const util = require('../../../src/comm/util.js');
const config = require('./westlake.json');
const fs = require('fs');
const solc = require('solc')
module.exports.info  = 'transfer tokens between accounts';

let bc, contx;
let value = 100; //Default tx amount
let accountA,accountB;
let privateKeyA;
let addressB;
let web3 = new Web3();
let startTime;
let txCount;
let signedTxs = [];
let method;
let coinbase;
let contract;
let payload;
// Default chain id 0, plz do provide your testing chian id in the config file.
// This will avoid web3 send request to the node for net_version, which introduce network traffic issues.
let chainId = 0; 


module.exports.init = async function(blockchain, context, args) {
    // insecure mode
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    bc      = blockchain;
    contx   = context;
    if(args.hasOwnProperty('txsPerClient') ) {
        txCount = args.txsPerClient;
    }
    
    // To enforse nodejs reuse http port, set an upperbound for number of Sockets
    if(args.hasOwnProperty('maxSocketsPerClient') ) {
        http.globalAgent.maxSockets = args.maxSocketsPerClient;
    }
    else
        http.globalAgent.maxSockets = 100; // Default value 100;
    http.globalAgent.keepAlive = true;
    //console.log(agent.maxSockets);
    let url = config.parity.network.rpc.url;

    var Web3HttpProvider = require('web3-providers-http');
    var username = config.parity.network.rpc.username;
    var password = config.parity.network.rpc.password;
    var headers= [{
        name: 'Authorization',
        value: 'Basic ' + new Buffer(username+ ':' + password).toString('base64')
    }]

    var http1 = new Web3HttpProvider(url, 20000, headers);
    //web3 = new Web3((new Web3.providers.HttpProvider(url, options)));
    web3 = new Web3();
    web3.setProvider(http1);
    web3.eth.setProvider(http1);
    chainId = config.parity.network.rpc.chainId;
    // Locally create new accounts for test transactions and get their accounts and private keys
    accountA = web3.eth.accounts.create(url);
    coinbase = accountA.address;
    accountB = web3.eth.accounts.create(url);
    var str_pri = "" + accountA.privateKey;
    privateKeyA = new Buffer(str_pri.substring(2), 'hex');
    addressB = accountB.address;
    //console.log("coinbase address: ", coinbase," !!!pk!!! ",accountA.privateKey, " accountB: ", addressB," !!!pk!!! ",accountB.privatekey);


    let source = fs.readFileSync('perf_test.sol', 'utf8');
    let compiledContract = solc.compile(source.toString(), 1);
    var abi = compiledContract.contracts[':Token'].interface;
    var bytecode = '0x' + compiledContract.contracts[':Token'].bytecode;


    // The lower level function in web3.js instead of sendSignedTransaction, this brought me higher performance and less error.
    // However, this won't wait for the receipt from the server side, which sacrifices the original tps calculation function.
    // So I provide another way to calculate the tps from the blocks, see the file main_calTps.js & calculateBlockTxs.js
    method = web3.eth.sendSignedTransaction.method;
    
    if(!startTime){
        startTime = Date.now();
    }
    contract = new web3.eth.Contract(JSON.parse(abi),{from:coinbase});
    const contractData = await contract.deploy({
        data: bytecode
    }).encodeABI();
    //console.log(contract);
    const rawTx = {
        nonce: 0,
        gasPrice: '0',
        gas: 800000,
        gasLimit: "0x5e000000",
        data: contractData,
        from: coinbase
    }
    await signTransactionAsync(rawTx, privateKeyA)
            .then( async (signed, err) => {
                if(err)
                    rej(err);
                payload = method.toPayload([signed.rawTransaction]);
                var hash = await mySendSignedTxAsync(payload);
                //This tx is not an official receipt, but it's faster to get.
                var tx = await web3.eth.getTransaction(hash);
                setAddress(tx.creates);
                Promise.resolve();
    });

    //console.log("Contract address: " + contract.options.address);
    var promises = [];

    const txData = web3.eth.abi.encodeFunctionCall({
        
        type: 'function',
        name: 'transfer',
        constant: false,
        payable: false,
        inputs: [{
            type: 'address',
            name: '_to'
        },{
            type: 'uint256',
            name: '_amount'
        }]},[addressB, 100]);

    //console.log(contract);
    //console.log(txData);
    // popping the array will give the reverse order of nonce. So here for loop starts with txCount - 1
    for(var i= txCount;i>=1;i--){
        var testTx = {
            nonce: i,
            //chainId: chainId,
            gas: 200000,
            gasPrice: '0',
            from: coinbase,
            to: contract.options.address,
            data: txData
        }

        /**
         * I use the promise array to make the signing process parallel.
         */
        promises.push(
            signTransactionAsync(testTx, privateKeyA)
            .then((signed, err) => {
                if(err)
                    rej(err);
                let payload = method.toPayload([signed.rawTransaction]);
                signedTxs.push(payload);
                Promise.resolve();
            })
        )
      
        
        
    }
    await Promise.all(promises);
    //console.log(signedTxs);
    //console.log("!!!!!!");
    return Promise.resolve();
};

/**
 *  sendSignedTransaction version run
 */

module.exports.run = async function() {
    //Now I assume once this function is invoked, count++;
    if(contx.engine) {
        contx.engine.submitCallback(1);
    }

    try{
        var time_create = Date.now();
        var tx = signedTxs.pop();
        //console.log(tx);
        var hash = await mySendSignedTxAsync(tx);
    }
    catch (err) {
        //http.globalAgent.destroy();
        console.log(err);
    }

    var time_final = Date.now();
    // Note! status doesn't valid here. Since I used a low level web3.js function to send tx.
    // I don't expect the receipt from the server to release the stress there.
    // So the tps result isn't accurate, use my main_calTps.js to calculate TPS.
    let result = {
        hash : hash,
        status :hash ? 'success' : 'fail',
        time_create : time_create,
        time_final : time_final
    }
    return result;
    
}

module.exports.end = async function(results) {
    //destroy the keep-alive sockets
    //console.log("coinbase address: ", coinbase," !!!pk!!! ",accountA.privateKey, " accountB: ", addressB," !!!pk!!! ",accountB.privatekey);
    //console.log("Contract address: " + contract.options.address);
    //console.log(contract);
    http.globalAgent.destroy();
    return Promise.resolve();
};

/**
 * Sign a row transaction
 * @param {Object} rawTx to be signd
 * @param {String} privateKey to signed the tx with
 */
function signTransactionAsync(rawTx, privateKey) {
    return new Promise((res, rej) => {
        web3.eth.accounts.signTransaction(rawTx, privateKey, function(err, signed) {
            !err ? res(signed) : rej(err);
        })
    })
}

/**
 * 
 * @param {Object} payload well prepared, rawTransaction transfered to payload
 */
function mySendSignedTxAsync(payload) {
    return new Promise((res, rej) => {
            method.requestManager.send(payload, function(err, hash) {
                // Some server will return Invalid JSON RPC response here, I can't help with it. 
                // If that happened, try 1.control the sending rate 2. Send less requests 3. Don't send to the node that are far away from u
                if(err){
                    console.log("Error happened in sendRawTx.mySendSignedTxAsync," ,err);
                    rej(err);
                }
                res(hash);
            })
    })
}

/**
 * 
 * @param {Number} blockNumber the height of the block you want to get
 */
function getBlockAsync(blockNumber) {
    return new Promise((res, rej) => {
        web3.eth.getBlock(blockNumber, function(err, block) {
            !err ? res(block) : rej(err);
        });
    })
}

/**
 * 
 * @param {String} transactionObject signedTx started with '0x'
 */
function sendSignedTransactionAsync(transactionObject) {
    return new Promise((res, rej) => {
        web3.eth.sendSignedTransaction(transactionObject, function(err, transactionHash) {
            if(!err)
             res(transactionHash)
            else {
                rej(err);
                
            } 
        });
    })
}

/* Not used for now*/
function getTransactionReceiptAsync (hash) {
    return new Promise((res, rej) => {
        web3.eth.getTransactionReceipt(hash, (err, receipt) => {
            !err ? res(receipt) : rej(err);
        })
    })
}

function setAddress(address) {
    contract.options.address = address;
}

/* Not used for now*/
module.exports.getBlockNumberAsync = async function() {
    return new Promise((res, rej) => {
        web3.eth.getBlockNumber((err, numb) => {
            !err ? res(numb) : rej(err);
        });
    });
}

module.exports.getStartBlockNumber = function() {
    console.log(startBlockNumber, this.startBlockNumber);
    return startBlockNumber;
}


