'use strict';
const Web3 = require('web3');
const util_parity = require('../../src/parity/util.js');
const config = require('./parity.json');
const Tx = require('ethereumjs-tx');
module.exports.info  = 'sending eth between accounts';

let bc, contx;
let value = 100; //Default tx amount
let from,to;
let web3;
let passwords = [];

module.exports.init = function(blockchain, context, args) {
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

    web3 = new Web3();
    let url = config.parity.network.rpc.url;
    if(!web3.currentProvider) {
        web3 = new Web3(url);
    }
    //onsole.log(web3.eth.currentProvider);
    passwords = config.parity.network.passwords;

    return Promise.resolve();
};

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
/*
function getTransactionAsync(hashString) {
    return new Promise((res, rej) => {
        web3.eth.getTransaction(hashString, (err, receipt) => {
            !err ? res(receipt) : rej(err);
        });
    });
}
*/



/**
 *  sendTransaction version run
 */
module.exports.run = async function() {
    //Now I assume once this function is invoked, count++;
    
    if(contx.engine) {
        contx.engine.submitCallback(1);
    }
    
    try{
        var accounts = await getAccountsAsync();
        util_parity.unlockAccountsIfNeeded(web3, accounts, passwords);
        let tx = {
            from: from,
            to: to,
            value: value
        }
        var time_create = Date.now();
        try{
            //add await here and add .then() in the sendTransactionAsync to wait for the receipt
            var hash = sendTransactionAsync(tx);
        }
        catch (err) {
            console.log(tx);
            console.log("what is the hash " + hash);
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


module.exports.end = function(results) {
    return Promise.resolve();
};



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
    let sendtx = require('./sendTx.js');
    var accounts = await getAccountsAsync();
    var privateKeys = config.parity.network.privateKeys;
    var privateKey = new Buffer(privateKeys[0], 'hex');
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



    //util_parity.unlockAccountsIfNeeded(web3, accounts, passwords);

    //onsole.log(web3.eth.currentProvider);
    //passwords = config.parity.network.passwords;
    //sendtx.run();y




}
test();

*/