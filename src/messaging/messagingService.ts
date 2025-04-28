import { Client } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';

// Cache for XMTP clients
const clientCache: Record<string, Client> = {};

// Create or get an XMTP client for a user
export const getXmtpClient = async (privateKey: string): Promise<Client> => {
  try {
    // Check if client exists in cache
    if (clientCache[privateKey]) {
      return clientCache[privateKey];
    }
    
    // Create a wallet from the private key
    const wallet = new ethers.Wallet(privateKey);
    
    // Create a new XMTP client
    const client = await Client.create(wallet, { env: 'production' });
    
    // Cache the client
    clientCache[privateKey] = client;
    
    return client;
  } catch (error) {
    console.error('Error creating XMTP client:', error);
    throw error;
  }
};

// List all conversations for a user
export const listConversations = async (client: Client) => {
  try {
    const conversations = await client.conversations.list();
    
    // Format conversations for response
    return conversations.map(conversation => ({
      peerAddress: conversation.peerAddress,
      createdAt: conversation.createdAt,
      context: conversation.context,
    }));
  } catch (error) {
    console.error('Error listing conversations:', error);
    throw error;
  }
};

// Start a new conversation with a peer
export const startConversation = async (client: Client, peerAddress: string) => {
  try {
    if (!ethers.utils.isAddress(peerAddress)) {
      throw new Error('Invalid peer address');
    }
    
    // Check if the peer can be messaged
    const canMessage = await client.canMessage(peerAddress);
    
    if (!canMessage) {
      // For demo purposes, we'll create a conversation anyway in dev mode
      // In production, you would want to handle this differently
      console.warn(`Peer ${peerAddress} is not on the XMTP network yet. Creating conversation anyway for demo purposes.`);
      
      // We'll try to create the conversation anyway, but it might fail later when sending messages
      try {
        // Use type assertion to handle the option that might not be in the type definitions
        const conversation = await client.conversations.newConversation(
          peerAddress, 
          { ignorePeerAvailability: true } as any
        );
        
        return {
          peerAddress: conversation.peerAddress,
          createdAt: conversation.createdAt,
          context: conversation.context,
          warning: 'Peer is not on XMTP network yet. Messages may not be delivered until they join.'
        };
      } catch (innerError) {
        console.error('Failed to create conversation with unavailable peer:', innerError);
        throw new Error(`Peer ${peerAddress} cannot be messaged. They need to initialize their XMTP client first.`);
      }
    }
    
    // Create a new conversation
    const conversation = await client.conversations.newConversation(peerAddress);
    
    return {
      peerAddress: conversation.peerAddress,
      createdAt: conversation.createdAt,
      context: conversation.context,
    };
  } catch (error) {
    console.error('Error starting conversation:', error);
    throw error;
  }
};

// Send a message to a peer
export const sendMessage = async (
  client: Client,
  peerAddress: string,
  content: string
) => {
  try {
    // Get or create the conversation
    const conversation = await client.conversations.newConversation(peerAddress);
    
    // Send the message
    const message = await conversation.send(content);
    
    return {
      id: message.id,
      senderAddress: message.senderAddress,
      sent: message.sent,
      content: message.content,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// List messages in a conversation
export const listMessages = async (client: Client, peerAddress: string) => {
  try {
    // Get the conversation
    const conversation = await client.conversations.newConversation(peerAddress);
    
    // List messages
    const messages = await conversation.messages();
    
    // Format messages for response
    return messages.map(message => ({
      id: message.id,
      senderAddress: message.senderAddress,
      sent: message.sent,
      content: message.content,
    }));
  } catch (error) {
    console.error('Error listing messages:', error);
    throw error;
  }
};

// Stream new messages
export const streamMessages = async (
  client: Client,
  peerAddress: string,
  callback: (message: any) => void
) => {
  try {
    // Get the conversation
    const conversation = await client.conversations.newConversation(peerAddress);
    
    // Stream new messages
    const stream = await conversation.streamMessages();
    
    // Process new messages
    for await (const message of stream) {
      callback({
        id: message.id,
        senderAddress: message.senderAddress,
        sent: message.sent,
        content: message.content,
      });
    }
  } catch (error) {
    console.error('Error streaming messages:', error);
    throw error;
  }
};
