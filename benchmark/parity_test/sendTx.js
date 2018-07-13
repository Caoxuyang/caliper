'use strict';
const Web3 = require('web3');
const util_parity = require('../../src/parity/util.js');
const util = require('../../src/comm/util.js');
const config = require('./parity.json');
const Tx = require('ethereumjs-tx');
const fs = require('fs');
module.exports.info  = 'sending eth between accounts';

let bc, contx;
let value = 100; //Default tx amount
let from,to;
let web3 = new Web3();
let passwords = [];
let startTime;
var startBlockNumber;

module.exports.init = async function(blockchain, context, args) {
    bc      = blockchain;
    contx   = context;

    if(args.hasOwnProperty('amount') ) {
        //console.log(args.amount);
        value = args.amount;
    }
    if(args.hasOwnProperty('from')) {
        //console.log(args.from);
        from = args.from;
    }
    if(args.hasOwnProperty('to')) {
        //console.log(args.to);
        to = args.to;
    }
    //web3 = new Web3();
    let url = config.parity.network.rpc.url;
    if(!web3.currentProvider) {
        web3 = new Web3(url);
    }
    var accounts = await getAccountsAsync();
    passwords = config.parity.network.passwords;
    util_parity.unlockAccountsIfNeeded(web3, accounts, passwords);
    if(!startBlockNumber){
        startBlockNumber = await _getBlockNumberAsync();
        fs.writeFile("./startBlockNumber.txt", startBlockNumber, () => {});
    }
    if(!startTime){
        startTime = Date.now();
    }
    //console.log("startBlockNumber ",startBlockNumber);
    return Promise.resolve();
};

/**
 *  sendTransaction version run
 */
module.exports.run = async function() {
    //Now I assume once this function is invoked, count++;
    
    if(contx.engine) {
        contx.engine.submitCallback(1);
    }
    
    try{
        
        let tx = {
            from: from,
            to: to,
            value: value
        }
        var time_create = Date.now();
        try{
            //add await here and add .then() in the sendTransactionAsync to wait for the receipt
            var hash = await sendTransactionAsync(tx);
            //console.log(hash);
        }
        catch (err) {
            //console.log(tx);
            //console.log("what is the hash " + hash);
            console.log("Error happened in sendTx.run. " + err);
        }
        var time_final = Date.now();
        let result = {
            hash : hash,
            status: hash ? 'success' : 'fail',
            time_create : time_create,
            time_final : time_final
        }
        //console.log(result);
        return result;
    }
    catch(err) {
        console.log("Error happened in sendTx.js " + err);
        throw err;
    }
}


/**
 *  sendSignedTransaction version run
 *

module.exports.run = async function() {
    //Now I assume once this function is invoked, count++;
    
    if(contx.engine) {
        contx.engine.submitCallback(1);
    }
    
    try{
        var accounts = await getAccountsAsync();
        // For now I use the first account for testing use
        var privateKeys = config.parity.network.privateKeys;
        var privateKey = new Buffer(privateKeys[0], 'hex');

        var time_create = Date.now();
        try{
            var rawTx = {
                nonce: 13,
                gasPrice: 0,
                gasLimit: 10000000,
                to: accounts[1],
                value: 0
                };
            const tx = new Tx(rawTx);
            //console.log(privateKeys[0]);
            tx.sign(privateKey);
            var serializedTx = tx.serialize();
            var hash = await sendSignedTransactionAsync('0x' + serializedTx.toString('hex'));
            
        }
        catch (err) {
           // console.log(tx);
            //console.log("what is the hash " + hash);
            console.log("Error happened in sendTx.run. " + err);
        }
        var time_final = Date.now();
        let result = {
            hash : hash,
            status : hash ? 'success' : 'fail',
            time_create : time_create,
            time_final : time_final
        }
        //console.log(result);
        return result;
    }
    catch(err) {
        console.log("Error happened in sendTx.js " + err);
        throw err;
    }
}

*/


module.exports.end = async function(results) {
    return Promise.resolve();
};



function getBlockTransactionCountAsync(blockNumber) {
    return new Promise((res, rej) => {
        web3.eth.getBlockTransactionCount(blockNumber, function(err, txCount) {
            !err ? res(txCount) : rej(err);
        });
    })
}

function getBlockAsync(blockNumber) {
    return new Promise((res, rej) => {
        web3.eth.getBlock(blockNumber, function(err, block) {
            !err ? res(block) : rej(err);
        });
    })
}


function getAccountsAsync() {
    return new Promise((res, rej) => {
        web3.eth.getAccounts((err, result) =>{
            !err ? res(result) : rej(err);
        })
    });
}

function sendTransactionAsync(transactionObject) {
    return new Promise((res, rej) => {
        web3.eth.sendTransaction(transactionObject, (err, transactionHash) => {
            !err ? res(transactionHash) : rej(err);
        });
    });
}

function sendSignedTransactionAsync(transactionObject) {
    return new Promise((res, rej) => {
        web3.eth.sendSignedTransaction(transactionObject, function(err, transactionHash) {
            !err ? res(transactionHash) : rej(err);
        });
    })
}

function _getBlockNumberAsync (){
    return new Promise((res, rej) => {
        web3.eth.getBlockNumber((err, numb) => {
            !err ? res(numb) : rej(err);
        });
    });
}

/* Not used for now*/
function getTransactionReceiptAsync (hash) {
    return new Promise((res, rej) => {
        web3.eth.getTransactionReceipt((err, receipt) => {
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


/**
 *  For now I didn't implement this
 */
module.exports.calculateTpsUsingBlock = async function() {
    var block = startBlockNumber + 1;
    var endTime;
    var txs = 0;
    while(true) {
        var temp = await getBlockTransactionCountAsync(block);
        if(temp){
            txs += temp;
            console.log("The block number is ", block," and the transaction count is ", temp);
            console.log("Total txs is ", txs);
            endTime = await getBlockAsync(block).timestamp;
            console.log("starttime ", startTime);
            block++;
        }
        else{
            break;
        }
    }
}

module.exports.getStartBlockNumber = function() {
    console.log(startBlockNumber, this.startBlockNumber);
    return startBlockNumber;
}
/**
 * Unit Test
 * 


async function test() {
    console.log("I'm in the test function");
    web3 = new Web3();
    let url = config.parity.network.rpc.url;
    if(!web3.currentProvider) {
        web3 = new Web3(url);
    }
    //let sendtx = require('./sendTx.js');
    var accounts = await getAccountsAsync();
    var privateKeys = config.parity.network.privateKeys;
    var privateKey = new Buffer(privateKeys[0], 'hex');
    //var numb = await getBlockNumberAsync();



    //console.log("!!!!!!!!!!!!!!!!!!!!!",numb);
    for(var i=0;i<10;i++){

        //web3.eth.getTransactionCount(accounts[0], function (err, nonce) {
            //var data = web3.eth.contract(abi).at(address).increment.getData();
            var rawTx = {
            nonce: i+1,
            gasPrice: 0,
            gasLimit: 10000000,
            to: accounts[1],
            value: 0
            };
            const tx = new Tx(rawTx);
            //console.log(privateKeys[0]);
            tx.sign(privateKey);
            var serializedTx = tx.serialize();
            web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
                if(!err){
                    console.log(hash);
                }
                else{
                    console.log("ERROR");
                }
            });
            //tx.sign(ethereumjs.Buffer.Buffer.from(privateKeys[0], 'hex'));

        //});

        
    }


    passwords = config.parity.network.passwords;
    util_parity.unlockAccountsIfNeeded(web3, accounts, passwords);

    for(var i=0;i<1000;i++) {
        let tx = {
            from: "0x00d695cD9B0fF4edc8CE55b493AEC495B597e235",
            to: "0x00CB25f6fD16a52e24eDd2c8fd62071dc29A035c",
            value: 0
        }
        sendTransactionAsync(tx);
    }
    



}
test();

*/
