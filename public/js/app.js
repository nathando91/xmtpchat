// Global state
const state = {
  user: null,
  activeTab: 'auth',
  ethAddress: null,
  accountAddress: null,
  xmtpClient: null,
  privateKey: null,
  activeConversation: null
};

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const usernameDisplay = document.getElementById('username-display');
const logoutButton = document.getElementById('logout-button');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Set up tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Set up logout button
  logoutButton.addEventListener('click', logout);

  // Check if user is already logged in
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      state.user = JSON.parse(savedUser);
      updateUIForLoggedInUser();
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('user');
    }
  }
});

// Switch between tabs
function switchTab(tabName) {
  // Update active tab
  state.activeTab = tabName;
  
  // Update tab buttons
  tabButtons.forEach(button => {
    if (button.getAttribute('data-tab') === tabName) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update tab panels
  tabPanels.forEach(panel => {
    if (panel.id === tabName) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
  
  // Refresh tab content if needed
  if (tabName === 'account' && state.user) {
    refreshAccountInfo();
  } else if (tabName === 'messaging' && state.user) {
    refreshMessagingInfo();
  }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
  if (state.user) {
    usernameDisplay.textContent = `Logged in as: ${state.user.username}`;
    logoutButton.classList.remove('hidden');
    
    // Update account tab
    document.getElementById('account-status').textContent = 'Loading account information...';
    document.getElementById('messaging-status').textContent = 'Loading messaging information...';
    
    // If we're on the account tab, refresh account info
    if (state.activeTab === 'account') {
      refreshAccountInfo();
    } else if (state.activeTab === 'messaging') {
      refreshMessagingInfo();
    }
  }
}

// Logout function
function logout() {
  state.user = null;
  state.ethAddress = null;
  state.accountAddress = null;
  state.xmtpClient = null;
  state.privateKey = null;
  state.activeConversation = null;
  
  localStorage.removeItem('user');
  localStorage.removeItem('privateKey');
  
  usernameDisplay.textContent = 'Not logged in';
  logoutButton.classList.add('hidden');
  
  // Reset UI elements
  document.getElementById('account-details').classList.add('hidden');
  document.getElementById('account-actions').classList.add('hidden');
  document.getElementById('account-status').textContent = 'Please authenticate first';
  
  document.getElementById('messaging-init').classList.add('hidden');
  document.getElementById('messaging-interface').classList.add('hidden');
  document.getElementById('messaging-status').textContent = 'Please authenticate first';
  
  // Switch to auth tab
  switchTab('auth');
}

// Show status message
function showStatus(elementId, message, type = 'info') {
  const statusElement = document.getElementById(elementId);
  statusElement.textContent = message;
  statusElement.className = 'status-message ' + type;
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

// Format address for display (truncate middle)
function formatAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
