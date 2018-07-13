'use strict';
const Web3 = require('web3');
const util_parity = require('../../src/parity/util.js');
const sendTx = require('./sendTx.js');
const fs = require('fs');
const cal = require('./calculateBlockTxs.js');
var web3;
let config, net;
let configFile, netWorkFile;

function getBlockAsync(blockNum) {
    return new Promise((res, rej) => {
        web3.eth.getBlock(blockNum, function(err, data) {
            if(!err) {
                res(data);
            }
            else {
                console.log("Error happened in getBlockAsync,", err);
                console.log(blockNum);
                rej(err);
            }
        });
    })
}
/**
 * Set benchmark config file
 * @param {*} file config file of the benchmark,  default is config.json
 */
function setConfig(file) {
    configFile = file;
}

/**
 * Set benchmark network file
 * @param {*} file config file of the blockchain system, eg: fabric.json
 */
function setNetwork(file) {
    netWorkFile = file;
}

/**
 * Calculate TPS using transactions in blocks
 */
module.exports.calculate = async function() {
    let program = require('commander');
    program.version('0.1')
        .option('-c, --config <file>', 'config file of the benchmark, default is config.json', setConfig)
        .option('-n, --network <file>', 'config file of the blockchain system under test, if not provided, blockchain property in benchmark config is used', setNetwork)
        .parse(process.argv);
    const path = require('path');
    const fs = require('fs-extra');
    let absConfigFile;
    if(typeof configFile === 'undefined') {
        absConfigFile = path.join(__dirname, 'config.json');
    }
    else {
        absConfigFile = path.join(__dirname, configFile);
    }
    if(!fs.existsSync(absConfigFile)) {
        Util.log('file ' + absConfigFile + ' does not exist');
        return;
    }

    let absNetworkFile;
    let absCaliperDir = path.join(__dirname, '../..');
    if(typeof netWorkFile === 'undefined') {
        try{
            let config = require(absConfigFile);
            absNetworkFile = path.join(absCaliperDir, config.blockchain.config);
        }
        catch(err) {
            Util.log('failed to find blockchain.config in ' + absConfigFile);
            return;
        }
    }
    else {
        absNetworkFile = path.join(__dirname, netWorkFile);
    }
    if(!fs.existsSync(absNetworkFile)) {
        Util.log('file ' + absNetworkFile + ' does not exist');
        return;
    }
    //console.log(absConfigFile, absNetworkFile);
    net = require(absConfigFile);
    //console.log(config);
    config = require(absNetworkFile);

    console.log("=============================My Tps Calculation starts==========================");
    console.log("In the function, sending txs doesn't wait for replies, and only txs that are mined in the block are counted as validated ones");
    let url = config.parity.network.rpc.url;
    if(!web3) {
        web3 = new Web3(url);
    }

    fs.readFile('./startBlockNumber.txt', 'utf8', async function(err, data) {
        if(!err){
            
            var txs = 0;
            var txArray = net.test.rounds;
            var totalTxNum = 0;
            for(var i=0; i<txArray.length;i++){
                totalTxNum += txArray[i].txNumber[0];
            }
            var sleep = require('system-sleep');
            var curBlockNumber = parseInt(data);
            var block = await getBlockAsync(curBlockNumber);
            while(block.transactions.length == 0){
                curBlockNumber++;
                block = await getBlockAsync(curBlockNumber);
            }
            var startTime = block.timestamp;
            var preTimestamp = startTime;

            //timeout
            var timeout = Date.now();
            //calculate tps from the second block
            var leaveOutTx = block.transactions.length;
            while(true) {
                try{
                    block = await getBlockAsync(curBlockNumber);
                    if(txs >= totalTxNum || (Date.now() - timeout) > 10000){
                        console.log("All transactions are mined, calculating function exits");
                        break;
                    }
                    if(!block){
                        sleep(1000);
                    }
                    else{
                        var count = block.transactions.length;
                        var curTimestamp = block.timestamp;
                        console.log("There are ",count + " transactions mined in #",curBlockNumber, " block whose timestamp is ",curTimestamp);
                        txs += count;
                        console.log("Total number of txs are ", txs);
                        curBlockNumber++;
                        //console.log(curTimestamp - startTime);
                        if(curTimestamp > startTime){
                            console.log("----------------global Tps = ",(txs-leaveOutTx) / (curTimestamp-startTime)," ---------------------");
                            console.log("----------------Tps between adjcent blocks = ",count / (curTimestamp - preTimestamp),"-------------------");
                            //console.log((txs-leaveOutTx) / (curTimestamp-startTime));
                            //console.log(count / (curTimestamp - preTimestamp));
                            preTimestamp = curTimestamp;
                            timeout = Date.now();
                            //sleep(1000);
                        }
                        else {
                            //console.log(count,txs);
                        }
                    }                   
                }
                catch(err) {
                        console.log("Error in while loop, " ,err);
                }
            }
        }
        else {
            console.log(err);
        }
    });
    //var sleep = require('system-sleep');
    //sleep(5000);
}

//cal.calculate();