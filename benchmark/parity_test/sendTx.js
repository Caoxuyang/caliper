'use strict';
const Web3 = require('web3');
const util_parity = require('../../src/parity/util.js');
const config = require('./parity.json');
const ethereumjs = require('ethereumjs-tx');
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
/*
function getTransactionAsync(hashString) {
    return new Promise((res, rej) => {
        web3.eth.getTransaction(hashString, (err, receipt) => {
            !err ? res(receipt) : rej(err);
        });
    });
}
*/

module.exports.run = async function() {
    //Now I assume once this function is invoked, count++;
    
    if(contx.engine) {
        contx.engine.submitCallback(1);
    }
    
    try{
        var accounts = await getAccountsAsync();
        util_parity.unlockAccountsIfNeeded(web3, accounts, passwords);
        //send from a random account to a specific account
        //var random = Math.floor(Math.random()*accounts.length);
        let tx = {
            from: from,
            to: to,
            value: value
        }
        var time_create = Date.now();
        try{
            var hash = await sendTransactionAsync(tx);
        }
        catch (err) {
            console.log(tx);
            console.log("what is the hash " + hash);
            console.log("Error happened in sendTx.run. " + err);
        }
        var time_final = Date.now();
        //console.log("time_create: " + time_create + " time_end: " + time_end);

        //getTrarnsactionReceipt function is not working...
        //var receipt = await getTransactionAsync(hash);

        /*
        TODO, remember to move this part to parity.js file
        if(contx.engine) {
            contx.engine.submitCallback(1);
        }
        */
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


module.exports.end = function(results) {
    return Promise.resolve();
};



/**
 * Unit Test
 * 
*/
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
    web3.eth.getTransactionCount(accounts[0], function (err, nonce) {
        //var data = web3.eth.contract(abi).at(address).increment.getData();
    
        var tx = new ethereumjs.Tx({
          nonce: nonce,
          gasPrice: 930000,
          gasLimit: 10000000,
          to: accounts[1],
          value: 1000000000000000000
        });
        tx.sign(ethereumjs.Buffer.Buffer.from(privateKeys[0], 'hex'));
    
        var raw = '0x' + tx.serialize().toString('hex');
        web3.eth.sendRawTransaction(raw, function (err, transactionHash) {
          console.log(transactionHash);
        });
    });



    //util_parity.unlockAccountsIfNeeded(web3, accounts, passwords);

    //onsole.log(web3.eth.currentProvider);
    //passwords = config.parity.network.passwords;
    //sendtx.run();




}
test();

