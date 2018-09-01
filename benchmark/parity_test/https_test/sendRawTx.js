'use strict';
const Web3 = require('web3');
const http = require('http');
const util_parity = require('../../../src/parity/util.js');
const util = require('../../../src/comm/util.js');
const config = require('./westlake.json');
const fs = require('fs');
module.exports.info  = 'sending eth between accounts';

let bc, contx;
let value = 100; //Default tx amount
let accountA,accountB;
let privateKeyA;
let addressB;
let web3;
let startTime;
let txCount;
let signedTxs = [];
let method;
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
    // create new accounts for test transactions
    accountA = web3.eth.accounts.create(url);
    accountB = web3.eth.accounts.create(url);
    var str_pri = "" + accountA.privateKey;
    privateKeyA = new Buffer(str_pri.substring(2), 'hex');

    // I don't need the below two for now
    //var privateKeyB = new Buffer(accountB.privateKey.subString(2), 'hex');
    //var addressA = accountA.address;
    addressB = accountB.address;

    // The lower level function in web3.js instead of sendSignedTransaction, this brought me higher performance and less error.
    // However, this won't wait for the receipt from the server side, which sacrifices the original tps calculation function.
    // So I provide another way to calculate the tps from the blocks, see the file main_calTps.js & calculateBlockTxs.js
    method = web3.eth.sendSignedTransaction.method;
    
    if(!startTime){
        startTime = Date.now();
    }
    var promises = [];
    // popping the array will give the reverse order of nonce. So here for loop starts with txCount - 1
    for(var i= txCount-1;i>=0;i--){
        var rawTx = {
            nonce: i,
            //chainId: chainId,
            gas: 210000,
            //gasPrice: 0,
            to: addressB,
            value: 0
        }

        /**
         * I use the promise array to make the signing process parallel.
         */
        promises.push(
            signTransactionAsync(rawTx, privateKeyA)
            .then((signed, err) => {
                if(err)
                    rej(err);
                let payload = method.toPayload([signed.rawTransaction]);
                signedTxs.push(payload);
                Promise.resolve();
            })
        )
        /*
        // The for loop with await way, which is really slow, but rate control is more accurate this way.
        var signed = await signTransactionAsync(rawTx, privateKeyA);
        let payload = method.toPayload([signed.rawTransaction]);
        signedTxs.push(payload);

        */
        

        /**
         * the sendSignedTransactionWay
         *
        const tx = new Tx(rawTx);
        tx.sign(privateKeyA);
        var serializedTx = tx.serialize();
        signedTxs.push('0x' + serializedTx.toString('hex'));
        */
        
    }
    await Promise.all(promises);
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
    /**
     * Option one: Using low level functions in web3.js directly
     * Good points: higher performance, less error from the server.
     * Disadvantages: TPS result provided by the framework isn't valid anymore, have to use another process to calculate.
     */
    try{
        var time_create = Date.now();
        var tx = signedTxs.pop();
        var hash = await mySendSignedTxAsync(tx);
        console.log(hash);
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


