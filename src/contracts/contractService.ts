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

// For demo purposes, we'll use mock implementations
// In a real app, you would use a proper provider and signer
const isMockMode = !process.env.ETHEREUM_RPC_URL || 
  !process.env.ETHEREUM_RPC_URL.length || 
  process.env.ETHEREUM_RPC_URL.includes('YOUR_INFURA_KEY');

// Define provider and signer with proper TypeScript types
let provider: ethers.providers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;

// Only initialize provider and signer if we're not in mock mode
if (!isMockMode && process.env.ETHEREUM_RPC_URL) {
  try {
    provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    if (process.env.PRIVATE_KEY) {
      signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    }
  } catch (error) {
    console.error('Error initializing Ethereum provider:', error);
  }
}

const accountFactoryAddress = process.env.ACCOUNT_FACTORY_ADDRESS || '';

// Create contract instances
const getAccountFactoryContract = () => {
  if (isMockMode) {
    // Return a mock contract for demo purposes
    return {
      getAccount: async () => ethers.constants.AddressZero,
      createAccount: async () => ({ wait: async () => ({ events: [{ event: 'AccountCreated', args: { account: generateMockAddress() } }] }) }),
      isValidAccount: async () => true
    };
  }
  
  if (!signer) {
    throw new Error('Private key not configured');
  }
  
  if (!accountFactoryAddress) {
    throw new Error('Account factory address not configured');
  }
  
  return new ethers.Contract(accountFactoryAddress, accountFactoryABI, signer);
};

/**
 * Generate a mock Ethereum address for testing purposes
 * @returns A random Ethereum address string
 */
const generateMockAddress = (): string => {
  return '0x' + Array.from({length: 40}, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

const getAbstractAccountContract = (accountAddress: string) => {
  if (isMockMode) {
    // Return a mock contract for demo purposes
    return {
      executeTransaction: async () => ({ wait: async () => ({ status: 1 }) }),
      transfer: async () => ({ wait: async () => ({ status: 1 }) }),
      getBalance: async () => ethers.utils.parseEther('1.5'),
      owner: async () => generateMockAddress()
    };
  }
  
  if (!signer) {
    throw new Error('Private key not configured');
  }
  
  return new ethers.Contract(accountAddress, abstractAccountABI, signer);
};

// Cache for storing created accounts to prevent duplicate requests
const accountCache: Record<string, string> = {};

/**
 * Create a new smart contract account for a user
 * @param ownerAddress The Ethereum address of the account owner
 * @returns The address of the created smart contract account
 */
export const createAccountForUser = async (ownerAddress: string): Promise<string> => {
  try {
    // Check if we already have this account in our cache
    if (accountCache[ownerAddress]) {
      console.log(`Using cached account for ${ownerAddress}: ${accountCache[ownerAddress]}`);
      return accountCache[ownerAddress];
    }
    
    const accountFactory = getAccountFactoryContract();
    
    // Check if user already has an account
    const existingAccount = await accountFactory.getAccount(ownerAddress);
    
    if (existingAccount && existingAccount !== ethers.constants.AddressZero) {
      // Store in cache and return
      accountCache[ownerAddress] = existingAccount;
      return existingAccount;
    }
    
    // Create a new account
    const tx = await accountFactory.createAccount(ownerAddress);
    const receipt = await tx.wait();
    
    // Find the AccountCreated event
    const event = receipt.events?.find((e: any) => e.event === 'AccountCreated');
    
    if (!event || !event.args) {
      throw new Error('Account creation failed');
    }
    
    const accountAddress = event.args.account;
    
    // Store in cache and return
    accountCache[ownerAddress] = accountAddress;
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
