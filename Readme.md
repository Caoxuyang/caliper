# Caliper Document 

This benchmark tools is an extended version of [Hyperledger/Caliper](https://github.com/hyperledger/caliper) project. The goal is to provide benchmark tests for blockchain platforms that can be interacted with RPC requests, like Ethereum or our Westlake projects.

### Dependence

Make sure the following tools are installed

* NodeJS 8.X

* node-gyp

* Web3.js  (npm install web3.js)

  If windows users have problem installing web3.js, this [link](https://github.com/nodejs/node-gyp/issues/629#issuecomment-153196245) may help.

### Benchmark Workflow

Currently, my project only support sending "sendTransaction" or "sendSignTransaction" requests to the target blockchain network. 

You can define all the parameters you need in the config.json file, such as number of clients, sending rate, number of txs to be sent, number of socket connections (for port reuse) and so on.

Here is the workflow:

* Start a pre-defined number of clients, one client is one process.

* Each client will invoke a js file and do run() function within that file for a number of times. For example, If I set the config file like this:

  > "test": {
  >
  > ​        "name": "westlake remote rpc test",
  >
  > ​        "description" : "Benchmark for westlake chain scenario",
  >
  > ​        "clients": {
  >
  > ​          "type": "local",
  >
  > ​          "number": 20
  >
  > ​        },
  >
  > ​    "rounds": [{
  >
  > ​          "label" : "sendRawTx",
  >
  > ​          "txNumber" : [300000],
  >
  > ​          "arguments": {"txsPerClient" : 15000, "maxSocketsPerClient":200},
  >
  > ​          "rateControl" : [{"type": "fixed-rate", "opts": {"tps" : 8000}}],
  >
  > ​          "callback" : "benchmark/parity_test/sendRawTx.js"
  >
  > ​        }]
  >
  > ​      }

The test will be

* First start 20 local processes.
* Set the callback file to sendRawTx.js
* Each of the client will invoke 15000 times run() function in callback file.
* And the total txs sent will be 300000, the overall sending rate will be 8000 tps.
* Max number of alive sockets per client will be 200.

After the test, a detailed report will be generated.



### Config File Tutorial

There are two config files that you need to modify.

* network config file
* benchmark config file

In the part above I showed how to set the benchmark config file and there are two demo files in the /benchmark/parity_test folder.

As for the **network file**, it's very simple for now. Just two parameters to be filled

- RPC target address --- < url : port >. e.g. http://1.2.3.4:8540
- Target chain id (This is for parity and ethereum only for now, this will reduce half of the web requests. Requests won't need to query net_version anymore.)

After setting the config files, just simply run ---   node main.js -c <your benchmark config file> -n <your network config file>

### About TPS Calculation

In the report of the benchmark tool, there will be a column named throughput.

However it's not the accurate TPS result. 
Since we need to send very large number of txs to test the network. So I tried my best to reduce the total number of http requests. I only send signed transactions to the server and get the hash but I don't keep querying for the receipt which will bring heavy load to network. 



But I provided a more accurate way to get the TPS result.

After all the txs are mined, simply run ---  node main_calTps.js -c <your benchmark config file> -n <your network config file>.  This function will get the txs that are successfully mined from the very beginning block of your test to the last block and calculate the TPS based on timestamp.











### 

