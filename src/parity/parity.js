'use strict';

const Web3 = require('web3');
const BlockchainInterface = require('../comm/blockchain-interface.js');
const util_parity = require('./util.js');
const sendTx = require('../../benchmark/parity_test/sendTx.js');
let web3;
/**
 * Implements {BlockchainInterface} for a Parity backend.
 */
class Parity extends BlockchainInterface{
    /**
     * Constructor
     * Create a new instance of {Parity} class
     * @param {String} config_path path of the blockchain configuration file
     */
    constructor(config_path) {
        super(config_path);
        this.configPath = config_path;
    }

    /**
     * Initialise the {Parity} object
     * 
     * @return {Promise} The return promise
     */
    init() {
        // TODO
        return Promise.resolve();
    }

    /**
     * Install smart contract(s) in parity
     * I will add this after implementing the simplest functions
     */
    installSmartContract() {
        // TODO
        return Promise.resolve();
    }

    /**
     * Get a context for subsequent operations
     * Nothing to do right now
     * @param {String} name name of the context
     * @param {Object} args adapter specific arguments
     */
    getContext(name, args) {
        return Promise.resolve();
    }

    /**
     * Release a context as well as related resources
     * After all the transactions are mined, print the block info and txs in them.
     * @param {Object} context adapter specific object
     */
    releaseContext(context) {
        return Promise.resolve();
    }

    


    /**
     * Invoke a smart contract
     * @param {Object} context context object
     * @param {String} contractID identiy of the contract
     * @param {String} contractVer version of the contract
     * @param {Array} args array of JSON formatted arguments for multiple transactions
     * @param {Number} timeout request timeout, in second
     */
    invokeSmartContract(context, contractID, contractVer, args, timeout) {
        return Promise.resolve();
    }

    /**
     * Perform required preparation for test clients
     * In this case I just return the clientArgs here
     * @param {Number} number count of test clients
     * @return {Promise} obtained material for test clients
     */
    prepareClients (number) {
        //TODO
        let clientArgs = [];
        for(var i=0;i<number;i++){
            clientArgs[i] = i;
        }
        util_parity.writeStartBlock(this.configPath);
        return Promise.resolve(clientArgs);
    }

    /**
     * Query state from the ledger
     * @param {Object} context context object from getContext
     * @param {String} contractID identiy of the contract
     * @param {String} contractVer version of the contract
     * @param {String} key lookup key
     */
    queryState(context, contractID, contractVer, key) {
        return Promise.resolve();
    }

    /**
     * Get adapter specific transaction statistics
     * @param {JSON} stats txStatistics object
     * @param {Array} results array of txStatus objects
     */
    getDefaultTxStats(stats, results) {
        for(let i = 0 ; i < results.length ; i++) {
            let stat = results[i];
            console.log("!!!! im here");
        }
      
    }
}
module.exports = Parity;














/*
async function test() {
    console.log("I'm in the test function");
    web3 = new Web3();
    var config = require('../../benchmark/parity_test/parity.json');
    let url = config.parity.network.rpc.url;
    if(!web3.currentProvider) {
        web3 = new Web3(url);
    }
    let accounts = await getAccountsAsync();
    let tx = {
        from: "0x00d695cD9B0fF4edc8CE55b493AEC495B597e235",
        to: "0x00CB25f6fD16a52e24eDd2c8fd62071dc29A035c",
        value: 100000000000000000000
    }
    var passwords = config.parity.network.passwords;

    util_parity.unlockAccountsIfNeeded(web3, accounts, passwords);
    var hash = await sendTransactionAsync(tx);
    var receipt = await getTransactionReceiptAsync(hash);

    //console.log(hash);
    console.log(receipt);
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

function getTransactionReceiptAsync(hashString) {
    return new Promise((res, rej) => {
        web3.eth.getTransactionReceipt(hashString, (err, receipt) => {
            !err ? res(receipt) : rej(err);
        });
    });
}
test();

*/