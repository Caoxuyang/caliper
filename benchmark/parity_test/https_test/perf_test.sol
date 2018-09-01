pragma solidity ^0.4.0;

contract Token {
    mapping (address => uint) public balances;
    function transfer(address _to, uint256 _amount) public returns (uint256){
        if (balances[msg.sender] < _amount) {
            balances[msg.sender] += 50000;
        }

        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        return balances[msg.sender];
    }

    function getBalance(address _address) public view returns (uint256){
        return balances[_address]; 
    }
}