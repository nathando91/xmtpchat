# Web3 Passkey Authentication with XMTP Messaging

This project is a Web3 application that allows users to authenticate using Passkeys (WebAuthn), receive a Smart Contract Account (SCA), and send/receive messages via XMTP.

## Features

- **Passkey Authentication**: Users can register and authenticate using WebAuthn Passkeys
- **Smart Contract Accounts**: Each user gets an Abstract Smart Contract Account (SCA)
- **XMTP Messaging**: Send and receive encrypted messages between users

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Ethereum wallet (for testing)
- Infura API key (or other Ethereum RPC provider)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. Deploy the smart contract:
   ```
   npm run deploy-contract
   ```
   - Update the `ACCOUNT_FACTORY_ADDRESS` in your `.env` file with the deployed contract address

5. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `src/auth`: Passkey authentication logic
- `src/contracts`: Smart contract definitions and interactions
- `src/messaging`: XMTP messaging functionality
- `src/utils`: Utility functions
- `public`: Static assets and client-side code

## Usage

1. Open your browser to `http://localhost:3000`
2. Register a new passkey
3. Authenticate with your passkey
4. After authentication, you'll receive a Smart Contract Account
5. Use the messaging interface to send and receive messages via XMTP

## Smart Contract

The Smart Contract Account (SCA) allows users to:
- Send and receive tokens
- Execute transactions
- Interact with other contracts

## License

ISC
# xmtpchat
