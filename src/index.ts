import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Import services instead of routers
import {
  generateRegistrationOptionsForUser,
  verifyRegistration,
  generateAuthenticationOptionsForUser,
  verifyAuthentication,
  getUser
} from './auth/authService';

import {
  createAccountForUser,
  getAccountForUser,
  isValidAccount,
  getAccountBalance,
  transferFromAccount,
  executeTransaction
} from './contracts/contractService';

import {
  getXmtpClient,
  listConversations,
  startConversation,
  sendMessage,
  listMessages
} from './messaging/messagingService';

// Auth Routes
app.post('/api/auth/register-options', async function(req: Request, res: Response) {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const options = await generateRegistrationOptionsForUser(username);
    return res.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

app.post('/api/auth/verify-registration', async function(req: Request, res: Response) {
  try {
    const { username, response } = req.body;
    
    if (!username || !response) {
      return res.status(400).json({ error: 'Username and response are required' });
    }
    
    const verified = await verifyRegistration(username, response);
    
    if (verified) {
      return res.json({ verified, message: 'Registration successful' });
    } else {
      return res.status(400).json({ verified, error: 'Registration verification failed' });
    }
  } catch (error) {
    console.error('Error verifying registration:', error);
    return res.status(500).json({ error: 'Failed to verify registration' });
  }
});

app.post('/api/auth/auth-options', async function(req: Request, res: Response) {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const options = await generateAuthenticationOptionsForUser(username);
    return res.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return res.status(500).json({ error: 'Failed to generate authentication options' });
  }
});

app.post('/api/auth/verify-authentication', async function(req: Request, res: Response) {
  try {
    const { username, response } = req.body;
    
    if (!username || !response) {
      return res.status(400).json({ error: 'Username and response are required' });
    }
    
    const verified = await verifyAuthentication(username, response);
    
    if (verified) {
      const user = getUser(username);
      return res.json({ 
        verified, 
        message: 'Authentication successful',
        user: {
          id: user?.id,
          username: user?.username,
          ethAddress: user?.ethAddress
        }
      });
    } else {
      return res.status(400).json({ verified, error: 'Authentication verification failed' });
    }
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

app.get('/api/auth/user/:username', function(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const user = getUser(username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      id: user.id,
      username: user.username,
      ethAddress: user.ethAddress,
      hasCredentials: user.registeredCredentials.length > 0
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Contract Routes
app.post('/api/contracts/create-account', async function(req: Request, res: Response) {
  try {
    const { ownerAddress } = req.body;
    
    if (!ownerAddress) {
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

app.get('/api/contracts/account/:ownerAddress', async function(req: Request, res: Response) {
  try {
    const { ownerAddress } = req.params;
    
    const accountAddress = await getAccountForUser(ownerAddress);
    
    if (!accountAddress) {
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

app.get('/api/contracts/validate/:accountAddress', async function(req: Request, res: Response) {
  try {
    const { accountAddress } = req.params;
    
    const isValid = await isValidAccount(accountAddress);
    
    return res.json({ isValid });
  } catch (error) {
    console.error('Error validating account:', error);
    return res.status(500).json({ error: 'Failed to validate account' });
  }
});

app.get('/api/contracts/balance/:accountAddress', async function(req: Request, res: Response) {
  try {
    const { accountAddress } = req.params;
    
    const balance = await getAccountBalance(accountAddress);
    
    return res.json({ accountAddress, balance });
  } catch (error) {
    console.error('Error getting balance:', error);
    return res.status(500).json({ error: 'Failed to get balance' });
  }
});

app.post('/api/contracts/transfer', async function(req: Request, res: Response) {
  try {
    const { accountAddress, toAddress, amount } = req.body;
    
    if (!accountAddress || !toAddress) {
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

app.post('/api/contracts/execute', async function(req: Request, res: Response) {
  try {
    const { accountAddress, toAddress, value, data } = req.body;
    
    if (!accountAddress || !toAddress) {
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

// Messaging Routes
app.post('/api/messaging/init', async function(req: Request, res: Response) {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    // Create XMTP client
    const client = await getXmtpClient(privateKey);
    
    return res.json({
      success: true,
      address: client.address
    });
  } catch (error) {
    console.error('Error initializing XMTP client:', error);
    return res.status(500).json({ error: 'Failed to initialize XMTP client' });
  }
});

app.post('/api/messaging/conversations', async function(req: Request, res: Response) {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    // Get XMTP client
    const client = await getXmtpClient(privateKey);
    
    // List conversations
    const conversations = await listConversations(client);
    
    return res.json({ conversations });
  } catch (error) {
    console.error('Error listing conversations:', error);
    return res.status(500).json({ error: 'Failed to list conversations' });
  }
});

app.post('/api/messaging/conversation/new', async function(req: Request, res: Response) {
  try {
    const { privateKey, peerAddress } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    if (!peerAddress) {
      return res.status(400).json({ error: 'Valid peer address is required' });
    }
    
    // Get XMTP client
    const client = await getXmtpClient(privateKey);
    
    // Start conversation
    const conversation = await startConversation(client, peerAddress);
    
    return res.json({ conversation });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return res.status(500).json({ error: 'Failed to start conversation' });
  }
});

app.post('/api/messaging/message/send', async function(req: Request, res: Response) {
  try {
    const { privateKey, peerAddress, content } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    if (!peerAddress) {
      return res.status(400).json({ error: 'Valid peer address is required' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Get XMTP client
    const client = await getXmtpClient(privateKey);
    
    // Send message
    const message = await sendMessage(client, peerAddress, content);
    
    return res.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

app.post('/api/messaging/messages', async function(req: Request, res: Response) {
  try {
    const { privateKey, peerAddress } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    if (!peerAddress) {
      return res.status(400).json({ error: 'Valid peer address is required' });
    }
    
    // Get XMTP client
    const client = await getXmtpClient(privateKey);
    
    // List messages
    const messages = await listMessages(client, peerAddress);
    
    return res.json({ messages });
  } catch (error) {
    console.error('Error listing messages:', error);
    return res.status(500).json({ error: 'Failed to list messages' });
  }
});

// Serve the main HTML file for any other routes
app.get('*', function(req: Request, res: Response) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
