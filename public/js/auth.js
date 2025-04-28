// Import WebAuthn browser functions
document.addEventListener('DOMContentLoaded', async () => {
  // Load WebAuthn browser library
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@simplewebauthn/browser/dist/bundle/index.umd.min.js';
  script.async = true;
  document.head.appendChild(script);

  // DOM Elements
  const usernameInput = document.getElementById('username');
  const registerButton = document.getElementById('register-button');
  const loginButton = document.getElementById('login-button');
  const authStatus = document.getElementById('auth-status');

  // Event Listeners
  registerButton.addEventListener('click', registerPasskey);
  loginButton.addEventListener('click', loginWithPasskey);

  // Register a new passkey
  async function registerPasskey() {
    const username = usernameInput.value.trim();
    
    if (!username) {
      showStatus('auth-status', 'Please enter a username', 'error');
      return;
    }
    
    try {
      showStatus('auth-status', 'Starting registration...', 'info');
      
      // Get registration options from server
      const optionsResponse = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (!optionsResponse.ok) {
        const error = await optionsResponse.json();
        throw new Error(error.error || 'Failed to get registration options');
      }
      
      const options = await optionsResponse.json();
      
      // Start the registration process
      showStatus('auth-status', 'Please follow your browser\'s instructions to create a passkey...', 'info');
      const SimpleWebAuthnBrowser = window.SimpleWebAuthnBrowser;
      const registrationResponse = await SimpleWebAuthnBrowser.startRegistration(options);
      
      // Verify the registration with the server
      const verificationResponse = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          response: registrationResponse,
        }),
      });
      
      const verificationResult = await verificationResponse.json();
      
      if (verificationResult.verified) {
        showStatus('auth-status', 'Registration successful! You can now log in.', 'success');
        
        // Generate a random private key for this user
        const privateKey = generateRandomPrivateKey();
        localStorage.setItem('privateKey', privateKey);
        
        // Create Ethereum address from private key
        const ethAddress = await getAddressFromPrivateKey(privateKey);
        
        // Store user information
        state.user = {
          username,
          ethAddress,
        };
        
        localStorage.setItem('user', JSON.stringify(state.user));
        
        // Update UI
        updateUIForLoggedInUser();
        
        // Create smart contract account for the user
        createSmartContractAccount(ethAddress);
        
        // Switch to account tab
        switchTab('account');
      } else {
        showStatus('auth-status', 'Registration failed: ' + (verificationResult.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showStatus('auth-status', 'Registration error: ' + error.message, 'error');
    }
  }

  // Login with passkey
  async function loginWithPasskey() {
    const username = usernameInput.value.trim();
    
    if (!username) {
      showStatus('auth-status', 'Please enter a username', 'error');
      return;
    }
    
    try {
      showStatus('auth-status', 'Starting authentication...', 'info');
      
      // Get authentication options from server
      const optionsResponse = await fetch('/api/auth/auth-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (!optionsResponse.ok) {
        const error = await optionsResponse.json();
        throw new Error(error.error || 'Failed to get authentication options');
      }
      
      const options = await optionsResponse.json();
      
      // Start the authentication process
      showStatus('auth-status', 'Please follow your browser\'s instructions to use your passkey...', 'info');
      const SimpleWebAuthnBrowser = window.SimpleWebAuthnBrowser;
      const authenticationResponse = await SimpleWebAuthnBrowser.startAuthentication(options);
      
      // Verify the authentication with the server
      const verificationResponse = await fetch('/api/auth/verify-authentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          response: authenticationResponse,
        }),
      });
      
      const verificationResult = await verificationResponse.json();
      
      if (verificationResult.verified) {
        showStatus('auth-status', 'Authentication successful!', 'success');
        
        // Check if we have a stored private key, or generate a new one
        let privateKey = localStorage.getItem('privateKey');
        if (!privateKey) {
          privateKey = generateRandomPrivateKey();
          localStorage.setItem('privateKey', privateKey);
        }
        
        // Create Ethereum address from private key
        const ethAddress = await getAddressFromPrivateKey(privateKey);
        
        // Store user information
        state.user = {
          username,
          ethAddress,
        };
        
        localStorage.setItem('user', JSON.stringify(state.user));
        
        // Update UI
        updateUIForLoggedInUser();
        
        // Create or get smart contract account for the user
        createSmartContractAccount(ethAddress);
        
        // Switch to account tab
        switchTab('account');
      } else {
        showStatus('auth-status', 'Authentication failed: ' + (verificationResult.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showStatus('auth-status', 'Authentication error: ' + error.message, 'error');
    }
  }

  // Generate a random Ethereum private key
  function generateRandomPrivateKey() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Get Ethereum address from private key
  async function getAddressFromPrivateKey(privateKey) {
    // We'll use ethers.js in the browser for this
    // For simplicity in this demo, we'll return a placeholder address
    // In a real app, you'd use ethers.js to derive the address
    return '0x' + Array.from(new Uint8Array(20)).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Flag to track if account creation is in progress
  let isCreatingContractAccount = false;
  
  // Create a smart contract account for the user
  async function createSmartContractAccount(ownerAddress) {
    // Skip if already in progress
    if (isCreatingContractAccount) {
      console.log('Contract account creation already in progress, ignoring duplicate request');
      return;
    }
    
    try {
      isCreatingContractAccount = true;
      console.log('Creating smart contract account for:', ownerAddress);
      
      // First check if the user already has an account
      try {
        const checkResponse = await fetch(`/api/contracts/account/${ownerAddress}`);
        if (checkResponse.ok) {
          const accountInfo = await checkResponse.json();
          if (accountInfo.accountAddress) {
            console.log('User already has a smart contract account:', accountInfo.accountAddress);
            state.accountAddress = accountInfo.accountAddress;
            return;
          }
        }
      } catch (checkError) {
        // Continue with account creation if check fails
        console.log('No existing account found, creating new one');
      }
      
      const response = await fetch('/api/contracts/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerAddress }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error creating account:', error);
        return;
      }
      
      const result = await response.json();
      state.accountAddress = result.accountAddress;
      
      console.log('Smart contract account created:', result.accountAddress);
    } catch (error) {
      console.error('Error creating smart contract account:', error);
    } finally {
      isCreatingContractAccount = false;
    }
  }
});
