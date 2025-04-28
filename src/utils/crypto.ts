import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Generate a random Ethereum private key
 * @returns A random Ethereum private key
 */
export const generateRandomPrivateKey = (): string => {
  // Generate 32 random bytes (256 bits)
  const randomBytes = crypto.randomBytes(32);
  
  // Convert to hex string
  return '0x' + randomBytes.toString('hex');
};

/**
 * Get the Ethereum address from a private key
 * @param privateKey The Ethereum private key
 * @returns The corresponding Ethereum address
 */
export const getAddressFromPrivateKey = (privateKey: string): string => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    console.error('Error getting address from private key:', error);
    throw error;
  }
};

/**
 * Sign a message with a private key
 * @param privateKey The Ethereum private key
 * @param message The message to sign
 * @returns The signature
 */
export const signMessage = async (privateKey: string, message: string): Promise<string> => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

/**
 * Verify a message signature
 * @param address The Ethereum address that supposedly signed the message
 * @param message The original message
 * @param signature The signature to verify
 * @returns True if the signature is valid, false otherwise
 */
export const verifySignature = (
  address: string,
  message: string,
  signature: string
): boolean => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};
