import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubDomain, setSelectedSubDomain] = useState(null);
  const [ideaBrief, setIdeaBrief] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [collectingInfo, setCollectingInfo] = useState(null); // 'name' | 'email' | null
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageIdCounter = useRef(1);

  const products = [
    { id: 1, name: 'Shakti', emoji: '🛒', tagline: 'SEO / Listing Optimization Engine' },
    { id: 2, name: 'Legal Doc Classifier', emoji: '⚖️', tagline: 'AI Legal Documentation' },
    { id: 3, name: 'Sales & Support Bot', emoji: '💬', tagline: 'Customer Engagement' },
    { id: 4, name: 'AnyOCR', emoji: '📄', tagline: '96% Accuracy OCR' }
  ];

  const domains = [
    { id: 'sales', name: 'Sales', emoji: '📈' },
    { id: 'marketing', name: 'Marketing', emoji: '📢' },
    { id: 'ops', name: 'Ops / CX', emoji: '⚙️' },
    { id: 'hr', name: 'HR / Talent', emoji: '👥' },
    { id: 'finance', name: 'Finance', emoji: '💰' },
    { id: 'legal', name: 'Legal', emoji: '⚖️' },
    { id: 'research', name: 'Research', emoji: '🔬' },
    { id: 'ecommerce', name: 'E-commerce', emoji: '🛍️' },
    { id: 'other', name: 'Other', emoji: '💡' }
  ];

  const subDomains = {
    sales: ['Lead Gen', 'CRM Hygiene', 'Outreach', 'Forecasting', 'Pipeline Management'],
    marketing: ['Content Creation', 'Campaign Management', 'Analytics', 'SEO', 'Social Media'],
    ops: ['Process Automation', 'Quality Control', 'Inventory', 'Customer Support', 'Ticketing'],
    hr: ['Recruitment', 'Onboarding', 'Performance', 'Training', 'Compliance'],
    finance: ['Invoicing', 'Expense Tracking', 'Reporting', 'Forecasting', 'Compliance'],
    legal: ['Contract Management', 'Compliance', 'Document Review', 'Research', 'Case Management'],
    research: ['Data Collection', 'Analysis', 'Market Intel', 'Competitor Research', 'Surveys'],
    ecommerce: ['Product Listing', 'Inventory', 'Pricing', 'Customer Analytics', 'Growth'],
    other: ['Custom Solution', 'Integration', 'Automation', 'Data Processing', 'Other']
  };

  const getNextMessageId = () => {
    return messageIdCounter.current++;
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build conversation history for API
  const getConversationHistory = () => {
    return messages
      .filter(msg => msg.sender && msg.text) // Only messages with actual content
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
  };

  const handleButtonClick = (buttonType) => {
    setPersona(buttonType);

    const buttonText = buttonType === 'product'
      ? 'Explore Ikshan Products'
      : 'Contribute an Idea';

    const userMessage = {
      id: getNextMessageId(),
      text: buttonText,
      sender: 'user',
      timestamp: new Date()
    };

    const botResponse = buttonType === 'product'
      ? "Great! Click on any product to learn more:"
      : "Let's capture your idea! First, select the business domain:";

    const botMessage = {
      id: getNextMessageId(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
      showProducts: buttonType === 'product',
      showDomains: buttonType === 'contributor'
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);

    const userMessage = {
      id: getNextMessageId(),
      text: `Tell me about ${product.name}`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Call API with product context (shouldGenerateBrief = false)
    sendMessageToAPI(`Tell me about ${product.name} - provide USP, pain point solved, how it works, industry applicability, and implementation approach`, false);
  };

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);

    const userMessage = {
      id: getNextMessageId(),
      text: `${domain.emoji} ${domain.name}`,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: getNextMessageId(),
      text: `Great! Now select a specific area within ${domain.name}:`,
      sender: 'bot',
      timestamp: new Date(),
      showSubDomains: true,
      domainId: domain.id
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleSubDomainClick = (subDomain) => {
    setSelectedSubDomain(subDomain);
    setCollectingInfo('name'); // Start collecting user info

    const userMessage = {
      id: getNextMessageId(),
      text: subDomain,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: getNextMessageId(),
      text: `Perfect! Before we dive into your idea, what's your name?`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
  };

  const handleSuggestionClick = (suggestion) => {
    // Just fill the input field, don't send automatically
    setInputValue(suggestion);

    // Optional: focus on the input field after filling
    const inputElement = document.querySelector('.message-input');
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleGenerateBrief = () => {
    const userMessage = {
      id: getNextMessageId(),
      text: 'Generate Idea Brief',
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Request API to generate structured brief
    sendMessageToAPI('Based on our conversation, generate a structured idea brief', true);
  };

  const handleRefineBrief = () => {
    setInputValue('I\'d like to refine the idea brief. ');
    const inputElement = document.querySelector('.message-input');
    if (inputElement) {
      inputElement.focus();
    }
  };

  const handleSubmitBrief = async () => {
    if (!ideaBrief) return;

    const userMessage = {
      id: getNextMessageId(),
      text: 'Submit Idea',
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: getNextMessageId(),
      text: '✅ **Thank you!** Your idea has been submitted successfully. We\'ll review it and get back to you soon.',
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);

    // Save final brief to sheets
    await saveToSheet('FINAL IDEA SUBMISSION', ideaBrief);
  };

  const handleStartAnother = () => {
    // Reset all state
    setSelectedDomain(null);
    setSelectedSubDomain(null);
    setIdeaBrief(null);

    const botMessage = {
      id: getNextMessageId(),
      text: 'Great! Let\'s start fresh. Select a business domain for your new idea:',
      sender: 'bot',
      timestamp: new Date(),
      showDomains: true
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleSwitchToExplore = () => {
    setPersona('product');
    setSelectedDomain(null);
    setSelectedSubDomain(null);
    setIdeaBrief(null);

    const botMessage = {
      id: getNextMessageId(),
      text: 'Perfect! Let\'s explore our products. Click on any product to learn more:',
      sender: 'bot',
      timestamp: new Date(),
      showProducts: true
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const sendMessageToAPI = async (messageText, shouldGenerateBrief = false) => {
    try {
      console.log('Sending message to API...', { persona, shouldGenerateBrief });

      // Get conversation history
      const history = getConversationHistory();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          persona: persona,
          conversationHistory: history,
          context: {
            domain: selectedDomain?.name,
            subDomain: selectedSubDomain,
            generateBrief: shouldGenerateBrief
          }
        })
      });

      console.log('API response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error('API error:', data);
        const errorMessage = {
          id: getNextMessageId(),
          text: data.message || data.error || 'Failed to get response from server. Please check the console for details.',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        return;
      }

      const botMessage = {
        id: getNextMessageId(),
        text: data.message,
        sender: 'bot',
        timestamp: new Date(),
        showBriefActions: shouldGenerateBrief
      };

      setMessages(prev => [...prev, botMessage]);

      // Set idea brief if generated
      if (shouldGenerateBrief && data.message) {
        setIdeaBrief(data.message);
      }

      // Save to sheet if contributor mode
      if (persona === 'contributor') {
        saveToSheet(messageText, data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: getNextMessageId(),
        text: `Connection error: ${error.message}. Please check your internet connection and try again.`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const saveToSheet = async (userMessage, botResponse) => {
    try {
      await fetch('/api/save-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          botResponse,
          timestamp: new Date().toISOString(),
          userName: userName || 'Anonymous',
          userEmail: userEmail || 'Not provided'
        })
      });
    } catch (error) {
      console.error('Error saving to sheet:', error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: getNextMessageId(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');

    // Handle collecting name
    if (collectingInfo === 'name') {
      setUserName(currentInput);
      setCollectingInfo('email');

      const botMessage = {
        id: getNextMessageId(),
        text: `Nice to meet you, ${currentInput}! And what's your email address so we can follow up on your idea?`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      return;
    }

    // Handle collecting email
    if (collectingInfo === 'email') {
      setUserEmail(currentInput);
      setCollectingInfo(null); // Done collecting

      const botMessage = {
        id: getNextMessageId(),
        text: `Great! Now tell me about your product idea for ${selectedSubDomain}. What problem are you trying to solve?`,
        sender: 'bot',
        timestamp: new Date(),
        showGuidedPrompts: true
      };

      setMessages(prev => [...prev, botMessage]);
      return;
    }

    // Normal message flow
    setIsTyping(true);
    sendMessageToAPI(currentInput);
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
              <div className="message-text">
                {message.sender === 'bot' ? (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                ) : (
                  message.text
                )}
              </div>
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
              {message.showProducts && persona === 'product' && (
                <div className="product-chips">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      className="product-chip"
                      onClick={() => handleProductClick(product)}
                    >
                      <span className="product-emoji">{product.emoji}</span>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-tagline">{product.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {message.showDomains && persona === 'contributor' && (
                <div className="domain-chips">
                  {domains.map((domain) => (
                    <button
                      key={domain.id}
                      className="domain-chip"
                      onClick={() => handleDomainClick(domain)}
                    >
                      <span className="domain-emoji">{domain.emoji}</span>
                      <span className="domain-name">{domain.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {message.showSubDomains && persona === 'contributor' && message.domainId && (
                <div className="subdomain-chips">
                  {subDomains[message.domainId]?.map((subDomain, index) => (
                    <button
                      key={index}
                      className="subdomain-chip"
                      onClick={() => handleSubDomainClick(subDomain)}
                    >
                      {subDomain}
                    </button>
                  ))}
                </div>
              )}
              {message.showGuidedPrompts && persona === 'contributor' && (
                <div className="guided-prompts-section">
                  <div className="guided-prompts">
                    <button className="guided-prompt-chip" onClick={() => handleSuggestionClick(`I have an idea to automate ${selectedSubDomain} workflows`)}>
                      🤖 Workflow automation idea
                    </button>
                    <button className="guided-prompt-chip" onClick={() => handleSuggestionClick(`I want to build something that tracks ${selectedSubDomain} better`)}>
                      📊 Tracking solution idea
                    </button>
                    <button className="guided-prompt-chip" onClick={() => handleSuggestionClick(`I'm thinking of a tool to reduce manual ${selectedSubDomain} work`)}>
                      ⚡ Efficiency tool idea
                    </button>
                    <button className="guided-prompt-chip" onClick={() => handleSuggestionClick(`I have an idea for ${selectedSubDomain} integration`)}>
                      🔗 Integration idea
                    </button>
                  </div>
                  <div className="generate-brief-container">
                    <button className="generate-brief-button" onClick={handleGenerateBrief}>
                      ✨ Generate Idea Brief
                    </button>
                  </div>
                </div>
              )}
              {message.showBriefActions && persona === 'contributor' && (
                <div className="brief-actions">
                  <button className="brief-action-button primary" onClick={handleSubmitBrief}>
                    ✅ Submit Idea
                  </button>
                  <button className="brief-action-button secondary" onClick={handleRefineBrief}>
                    ✏️ Refine Brief
                  </button>
                  <button className="brief-action-button secondary" onClick={handleStartAnother}>
                    🔄 Start Another
                  </button>
                  <button className="brief-action-button secondary" onClick={handleSwitchToExplore}>
                    🔍 Switch to Explore
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
