// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AbstractAccount
 * @dev A simple smart contract account that can be controlled by an owner
 */
contract AbstractAccount {
    address public owner;
    address public factory;
    
    event TransactionExecuted(address to, uint256 value, bytes data);
    event EtherReceived(address from, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this function");
        _;
    }
    
    constructor(address _factory) {
        factory = _factory;
    }
    
    function initialize(address _owner) external onlyFactory {
        require(owner == address(0), "Already initialized");
        owner = _owner;
    }
    
    /**
     * @dev Execute a transaction from this account
     * @param to Destination address
     * @param value Amount of ETH to send
     * @param data Call data for the transaction
     */
    function executeTransaction(address to, uint256 value, bytes calldata data) 
        external 
        onlyOwner 
        returns (bytes memory) 
    {
        (bool success, bytes memory result) = to.call{value: value}(data);
        require(success, "Transaction execution failed");
        
        emit TransactionExecuted(to, value, data);
        return result;
    }
    
    /**
     * @dev Transfer ETH from this account to another address
     * @param to Destination address
     * @param amount Amount of ETH to send
     */
    function transfer(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        
        emit TransactionExecuted(to, amount, "");
    }
    
    /**
     * @dev Get the balance of this account
     * @return The ETH balance of this account
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }
}
