import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

// Load environment variables
dotenv.config();

// Setup test data for the application
async function setupTestData() {
  console.log('Setting up test data for the application...');
  
  try {
    // Create a simulated account factory address if not already set
    const envPath = path.join(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (!envContent.includes('ACCOUNT_FACTORY_ADDRESS=') || 
        envContent.includes('ACCOUNT_FACTORY_ADDRESS=') && !envContent.match(/ACCOUNT_FACTORY_ADDRESS=0x[a-fA-F0-9]{40}/)) {
      // Generate a mock contract address
      const mockContractAddress = '0x' + '1'.repeat(40);
      
      // Update .env file
      if (envContent.includes('ACCOUNT_FACTORY_ADDRESS=')) {
        envContent = envContent.replace(
          /ACCOUNT_FACTORY_ADDRESS=.*/,
          `ACCOUNT_FACTORY_ADDRESS=${mockContractAddress}`
        );
      } else {
        envContent += `\nACCOUNT_FACTORY_ADDRESS=${mockContractAddress}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`Set mock contract address: ${mockContractAddress}`);
    }
    
    console.log('Test data setup completed successfully!');
  } catch (error) {
    console.error('Error setting up test data:', error instanceof Error ? error.message : String(error));
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTestData();
}

export { setupTestData };
