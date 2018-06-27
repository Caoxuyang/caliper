### Dependency
1. Parity
2. Web3.js
windows安装web3.js报错，npm设置教程：https://github.com/nodejs/node-gyp/issues/629#issuecomment-153196245

debug log:
1. Done
 Error: Client encountered error:[object Object] at ChildProcess.<anonymous> (D:\github\caliper\src\comm\client\client-util.js:73:36) at emitTwo (events.js:126:13) at ChildProcess.emit (events.js:214:7) at emit (internal/child_process.js:772:12) at _combinedTickCallback (internal/process/next_tick.js:141:11) at process._tickCallback (internal/process/next_tick.js:180:9)
  ---
    operator: fail
    at: client.startTest.then.then.catch (D:\github\caliper\src\comm\bench-flow.js:255:23)
    stack: |-
      Error: failed 'sendTx' testing, Error: Client encountered error:[object Object]
          at ChildProcess.<anonymous> (D:\github\caliper\src\comm\client\client-util.js:73:36)
          at emitTwo (events.js:126:13)
          at ChildProcess.emit (events.js:214:7)
          at emit (internal/child_process.js:772:12)
          at _combinedTickCallback (internal/process/next_tick.js:141:11)
          at process._tickCallback (internal/process/next_tick.js:180:9)
          at Test.assert [as _assert] (D:\github\caliper\node_modules\tape\lib\test.js:224:54)
          at Test.bound [as _assert] (D:\github\caliper\node_modules\tape\lib\test.js:76:32)
          at Test.fail (D:\github\caliper\node_modules\tape\lib\test.js:317:10)
          at Test.bound [as fail] (D:\github\caliper\node_modules\tape\lib\test.js:76:32)
          at client.startTest.then.then.catch (D:\github\caliper\src\comm\bench-flow.js:255:23)
          at <anonymous>
          at process._tickCallback (internal/process/next_tick.js:188:7)
  ...


MESSAGE: 
{ type: 'test',
  label: 'sendTx',
  rateControl: { type: 'fixed-rate', opts: { tps: 10 } },
  trim: 0,
  args:
   { amount: 100000000000000000000,
     from: '0x00d695cD9B0fF4edc8CE55b493AEC495B597e235',
     to: '0x00CB25f6fD16a52e24eDd2c8fd62071dc29A035c' },
  cb: 'benchmark/parity_test/sendTx.js',
  config: 'benchmark\\parity_test\\parity.json',
  numb: 10,
  totalClients: 1,
  clients: 1,
  clientargs: 'test',
  clientIdx: 0 }

Solution: edit the spec file according to this website: https://github.com/paritytech/parity/issues/8754


2. TODO

The tps is always around 10, I'm still trying to find why. (Manager thinks the problem is in the code)
