document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const accountStatus = document.getElementById('account-status');
  const accountDetails = document.getElementById('account-details');
  const accountActions = document.getElementById('account-actions');
  const ownerAddressElement = document.getElementById('owner-address');
  const accountAddressElement = document.getElementById('account-address');
  const accountBalanceElement = document.getElementById('account-balance');
  const recipientAddressInput = document.getElementById('recipient-address');
  const transferAmountInput = document.getElementById('transfer-amount');
  const transferButton = document.getElementById('transfer-button');
  const transferStatus = document.getElementById('transfer-status');

  // Event Listeners
  transferButton.addEventListener('click', transferEth);

  // Refresh account information
  window.refreshAccountInfo = async function() {
    if (!state.user || !state.user.ethAddress) {
      accountStatus.textContent = 'Please authenticate first';
      accountDetails.classList.add('hidden');
      accountActions.classList.add('hidden');
      return;
    }

    try {
      accountStatus.textContent = 'Loading account information...';
      accountStatus.className = 'status-message info';

      const response = await fetch(`/api/contracts/account/${state.user.ethAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Account not found, try to create one
          await createAccount();
          return;
        }
        
        const error = await response.json();
        throw new Error(error.error || 'Failed to get account information');
      }
      
      const accountInfo = await response.json();
      
      // Update state
      state.accountAddress = accountInfo.accountAddress;
      
      // Update UI
      ownerAddressElement.textContent = accountInfo.ownerAddress;
      accountAddressElement.textContent = accountInfo.accountAddress;
      accountBalanceElement.textContent = accountInfo.balance;
      
      accountStatus.textContent = 'Account loaded successfully';
      accountStatus.className = 'status-message success';
      accountDetails.classList.remove('hidden');
      accountActions.classList.remove('hidden');
    } catch (error) {
      console.error('Error refreshing account info:', error);
      accountStatus.textContent = 'Error loading account: ' + error.message;
      accountStatus.className = 'status-message error';
    }
  };

  // Create a new account
  async function createAccount() {
    try {
      accountStatus.textContent = 'Creating new account...';
      accountStatus.className = 'status-message info';
      
      const response = await fetch('/api/contracts/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerAddress: state.user.ethAddress }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }
      
      const result = await response.json();
      
      // Update state
      state.accountAddress = result.accountAddress;
      
      // Refresh account info
      refreshAccountInfo();
    } catch (error) {
      console.error('Error creating account:', error);
      accountStatus.textContent = 'Error creating account: ' + error.message;
      accountStatus.className = 'status-message error';
    }
  }

  // Transfer ETH from account
  async function transferEth() {
    const recipientAddress = recipientAddressInput.value.trim();
    const amount = transferAmountInput.value.trim();
    
    if (!recipientAddress) {
      transferStatus.textContent = 'Please enter a recipient address';
      transferStatus.className = 'status-message error';
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      transferStatus.textContent = 'Please enter a valid amount';
      transferStatus.className = 'status-message error';
      return;
    }
    
    try {
      transferStatus.textContent = 'Processing transfer...';
      transferStatus.className = 'status-message info';
      
      const response = await fetch('/api/contracts/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountAddress: state.accountAddress,
          toAddress: recipientAddress,
          amount: amount
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to transfer ETH');
      }
      
      const result = await response.json();
      
      transferStatus.textContent = `Transfer successful! Transaction hash: ${result.transactionHash}`;
      transferStatus.className = 'status-message success';
      
      // Clear inputs
      recipientAddressInput.value = '';
      transferAmountInput.value = '';
      
      // Refresh account info
      setTimeout(refreshAccountInfo, 2000);
    } catch (error) {
      console.error('Error transferring ETH:', error);
      transferStatus.textContent = 'Error transferring ETH: ' + error.message;
      transferStatus.className = 'status-message error';
    }
  }
});
