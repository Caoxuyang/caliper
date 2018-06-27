'use strict';

// leave for requires ->
const Web3 = require('web3');
/**
 * The function to check whether an account is locked.
 * @param {object} web3 pass the initialised web3 object
 * @param {String} account is the address of the account to be checked whether it's locked
 */
function isAccountLocked(account) {
    try {
        web3.eth.sign("", address);
    } catch (err) {
        return true;
    }
    return false;
}

module.exports.unlockAccountsIfNeeded = function (web3, accounts, passwords) {
    for (let i = 0; i < accounts.length; i++) {
        if (isAccountLocked(accounts[i])) {
            //console.log("Account " + accounts[i] + " is locked. Unlocking")
            web3.eth.personal.unlockAccount(accounts[i], passwords[i]);
        }
    }
}