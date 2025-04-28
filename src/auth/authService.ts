import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse
} from '@simplewebauthn/server';
import { 
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture
} from '@simplewebauthn/types';
import crypto from 'crypto';
import { User, RegisteredCredential } from './authTypes';

// In-memory user database (replace with a real database in production)
const users: Record<string, User> = {};

// Environment variables
const rpID = process.env.RP_ID || 'localhost';
const rpName = process.env.RP_NAME || 'Web3 Passkey App';
const rpOrigin = process.env.RP_ORIGIN || 'http://localhost:3000';

// Generate a random user ID
const generateUserId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate registration options for a new user
 * @param username The username to register
 * @returns Registration options for the WebAuthn client
 */
export const generateRegistrationOptionsForUser = async (username: string) => {
  // Check if user exists
  if (!users[username]) {
    // Create a new user
    const userId = generateUserId();
    users[username] = {
      id: userId,
      username,
      registeredCredentials: [],
    };
  }

  const user = users[username];
  
  // Generate a random challenge
  const challengeBuffer = crypto.randomBytes(32);
  const challenge = challengeBuffer.toString('base64');
  user.currentChallenge = challenge;

  // Generate registration options
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: username,
    attestationType: 'none',
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'required',
    },
    challenge: challengeBuffer as unknown as string,
  });

  return options;
};

/**
 * Verify registration response from WebAuthn client
 * @param username The username being registered
 * @param response The registration response from the client
 * @returns Whether the registration was successful
 */
export const verifyRegistration = async (
  username: string,
  response: RegistrationResponseJSON
): Promise<boolean> => {
  const user = users[username];
  
  if (!user || !user.currentChallenge) {
    throw new Error('User not found or challenge not set');
  }

  let verification: VerifiedRegistrationResponse;
  try {
    // Verify the registration response
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error('Error verifying registration:', error);
    return false;
  }

  const { verified, registrationInfo } = verification;
  
  if (verified && registrationInfo) {
    // Add the new credential to the user
    const newCredential: RegisteredCredential = {
      id: response.id,
      // Access the credential public key and counter based on the library version
      publicKey: Buffer.from(registrationInfo.credentialPublicKey || 
                (registrationInfo as any).credential?.publicKey || 
                new Uint8Array()).toString('base64'),
      counter: registrationInfo.counter || (registrationInfo as any).credential?.counter || 0,
    };
    
    user.registeredCredentials.push(newCredential);
    user.currentChallenge = undefined;
    
    return true;
  }
  
  return false;
};

/**
 * Generate authentication options for a user
 * @param username The username to authenticate
 * @returns Authentication options for the WebAuthn client
 */
export const generateAuthenticationOptionsForUser = async (username: string) => {
  const user = users[username];
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate a random challenge
  const challengeBuffer = crypto.randomBytes(32);
  const challenge = challengeBuffer.toString('base64');
  user.currentChallenge = challenge;
  
  // Get the credential IDs for this user
  const allowCredentials = user.registeredCredentials.map(credential => ({
    id: credential.id,
    type: 'public-key' as const,
    transports: ['internal'] as AuthenticatorTransportFuture[],
  }));
  
  // Generate authentication options
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials,
    challenge: challengeBuffer as unknown as string,
  });
  
  return options;
};

/**
 * Verify authentication response from WebAuthn client
 * @param username The username being authenticated
 * @param response The authentication response from the client
 * @returns Whether the authentication was successful
 */
export const verifyAuthentication = async (
  username: string,
  response: AuthenticationResponseJSON
): Promise<boolean> => {
  const user = users[username];
  
  if (!user || !user.currentChallenge) {
    throw new Error('User not found or challenge not set');
  }
  
  // Find the credential in the user's registered credentials
  const credential = user.registeredCredentials.find(
    cred => cred.id === response.id
  );
  
  if (!credential) {
    throw new Error('Credential not found');
  }
  
  let verification: VerifiedAuthenticationResponse;
  try {
    // Verify the authentication response
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
      // Use type assertion to handle different versions of the library
      ...({
        authenticator: {
          credentialID: Buffer.from(credential.id, 'base64'),
          credentialPublicKey: Buffer.from(credential.publicKey, 'base64'),
          counter: credential.counter,
        }
      } as any),
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return false;
  }
  
  const { verified, authenticationInfo } = verification;
  
  if (verified && authenticationInfo) {
    // Update the credential counter
    credential.counter = authenticationInfo.newCounter;
    user.currentChallenge = undefined;
    
    return true;
  }
  
  return false;
};

/**
 * Get a user by username
 * @param username The username to look up
 * @returns The user object or undefined if not found
 */
export const getUser = (username: string): User | undefined => {
  return users[username];
};

/**
 * Set the Ethereum address for a user
 * @param username The username to update
 * @param ethAddress The Ethereum address to set
 * @returns Whether the update was successful
 */
export const setUserEthAddress = (username: string, ethAddress: string): boolean => {
  const user = users[username];
  
  if (!user) {
    return false;
  }

  user.ethAddress = ethAddress;
  return true;
};
