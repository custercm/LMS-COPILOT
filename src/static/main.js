// ... existing JavaScript code ...

function sendMessage() {
    const messageInput = document.getElementById('user-input');
    const message = messageInput.value.trim();
    
    if (message) {
        // Add user message to chat
        addMessageToChat(message, 'user');
        messageInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({message: message})
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add AI response with streaming effect
            if (data.response) {
                streamResponse(data.response);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            removeTypingIndicator();
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'ai');
        });
    }
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingElement = document.createElement('div');
    typingElement.id = 'typing-indicator';
    typingElement.className = 'typing-indicator';
    
    typingElement.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typingElement = document.getElementById('typing-indicator');
    if (typingElement) {
        typingElement.remove();
    }
}

function streamResponse(responseText) {
    const chatMessages = document.getElementById('chat-messages');
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'message ai-message';
    aiMessageDiv.id = 'ai-response';
    
    // Add initial empty message to the DOM
    chatMessages.appendChild(aiMessageDiv);
    
    // Clear and stream text character by character
    let i = 0;
    const typingSpeed = 25; // milliseconds per character
    
    function typeWriter() {
        if (i < responseText.length) {
            aiMessageDiv.innerHTML += responseText.charAt(i);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            i++;
            setTimeout(typeWriter, typingSpeed);
        }
    }
    
    typeWriter();
}

// ... existing JavaScript code ...