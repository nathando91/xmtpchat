import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import { createAccountForUser } from './contracts/contractService';
import { getXmtpClient, listConversations, startConversation, sendMessage } from './messaging/messagingService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());

// Basic API route
app.get('/api/test', function(req, res) {
  res.json({ message: 'API is working!' });
});

// Contract routes
app.post('/api/contracts/create-account', async (req: any, res: any) => {
  try {
    const { ownerAddress } = req.body;
    
    if (!ownerAddress) {
      return res.status(400).json({ error: 'Owner address is required' });
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

// Authentication routes
app.post('/api/auth/register-options', (req: any, res: any) => {
  try {
    const { username } = req.body as any;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // In a real app, we would generate actual WebAuthn options here
    const mockOptions = {
      challenge: 'randomChallenge',
      rp: { name: 'Web3 Passkey App', id: 'localhost' },
      user: { id: 'user-' + Math.random().toString(36).substring(2, 9), name: username, displayName: username },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      timeout: 60000,
      attestation: 'direct'
    };
    
    res.json(mockOptions);
  } catch (error) {
    console.error('Error generating registration options:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

app.post('/api/auth/verify-registration', function(req, res) {
  try {
    // In a real app, we would verify the WebAuthn response here
    res.json({ verified: true, username: req.body.username || 'user' });
  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({ error: 'Failed to verify registration' });
  }
});

app.post('/api/auth/auth-options', (req: any, res: any) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // In a real app, we would generate actual WebAuthn options here
    const mockOptions = {
      challenge: 'randomChallenge',
      rpId: 'localhost',
      timeout: 60000,
      userVerification: 'preferred'
    };
    
    res.json(mockOptions);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    res.status(500).json({ error: 'Failed to generate authentication options' });
  }
});

app.post('/api/auth/verify-authentication', (req: any, res: any) => {
  try {
    // In a real app, we would verify the WebAuthn response here
    res.json({ verified: true, username: req.body.username || 'user' });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// Serve the test page
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/test.html'));
});

// Serve the main HTML file for any other routes
// Use a regex pattern to match all routes except those that start with /api or /test
app.get(/^(?!\/api|\/test).*$/, function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// XMTP Messaging routes
app.post('/api/messaging/init', async (req: any, res: any) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    const client = await getXmtpClient(privateKey);
    
    return res.json({
      success: true,
      address: client.address
    });
  } catch (error: any) {
    console.error('Error initializing XMTP client:', error);
    return res.status(500).json({ error: 'Failed to initialize XMTP client: ' + error.message });
  }
});

app.post('/api/messaging/conversations', async (req: any, res: any) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    const client = await getXmtpClient(privateKey);
    const conversations = await listConversations(client);
    
    return res.json({
      success: true,
      conversations
    });
  } catch (error: any) {
    console.error('Error listing conversations:', error);
    return res.status(500).json({ error: 'Failed to list conversations: ' + error.message });
  }
});

app.post('/api/messaging/conversation/new', async (req: any, res: any) => {
  try {
    const { privateKey, peerAddress } = req.body;
    
    if (!privateKey || !peerAddress) {
      return res.status(400).json({ error: 'Private key and peer address are required' });
    }
    
    const client = await getXmtpClient(privateKey);
    const conversation = await startConversation(client, peerAddress);
    
    return res.json({
      success: true,
      conversation
    });
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    return res.status(500).json({ error: 'Failed to start conversation: ' + error.message });
  }
});

app.post('/api/messaging/message/send', async (req: any, res: any) => {
  try {
    const { privateKey, peerAddress, content } = req.body;
    
    if (!privateKey || !peerAddress || !content) {
      return res.status(400).json({ error: 'Private key, peer address, and content are required' });
    }
    
    const client = await getXmtpClient(privateKey);
    const message = await sendMessage(client, peerAddress, content);
    
    return res.json({
      success: true,
      message
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message: ' + error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
