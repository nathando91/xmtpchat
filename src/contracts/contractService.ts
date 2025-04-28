import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Contract ABIs
const accountFactoryABI = [
  "function createAccount(address owner) external returns (address)",
  "function getAccount(address owner) external view returns (address)",
  "function isValidAccount(address account) external view returns (bool)",
  "event AccountCreated(address indexed owner, address indexed account)"
];

const abstractAccountABI = [
  "function executeTransaction(address to, uint256 value, bytes calldata data) external returns (bytes memory)",
  "function transfer(address payable to, uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function owner() external view returns (address)"
];

// Provider and signer setup
const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const signer = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, provider) : null;
const accountFactoryAddress = process.env.ACCOUNT_FACTORY_ADDRESS || '';

// Create contract instances
const getAccountFactoryContract = () => {
  if (!signer) {
    throw new Error('Private key not configured');
  }
  
  if (!accountFactoryAddress) {
    throw new Error('Account factory address not configured');
  }
  
  return new ethers.Contract(accountFactoryAddress, accountFactoryABI, signer);
};

const getAbstractAccountContract = (accountAddress: string) => {
  if (!signer) {
    throw new Error('Private key not configured');
  }
  
  return new ethers.Contract(accountAddress, abstractAccountABI, signer);
};

// Create a new account for a user
export const createAccountForUser = async (ownerAddress: string): Promise<string> => {
  try {
    const accountFactory = getAccountFactoryContract();
    
    // Check if user already has an account
    const existingAccount = await accountFactory.getAccount(ownerAddress);
    
    if (existingAccount && existingAccount !== ethers.constants.AddressZero) {
      return existingAccount;
    }
    
    // Create a new account
    const tx = await accountFactory.createAccount(ownerAddress);
    const receipt = await tx.wait();
    
    // Find the AccountCreated event
    const event = receipt.events?.find(e => e.event === 'AccountCreated');
    
    if (!event || !event.args) {
      throw new Error('Account creation failed');
    }
    
    const accountAddress = event.args.account;
    return accountAddress;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

// Get the account address for a user
export const getAccountForUser = async (ownerAddress: string): Promise<string> => {
  try {
    const accountFactory = getAccountFactoryContract();
    const accountAddress = await accountFactory.getAccount(ownerAddress);
    
    return accountAddress;
  } catch (error) {
    console.error('Error getting account:', error);
    throw error;
  }
};

// Check if an account is valid
export const isValidAccount = async (accountAddress: string): Promise<boolean> => {
  try {
    const accountFactory = getAccountFactoryContract();
    return await accountFactory.isValidAccount(accountAddress);
  } catch (error) {
    console.error('Error checking account validity:', error);
    return false;
  }
};

// Get the balance of an account
export const getAccountBalance = async (accountAddress: string): Promise<string> => {
  try {
    const account = getAbstractAccountContract(accountAddress);
    const balance = await account.getBalance();
    
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting account balance:', error);
    throw error;
  }
};

// Transfer ETH from an account
export const transferFromAccount = async (
  accountAddress: string,
  toAddress: string,
  amount: string
): Promise<ethers.providers.TransactionReceipt> => {
  try {
    const account = getAbstractAccountContract(accountAddress);
    const tx = await account.transfer(toAddress, ethers.utils.parseEther(amount));
    
    return await tx.wait();
  } catch (error) {
    console.error('Error transferring from account:', error);
    throw error;
  }
};

// Execute a transaction from an account
export const executeTransaction = async (
  accountAddress: string,
  toAddress: string,
  value: string,
  data: string
): Promise<ethers.providers.TransactionReceipt> => {
  try {
    const account = getAbstractAccountContract(accountAddress);
    const tx = await account.executeTransaction(
      toAddress,
      ethers.utils.parseEther(value),
      data
    );
    
    return await tx.wait();
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  }
};
