import express from 'express';
import {
  createAccountForUser,
  getAccountForUser,
  isValidAccount,
  getAccountBalance,
  transferFromAccount,
  executeTransaction
} from './contractService';
import { ethers } from 'ethers';
import { Request, Response } from 'express';

const router = express.Router();

export default router;

// Create a new account for a user
router.post('/create-account', async (req: Request, res: Response) => {
  try {
    const { ownerAddress } = req.body;
    
    if (!ownerAddress || !ethers.utils.isAddress(ownerAddress)) {
      return res.status(400).json({ error: 'Valid owner address is required' });
    }
    
    const accountAddress = await createAccountForUser(ownerAddress);
    
    return res.json({
      success: true,
      accountAddress
    });
  } catch (error) {
    console.error('Error creating account:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
});

// Get the account for a user
router.get('/account/:ownerAddress', async (req: Request, res: Response) => {
  try {
    const { ownerAddress } = req.params;
    
    if (!ethers.utils.isAddress(ownerAddress)) {
      return res.status(400).json({ error: 'Valid owner address is required' });
    }
    
    const accountAddress = await getAccountForUser(ownerAddress);
    
    if (accountAddress === ethers.constants.AddressZero) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const balance = await getAccountBalance(accountAddress);
    
    return res.json({
      ownerAddress,
      accountAddress,
      balance
    });
  } catch (error) {
    console.error('Error getting account:', error);
    return res.status(500).json({ error: 'Failed to get account' });
  }
});

// Check if an account is valid
router.get('/validate/:accountAddress', async (req, res) => {
  try {
    const { accountAddress } = req.params;
    
    if (!ethers.utils.isAddress(accountAddress)) {
      return res.status(400).json({ error: 'Valid account address is required' });
    }
    
    const isValid = await isValidAccount(accountAddress);
    
    return res.json({ isValid });
  } catch (error) {
    console.error('Error validating account:', error);
    return res.status(500).json({ error: 'Failed to validate account' });
  }
});

// Get the balance of an account
router.get('/balance/:accountAddress', async (req: Request, res: Response) => {
  try {
    const { accountAddress } = req.params;
    
    if (!ethers.utils.isAddress(accountAddress)) {
      return res.status(400).json({ error: 'Valid account address is required' });
    }
    
    const balance = await getAccountBalance(accountAddress);
    
    return res.json({ accountAddress, balance });
  } catch (error) {
    console.error('Error getting balance:', error);
    return res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Transfer ETH from an account
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const { accountAddress, toAddress, amount } = req.body;
    
    if (!ethers.utils.isAddress(accountAddress) || !ethers.utils.isAddress(toAddress)) {
      return res.status(400).json({ error: 'Valid addresses are required' });
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    const receipt = await transferFromAccount(accountAddress, toAddress, amount);
    
    return res.json({
      success: true,
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('Error transferring ETH:', error);
    return res.status(500).json({ error: 'Failed to transfer ETH' });
  }
});

// Execute a transaction from an account
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { accountAddress, toAddress, value, data } = req.body;
    
    if (!ethers.utils.isAddress(accountAddress) || !ethers.utils.isAddress(toAddress)) {
      return res.status(400).json({ error: 'Valid addresses are required' });
    }
    
    if (!value || isNaN(parseFloat(value)) || parseFloat(value) < 0) {
      return res.status(400).json({ error: 'Valid value is required' });
    }
    
    const receipt = await executeTransaction(accountAddress, toAddress, value, data || '0x');
    
    return res.json({
      success: true,
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('Error executing transaction:', error);
    return res.status(500).json({ error: 'Failed to execute transaction' });
  }
});

export { router as contractRouter };
