// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AbstractAccount.sol";

/**
 * @title AccountFactory
 * @dev Factory contract to create new AbstractAccount instances
 */
contract AccountFactory {
    mapping(address => address) public accountsByOwner;
    mapping(address => bool) public isAccount;
    
    event AccountCreated(address indexed owner, address indexed account);
    
    /**
     * @dev Create a new AbstractAccount for a user
     * @param owner The address that will own the new account
     * @return The address of the new account
     */
    function createAccount(address owner) external returns (address) {
        require(owner != address(0), "Invalid owner address");
        require(accountsByOwner[owner] == address(0), "Owner already has an account");
        
        AbstractAccount account = new AbstractAccount(address(this));
        account.initialize(owner);
        
        address accountAddress = address(account);
        accountsByOwner[owner] = accountAddress;
        isAccount[accountAddress] = true;
        
        emit AccountCreated(owner, accountAddress);
        
        return accountAddress;
    }
    
    /**
     * @dev Get the account address for a specific owner
     * @param owner The owner address
     * @return The account address or address(0) if not found
     */
    function getAccount(address owner) external view returns (address) {
        return accountsByOwner[owner];
    }
    
    /**
     * @dev Check if an address is a valid account created by this factory
     * @param account The account address to check
     * @return True if it's a valid account, false otherwise
     */
    function isValidAccount(address account) external view returns (bool) {
        return isAccount[account];
    }
}
