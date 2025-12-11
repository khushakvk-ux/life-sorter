import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hey, I'm Ikshan's AI copilot. What are you here for today?",
      sender: 'bot',
      timestamp: new Date(),
      showButtons: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [persona, setPersona] = useState(null); // 'product' or 'contributor'
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleButtonClick = (buttonType) => {
    setPersona(buttonType);

    const buttonText = buttonType === 'product'
      ? 'Explore Ikshan Products'
      : 'Contribute an Idea';

    const userMessage = {
      id: messages.length + 1,
      text: buttonText,
      sender: 'user',
      timestamp: new Date()
    };

    const botResponse = buttonType === 'product'
      ? "Great! I'm here to help you understand our products. Which product are you curious about: **Shakti** (SEO optimizer), **Legal Doc Classifier**, **Sales & Support Bot**, or **AnyOCR**?"
      : "Awesome! I'd love to hear your ideas. What's the biggest bottleneck in your current workflow?";

    const botMessage = {
      id: messages.length + 2,
      text: botResponse,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Call the Vercel serverless function
      console.log('Sending message to API...', { persona });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          persona: persona
        })
      });

      console.log('API response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error('API error:', data);
        // Show specific error message from API
        const errorMessage = {
          id: messages.length + 2,
          text: data.message || data.error || 'Failed to get response from server. Please check the console for details.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      const botMessage = {
        id: messages.length + 2,
        text: data.message,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Fallback message if API fails
      const errorMessage = {
        id: messages.length + 2,
        text: `Connection error: ${error.message}. Please check your internet connection and try again.`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbot-container">
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            <div className="message-avatar">
              {message.sender === 'user' ? (
                <User size={20} />
              ) : (
                <Bot size={20} />
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              {message.showButtons && !persona && (
                <div className="action-buttons">
                  <button
                    className="action-button primary"
                    onClick={() => handleButtonClick('product')}
                  >
                    Explore Ikshan Products
                  </button>
                  <button
                    className="action-button secondary"
                    onClick={() => handleButtonClick('contributor')}
                  >
                    Contribute an Idea
                  </button>
                </div>
              )}
              <div className="message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message bot-message">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="message-input"
            rows="1"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="send-button"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
