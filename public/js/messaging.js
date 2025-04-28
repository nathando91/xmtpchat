document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const messagingStatus = document.getElementById('messaging-status');
  const messagingInit = document.getElementById('messaging-init');
  const messagingInterface = document.getElementById('messaging-interface');
  const initXmtpButton = document.getElementById('init-xmtp-button');
  const newConversationAddressInput = document.getElementById('new-conversation-address');
  const startConversationButton = document.getElementById('start-conversation-button');
  const conversationList = document.getElementById('conversation-list');
  const currentConversationTitle = document.getElementById('current-conversation');
  const messageList = document.getElementById('message-list');
  const messageInput = document.getElementById('message-input');
  const sendMessageButton = document.getElementById('send-message-button');

  // Event Listeners
  initXmtpButton.addEventListener('click', initializeXmtp);
  startConversationButton.addEventListener('click', startNewConversation);
  sendMessageButton.addEventListener('click', sendNewMessage);

  // Initialize XMTP client
  async function initializeXmtp() {
    if (!state.user) {
      messagingStatus.textContent = 'Please authenticate first';
      messagingStatus.className = 'status-message error';
      return;
    }

    try {
      messagingStatus.textContent = 'Initializing XMTP client...';
      messagingStatus.className = 'status-message info';

      // Get private key from localStorage
      const privateKey = localStorage.getItem('privateKey');
      if (!privateKey) {
        throw new Error('Private key not found. Please log out and log in again.');
      }

      // Initialize XMTP client
      const response = await fetch('/api/messaging/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privateKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize XMTP client');
      }

      const result = await response.json();

      // Update state
      state.xmtpClient = true;
      state.privateKey = privateKey;

      // Update UI
      messagingStatus.textContent = `XMTP client initialized for address: ${result.address}`;
      messagingStatus.className = 'status-message success';
      messagingInit.classList.add('hidden');
      messagingInterface.classList.remove('hidden');

      // Load conversations
      loadConversations();
    } catch (error) {
      console.error('Error initializing XMTP client:', error);
      messagingStatus.textContent = 'Error initializing XMTP: ' + error.message;
      messagingStatus.className = 'status-message error';
    }
  }

  // Refresh messaging information
  window.refreshMessagingInfo = function() {
    if (!state.user) {
      messagingStatus.textContent = 'Please authenticate first';
      messagingStatus.className = 'status-message';
      messagingInit.classList.add('hidden');
      messagingInterface.classList.add('hidden');
      return;
    }

    // Check if XMTP client is initialized
    if (state.xmtpClient) {
      messagingStatus.textContent = 'XMTP client is initialized';
      messagingStatus.className = 'status-message success';
      messagingInit.classList.add('hidden');
      messagingInterface.classList.remove('hidden');
      loadConversations();
    } else {
      messagingStatus.textContent = 'XMTP client is not initialized';
      messagingStatus.className = 'status-message';
      messagingInit.classList.remove('hidden');
      messagingInterface.classList.add('hidden');
    }
  };

  // Load conversations
  async function loadConversations() {
    try {
      // Get private key from localStorage
      const privateKey = localStorage.getItem('privateKey');
      if (!privateKey) {
        throw new Error('Private key not found');
      }

      // Get conversations
      const response = await fetch('/api/messaging/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privateKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load conversations');
      }

      const result = await response.json();
      const conversations = result.conversations;

      // Clear conversation list
      conversationList.innerHTML = '';

      // Add conversations to list
      if (conversations.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No conversations yet';
        conversationList.appendChild(li);
      } else {
        conversations.forEach(conversation => {
          const li = document.createElement('li');
          li.textContent = formatAddress(conversation.peerAddress);
          li.dataset.peerAddress = conversation.peerAddress;
          li.addEventListener('click', () => selectConversation(conversation.peerAddress));
          conversationList.appendChild(li);
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  // Start a new conversation
  async function startNewConversation() {
    const peerAddress = newConversationAddressInput.value.trim();

    if (!peerAddress) {
      alert('Please enter a peer address');
      return;
    }

    try {
      // Get private key from localStorage
      const privateKey = localStorage.getItem('privateKey');
      if (!privateKey) {
        throw new Error('Private key not found');
      }

      // Start conversation
      const response = await fetch('/api/messaging/conversation/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privateKey, peerAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start conversation');
      }

      const result = await response.json();
      const conversation = result.conversation;

      // Check if there's a warning about the peer not being on XMTP
      if (conversation.warning) {
        // Show warning to the user but continue with the conversation
        messagingStatus.textContent = conversation.warning;
        messagingStatus.className = 'status-message warning';
      } else {
        messagingStatus.textContent = 'Conversation started successfully';
        messagingStatus.className = 'status-message success';
      }

      // Select the new conversation
      selectConversation(conversation.peerAddress);

      // Clear input
      newConversationAddressInput.value = '';

      // Reload conversations
      loadConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
      
      // Provide a more helpful message if the peer cannot be messaged
      if (error.message.includes('Peer cannot be messaged')) {
        alert('The address you entered is not on the XMTP network yet. They need to initialize their XMTP client first.');
      } else {
        alert('Error starting conversation: ' + error.message);
      }
    }
  }

  // Select a conversation
  async function selectConversation(peerAddress) {
    // Update state
    state.activeConversation = peerAddress;

    // Update UI
    const items = conversationList.querySelectorAll('li');
    items.forEach(item => {
      if (item.dataset.peerAddress === peerAddress) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    currentConversationTitle.textContent = `Conversation with ${formatAddress(peerAddress)}`;

    // Load messages
    loadMessages(peerAddress);
  }

  // Load messages for a conversation
  async function loadMessages(peerAddress) {
    try {
      // Clear message list
      messageList.innerHTML = '';

      // Get private key from localStorage
      const privateKey = localStorage.getItem('privateKey');
      if (!privateKey) {
        throw new Error('Private key not found');
      }

      // Get messages
      const response = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privateKey, peerAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load messages');
      }

      const result = await response.json();
      const messages = result.messages;

      // Add messages to list
      if (messages.length === 0) {
        const div = document.createElement('div');
        div.textContent = 'No messages yet';
        div.style.textAlign = 'center';
        div.style.color = '#999';
        div.style.padding = '20px';
        messageList.appendChild(div);
      } else {
        messages.forEach(message => {
          addMessageToUI(message);
        });
        
        // Scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  // Send a new message
  async function sendNewMessage() {
    if (!state.activeConversation) {
      alert('Please select a conversation first');
      return;
    }

    const content = messageInput.value.trim();
    if (!content) {
      alert('Please enter a message');
      return;
    }

    try {
      // Get private key from localStorage
      const privateKey = localStorage.getItem('privateKey');
      if (!privateKey) {
        throw new Error('Private key not found');
      }

      // Send message
      const response = await fetch('/api/messaging/message/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privateKey,
          peerAddress: state.activeConversation,
          content
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const result = await response.json();
      const message = result.message;

      // Add message to UI
      addMessageToUI(message);

      // Clear input
      messageInput.value = '';

      // Scroll to bottom
      messageList.scrollTop = messageList.scrollHeight;
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    }
  }

  // Add a message to the UI
  function addMessageToUI(message) {
    const div = document.createElement('div');
    div.className = 'message';
    
    // Check if message is sent by us
    const privateKey = localStorage.getItem('privateKey');
    const wallet = { address: state.user.ethAddress }; // Simplified for demo
    
    if (message.senderAddress.toLowerCase() === wallet.address.toLowerCase()) {
      div.classList.add('sent');
    } else {
      div.classList.add('received');
    }
    
    // Add sender info
    const sender = document.createElement('div');
    sender.className = 'message-sender';
    sender.textContent = formatAddress(message.senderAddress);
    div.appendChild(sender);
    
    // Add content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message.content;
    div.appendChild(content);
    
    // Add timestamp
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date(message.sent).toLocaleTimeString();
    div.appendChild(time);
    
    messageList.appendChild(div);
  }
});
