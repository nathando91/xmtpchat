import express from 'express';
import { ethers } from 'ethers';
import {
  getXmtpClient,
  listConversations,
  startConversation,
  sendMessage,
  listMessages
} from './messagingService';

const router = express.Router();

// Initialize XMTP client
router.post('/init', async (req, res) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    // Validate private key
    try {
      new ethers.Wallet(privateKey);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid private key' });
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

// List conversations
router.post('/conversations', async (req, res) => {
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

// Start a new conversation
router.post('/conversation/new', async (req, res) => {
  try {
    const { privateKey, peerAddress } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    if (!peerAddress || !ethers.utils.isAddress(peerAddress)) {
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

// Send a message
router.post('/message/send', async (req, res) => {
  try {
    const { privateKey, peerAddress, content } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    if (!peerAddress || !ethers.utils.isAddress(peerAddress)) {
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

// List messages in a conversation
router.post('/messages', async (req, res) => {
  try {
    const { privateKey, peerAddress } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required' });
    }
    
    if (!peerAddress || !ethers.utils.isAddress(peerAddress)) {
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

export { router as messagingRouter };
