import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

// Load environment variables
dotenv.config();

const API_BASE_URL = `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}/api`;

// Generate a random username
const generateRandomUsername = () => {
  return `user_${Math.floor(Math.random() * 10000)}`;
};

// Generate a random Ethereum address
const generateRandomAddress = () => {
  return ethers.Wallet.createRandom().address;
};

// Test authentication endpoints
const testAuthEndpoints = async () => {
  console.log('\n--- Testing Authentication Endpoints ---');
  
  try {
    const username = generateRandomUsername();
    console.log(`Using test username: ${username}`);
    
    // Test register options
    console.log('\nTesting /api/auth/register-options');
    const registerOptionsResponse = await axios.post(`${API_BASE_URL}/auth/register-options`, { username });
    console.log('Register options response:', registerOptionsResponse.status);
    
    // Note: We can't fully test registration and authentication without browser WebAuthn APIs
    console.log('\nNote: Full WebAuthn testing requires browser interaction');
    
    // Test user info
    console.log('\nTesting /api/auth/user/:username');
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/auth/user/${username}`);
      console.log('User info response:', userResponse.status);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 404) {
        console.log('User not found (expected for new username)');
      } else {
        throw error;
      }
    }
    
    console.log('\nAuthentication endpoints test completed');
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error testing authentication endpoints:', axiosError.message);
    if (axiosError.response) {
      console.error('Response data:', axiosError.response.data);
    }
  }
};

// Test contract endpoints
const testContractEndpoints = async () => {
  console.log('\n--- Testing Contract Endpoints ---');
  
  try {
    const ownerAddress = generateRandomAddress();
    console.log(`Using test owner address: ${ownerAddress}`);
    
    // Test create account
    console.log('\nTesting /api/contracts/create-account');
    try {
      const createAccountResponse = await axios.post(`${API_BASE_URL}/contracts/create-account`, { ownerAddress });
      console.log('Create account response:', createAccountResponse.status);
      console.log('Account address:', createAccountResponse.data.accountAddress);
      
      // Test get account
      console.log('\nTesting /api/contracts/account/:ownerAddress');
      const accountResponse = await axios.get(`${API_BASE_URL}/contracts/account/${ownerAddress}`);
      console.log('Get account response:', accountResponse.status);
      console.log('Account info:', accountResponse.data);
      
      // Test validate account
      console.log('\nTesting /api/contracts/validate/:accountAddress');
      const validateResponse = await axios.get(`${API_BASE_URL}/contracts/validate/${createAccountResponse.data.accountAddress}`);
      console.log('Validate account response:', validateResponse.status);
      console.log('Validation result:', validateResponse.data);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.status === 500 && (axiosError.response.data as any).error && (axiosError.response.data as any).error.includes('Account factory address not configured')) {
        console.log('Contract not deployed yet (expected in test environment)');
      } else {
        throw error;
      }
    }
    
    console.log('\nContract endpoints test completed');
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error testing contract endpoints:', axiosError.message);
    if (axiosError.response) {
      console.error('Response data:', axiosError.response.data);
    }
  }
};

// Test messaging endpoints
const testMessagingEndpoints = async () => {
  console.log('\n--- Testing Messaging Endpoints ---');
  
  try {
    // Generate a random private key
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
    const address = wallet.address;
    
    console.log(`Using test wallet address: ${address}`);
    
    // Test initialize XMTP
    console.log('\nTesting /api/messaging/init');
    try {
      const initResponse = await axios.post(`${API_BASE_URL}/messaging/init`, { privateKey });
      console.log('Init XMTP response:', initResponse.status);
      console.log('XMTP address:', initResponse.data.address);
      
      // Test list conversations
      console.log('\nTesting /api/messaging/conversations');
      const conversationsResponse = await axios.post(`${API_BASE_URL}/messaging/conversations`, { privateKey });
      console.log('List conversations response:', conversationsResponse.status);
      console.log('Conversations count:', conversationsResponse.data.conversations.length);
      
      // Test start conversation
      console.log('\nTesting /api/messaging/conversation/new');
      const peerAddress = generateRandomAddress();
      try {
        const newConversationResponse = await axios.post(`${API_BASE_URL}/messaging/conversation/new`, { 
          privateKey, 
          peerAddress 
        });
        console.log('New conversation response:', newConversationResponse.status);
        console.log('Conversation info:', newConversationResponse.data.conversation);
        
        // Test send message
        console.log('\nTesting /api/messaging/message/send');
        const sendMessageResponse = await axios.post(`${API_BASE_URL}/messaging/message/send`, {
          privateKey,
          peerAddress,
          content: 'Hello, this is a test message!'
        });
        console.log('Send message response:', sendMessageResponse.status);
        console.log('Message info:', sendMessageResponse.data.message);
        
        // Test list messages
        console.log('\nTesting /api/messaging/messages');
        const messagesResponse = await axios.post(`${API_BASE_URL}/messaging/messages`, {
          privateKey,
          peerAddress
        });
        console.log('List messages response:', messagesResponse.status);
        console.log('Messages count:', messagesResponse.data.messages.length);
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response && axiosError.response.data && (axiosError.response.data as any).error && (axiosError.response.data as any).error.includes('Peer cannot be messaged')) {
          console.log('Peer cannot be messaged (expected in test environment)');
        } else {
          throw error;
        }
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response && axiosError.response.data && (axiosError.response.data as any).error && (axiosError.response.data as any).error.includes('Failed to initialize XMTP client')) {
        console.log('XMTP client initialization failed (expected in test environment without proper keys)');
      } else {
        throw error;
      }
    }
    
    console.log('\nMessaging endpoints test completed');
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error testing messaging endpoints:', axiosError.message);
    if (axiosError.response) {
      console.error('Response data:', axiosError.response.data);
    }
  }
};

// Run all tests
const runTests = async () => {
  console.log('=== Starting API Tests ===');
  
  try {
    await testAuthEndpoints();
    await testContractEndpoints();
    await testMessagingEndpoints();
    
    console.log('\n=== All API Tests Completed ===');
  } catch (error) {
    console.error('Test execution failed:', error instanceof Error ? error.message : String(error));
  }
};

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
