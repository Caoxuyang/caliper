'use strict';

// leave for requires ->
const Web3 = require('web3');
const fs = require('fs');

/**
 * The function to check whether an account is locked.
 * @param {object} web3 pass the initialised web3 object
 * @param {String} account is the address of the account to be checked whether it's locked
 */

 let web3 =  new Web3();;

function _isAccountLocked(account) {
    try {
        web3.eth.sign("", address);
    } catch (err) {
        return true;
    }
    return false;
}


function _getBlockNumberAsync (){
    return new Promise((res, rej) => {
        web3.eth.getBlockNumber((err, numb) => {
            !err ? res(numb) : rej(err);
        });
    });
}


module.exports.unlockAccountsIfNeeded = function (web3, accounts, passwords) {
    for (let i = 0; i < accounts.length; i++) {
        if (_isAccountLocked(accounts[i])) {
            //console.log("Account " + accounts[i] + " is locked. Unlocking")
            web3.eth.personal.unlockAccount(accounts[i], passwords[i]);
        }
    }
}

module.exports.writeStartBlock = async function (configPath) {
    var config = require(configPath)
    let url = config.parity.network.rpc.url;
    if(!web3.currentProvider) {
        web3 = new Web3(url);
    }
    let startBlockNumber = await _getBlockNumberAsync();
    // write the startBlockNumber for later other process to count txs in the block 
    fs.writeFile("./startBlockNumber.txt", startBlockNumber, () => {});
}