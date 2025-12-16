import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatBot.css';
import { formatCompaniesForDisplay, analyzeMarketGaps } from '../utils/csvParser';

const IdentityForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    onSubmit(name, email);
  };

  return (
    <div className="identity-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            className="identity-input"
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="identity-input"
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="action-button primary">
          Continue →
        </button>
      </form>
    </div>
  );
};

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "✨ Welcome to Ikshan! 😊\n\nI'll help you find the right AI tools, step by step.\n\nJust pick your domain 🚀 and we'll take it from there.",
      sender: 'bot',
      timestamp: new Date(),
      showQuickReplies: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubDomain, setSelectedSubDomain] = useState(null);
  const [requirement, setRequirement] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [flowStage, setFlowStage] = useState('domain'); // 'domain' | 'subdomain' | 'requirement' | 'identity' | 'complete'
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageIdCounter = useRef(1);
  const recognitionRef = useRef(null);

  const domains = [
    { id: 'marketing', name: 'Marketing', emoji: '📢' },
    { id: 'sales-support', name: 'Sales and Customer Support', emoji: '📈' },
    { id: 'social-media', name: 'Social Media', emoji: '📱' },
    { id: 'legal', name: 'Legal', emoji: '⚖️' },
    { id: 'hr-hiring', name: 'HR and talent Hiring', emoji: '👥' },
    { id: 'finance', name: 'Finance', emoji: '💰' },
    { id: 'supply-chain', name: 'Supply chain', emoji: '🚚' },
    { id: 'research', name: 'Research', emoji: '🔬' },
    { id: 'data-analysis', name: 'Data Analysis', emoji: '📊' }
  ];

  const quickReplies = [
    { id: 'about', text: 'What does Ikshan do?', icon: '💡' },
    { id: 'tools', text: 'Show me AI tools', icon: '🤖' },
    { id: 'custom', text: 'I have a custom idea', icon: '💭' }
  ];

  const subDomains = {
    marketing: [
      'Getting more leads',
      'Replying to customers fast',
      'Following up properly',
      'Selling on WhatsApp/Instagram',
      'Reducing sales/agency cost',
      'Understanding why customers don\'t convert',
      'others'
    ],
    'sales-support': [
      'AI Sales Agent / SDR',
      'Customer Support Automation',
      'Conversational Chat & Voice Bots',
      'Lead Qualification & Conversion',
      'Customer Success & Retention',
      'Call, Chat & Ticket Intelligence',
      'others'
    ],
    'social-media': [
      'Content Creation & Scheduling',
      'Personal Branding & LinkedIn Growth',
      'Video Repurposing (Long → Short)',
      'Ad Creative & Performance',
      'Brand Monitoring & Crisis Alerts',
      'DM, Leads & Influencer Automation',
      'others'
    ],
    legal: [
      'Contract Drafting & Review AI',
      'CLM & Workflow Automation',
      'Litigation & eDiscovery AI',
      'Legal Research Copilot',
      'Legal Ops & Matter Management',
      'Case Origination & Lead Gen',
      'others'
    ],
    'hr-hiring': [
      'Find candidates faster',
      'Automate interviews',
      'High-volume hiring',
      'Candidate follow-ups',
      'Onboarding & HR help',
      'Improve hire quality',
      'others'
    ],
    finance: [
      'Bookkeeping & Accounting',
      'Expenses & Spend Control',
      'Virtual CFO & Insights',
      'Budgeting & Forecasting',
      'Finance Ops & Close',
      'Invoices & Compliance',
      'others'
    ],
    'supply-chain': [
      'Inventory & Demand',
      'Procurement Automation',
      'Supplier Risk',
      'Shipping & Logistics',
      'Track My Orders',
      'Fully Automated Ops',
      'others'
    ],
    research: [
      'Track My Competitors',
      'Find Market & Industry Trends',
      'Understand Customer Reviews & Sentiment',
      'Monitor Websites, Prices & Online Changes',
      'Predict Demand & Business Outcomes',
      'Get AI Research Summary & Insights',
      'others'
    ],
    'data-analysis': [
      'Lead Follow-up & Auto Reply',
      'Sales & Revenue Forecasting',
      'Customer Churn & Retention Insights',
      'Instant Business Dashboards',
      'Marketing & Campaign Performance Tracking',
      '24/7 Customer Support Assistant',
      'others'
    ]
  };

  const getNextMessageId = () => {
    return messageIdCounter.current++;
  };

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      setVoiceSupported(true);
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  const handleQuickReply = async (replyId, replyText) => {
    // Add user message
    const userMessage = {
      id: getNextMessageId(),
      text: replyText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);

    // Handle different quick reply actions
    if (replyId === 'about') {
      setTimeout(() => {
        const botMessage = {
          id: getNextMessageId(),
          text: "Ikshan empowers startups and small businesses with **best-in-class AI tools** that eliminate barriers. 🚀\n\n✅ We offer AI solutions like SEO Optimizer and AnyOCR\n✅ If we don't have what you need, we'll connect you to the right tool\n✅ If it doesn't exist, we'll help you build it\n\n**Our philosophy:** Come to Ikshan, get a solution - no matter what. 💙\n\nReady to explore? Pick a domain below!",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    } else if (replyId === 'tools') {
      setTimeout(() => {
        const botMessage = {
          id: getNextMessageId(),
          text: "Great! I'll help you discover the perfect AI tools for your needs. 🎯\n\nFirst, let's understand what area you're working in. Pick a domain from the options below:",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    } else if (replyId === 'custom') {
      setTimeout(() => {
        const botMessage = {
          id: getNextMessageId(),
          text: "Awesome! Custom solutions are our specialty. 💡\n\nTo understand your vision better, let's start by picking the domain that matches your idea:",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
    setFlowStage('subdomain');

    const userMessage = {
      id: getNextMessageId(),
      text: `${domain.emoji} ${domain.name}`,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: getNextMessageId(),
      text: `Great choice! Now pick a specific area from the options below:`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);

    // Save domain selection to sheet
    saveToSheet(`Selected Domain: ${domain.name}`, '', domain.name, '');
  };

  const handleSubDomainClick = (subDomain) => {
    setSelectedSubDomain(subDomain);
    setFlowStage('requirement');

    const userMessage = {
      id: getNextMessageId(),
      text: subDomain,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: getNextMessageId(),
      text: `In 2-3 lines, what do you want to build or solve?`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);

    // Save subdomain selection to sheet
    saveToSheet(`Selected Sub-domain: ${subDomain}`, '', selectedDomain?.name, subDomain);
  };


  const saveToSheet = async (userMessage, botResponse, domain = '', subdomain = '') => {
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
          userName: userName || 'Pending',
          userEmail: userEmail || 'Pending',
          domain: domain || selectedDomain?.name || '',
          subdomain: subdomain || selectedSubDomain || '',
          requirement: requirement || ''
        })
      });
    } catch (error) {
      console.error('Error saving to sheet:', error);
    }
  };

  const handleIdentitySubmit = async (name, email) => {
    setUserName(name);
    setUserEmail(email);
    setFlowStage('complete');

    const botMessage = {
      id: getNextMessageId(),
      text: `Thank you, ${name}! Let me analyze existing solutions and suggest next steps...`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(true);

    // Save identity to sheet
    await saveToSheet(`User Identity: ${name} (${email})`, '', selectedDomain?.name, selectedSubDomain);

    // Generate final output with real market data using AI search
    setTimeout(async () => {
      try {
        // Use AI-powered search to find relevant companies
        const searchResponse = await fetch('/api/search-companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: selectedDomain?.id,
            subdomain: selectedSubDomain,
            requirement: requirement
          })
        });

        const searchData = await searchResponse.json();
        console.log('Search API response:', searchData);
        console.log('Debug info:', searchData.debug);
        const relevantCompanies = searchData.companies || [];

        // Format companies for display
        const companiesText = formatCompaniesForDisplay(relevantCompanies, 5);
        const gapsAnalysis = analyzeMarketGaps(requirement, relevantCompanies);

        // Build market analysis message
        let marketAnalysis = `## 🔍 Market Analysis\n\n`;

        // Existing Tools Section
        marketAnalysis += `### Existing Tools in ${selectedDomain?.name}`;
        if (selectedSubDomain) {
          marketAnalysis += ` - ${selectedSubDomain}`;
        }
        marketAnalysis += `\n\n${companiesText}\n\n`;

        // Market Gaps Section
        marketAnalysis += `### 💡 Market Gaps & Opportunities\n\n${gapsAnalysis}\n\n`;

        // Ikshan's Direction
        marketAnalysis += `## 🎯 Ikshan's Suggested Direction\n\n`;
        marketAnalysis += `### Your Requirement\n"${requirement}"\n\n`;

        marketAnalysis += `### Proposed Approach\n`;
        if (relevantCompanies.length === 0) {
          marketAnalysis += `Since there are limited existing solutions in this space, we can:\n`;
          marketAnalysis += `- Build a pioneering solution tailored to your specific needs\n`;
          marketAnalysis += `- Establish your product as the market leader\n`;
          marketAnalysis += `- Capture first-mover advantage\n\n`;
        } else if (relevantCompanies.length <= 2) {
          marketAnalysis += `With limited competition, we can:\n`;
          marketAnalysis += `- Analyze what existing solutions are missing\n`;
          marketAnalysis += `- Build a superior product with better UX and features\n`;
          marketAnalysis += `- Position as the modern, user-friendly alternative\n\n`;
        } else {
          marketAnalysis += `In this competitive market, we'll focus on:\n`;
          marketAnalysis += `- Identifying specific gaps in existing solutions\n`;
          marketAnalysis += `- Creating unique value through innovation\n`;
          marketAnalysis += `- Targeting underserved user segments or use cases\n\n`;
        }

        marketAnalysis += `### Key Differentiators\n`;
        marketAnalysis += `- **Tailored Solution**: Built specifically for your requirements\n`;
        marketAnalysis += `- **Modern Technology**: Latest AI and cloud infrastructure\n`;
        marketAnalysis += `- **User-Centric Design**: Focus on exceptional user experience\n`;
        marketAnalysis += `- **Scalable Architecture**: Ready to grow with your business\n\n`;

        marketAnalysis += `### 🚀 Next Steps\n\n`;
        marketAnalysis += `1. **Discovery Call**: Deep dive into your requirements and vision\n`;
        marketAnalysis += `2. **Competitive Analysis**: Detailed review of similar solutions\n`;
        marketAnalysis += `3. **Technical Design**: Architecture and feature specifications\n`;
        marketAnalysis += `4. **Timeline & Budget**: Clear roadmap and cost estimates\n`;
        marketAnalysis += `5. **MVP Development**: Start building your solution\n\n`;
        marketAnalysis += `**We're excited to help bring your vision to life!** 💙`;

        const finalOutput = {
          id: getNextMessageId(),
          text: marketAnalysis,
          sender: 'bot',
          timestamp: new Date(),
          showFinalActions: true
        };

        setMessages(prev => [...prev, finalOutput]);
        setIsTyping(false);

        // Save final output to sheet
        saveToSheet('Final Analysis Generated', finalOutput.text, selectedDomain?.name, selectedSubDomain);
      } catch (error) {
        console.error('Error generating market analysis:', error);

        // Fallback to simple message if CSV loading fails
        const fallbackOutput = {
          id: getNextMessageId(),
          text: `## Market Analysis\n\nThank you for sharing your idea in the ${selectedDomain?.name} space!\n\nBased on your requirement: "${requirement}"\n\n### Next Steps\n\n1. Schedule a discovery call\n2. Review detailed requirements\n3. Discuss implementation timeline\n\n**We're excited to help bring your vision to life!** 💙`,
          sender: 'bot',
          timestamp: new Date(),
          showFinalActions: true
        };

        setMessages(prev => [...prev, fallbackOutput]);
        setIsTyping(false);
      }
    }, 2000);
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

    // Handle domain stage - user typed instead of clicking
    if (flowStage === 'domain') {
      // Try to match what they typed to a domain
      const inputLower = currentInput.toLowerCase().trim();
      const matchedDomain = domains.find(d =>
        d.name.toLowerCase() === inputLower ||
        d.id.toLowerCase() === inputLower ||
        d.name.toLowerCase().includes(inputLower) ||
        inputLower.includes(d.name.toLowerCase())
      );

      // If they typed a valid domain name, select it automatically
      if (matchedDomain) {
        handleDomainClick(matchedDomain);
        return;
      }

      // Otherwise, treat it as a question - give AI response and redirect
      setIsTyping(true);

      try {
        // Call AI to answer their question
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            persona: 'assistant',
            context: { isRedirecting: true }
          })
        });

        const data = await response.json();
        const aiAnswer = data.message || "I'm here to help!";

        // Combine AI answer with redirect message
        const botMessage = {
          id: getNextMessageId(),
          text: `${aiAnswer}\n\nNow, to help you find the right business solution, please select a domain from the options below:`,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error calling AI:', error);

        // Fallback if AI fails
        const botMessage = {
          id: getNextMessageId(),
          text: `I'd love to help! To get started, please select a domain from the options below:`,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } finally {
        setIsTyping(false);
      }

      return;
    }

    // Handle subdomain stage - user typed instead of clicking
    if (flowStage === 'subdomain') {
      // Try to match what they typed to a subdomain
      const inputLower = currentInput.toLowerCase().trim();
      const availableSubDomains = subDomains[selectedDomain?.id] || [];
      const matchedSubDomain = availableSubDomains.find(sd =>
        sd.toLowerCase() === inputLower ||
        sd.toLowerCase().includes(inputLower) ||
        inputLower.includes(sd.toLowerCase())
      );

      // If they typed a valid subdomain name, select it automatically
      if (matchedSubDomain) {
        handleSubDomainClick(matchedSubDomain);
        return;
      }

      // Otherwise, treat it as a question - give AI response and redirect
      setIsTyping(true);

      try {
        // Call AI to answer their question
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: currentInput,
            persona: 'assistant',
            context: { isRedirecting: true, domain: selectedDomain?.name }
          })
        });

        const data = await response.json();
        const aiAnswer = data.message || "Great question!";

        // Combine AI answer with redirect message
        const botMessage = {
          id: getNextMessageId(),
          text: `${aiAnswer}\n\nNow, please choose a specific area from the options below:`,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error calling AI:', error);

        // Fallback if AI fails
        const botMessage = {
          id: getNextMessageId(),
          text: `Great! Now please choose a specific area from the options below:`,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } finally {
        setIsTyping(false);
      }

      return;
    }

    // Handle requirement text input
    if (flowStage === 'requirement') {
      setRequirement(currentInput);
      setFlowStage('identity');

      const botMessage = {
        id: getNextMessageId(),
        text: `Please share your name and email address.`,
        sender: 'bot',
        timestamp: new Date(),
        showIdentityForm: true
      };

      setMessages(prev => [...prev, botMessage]);

      // Save requirement to sheet
      saveToSheet(`Requirement: ${currentInput}`, '', selectedDomain?.name, selectedSubDomain);
      return;
    }

    // If we're at identity stage and they typed instead of using form
    if (flowStage === 'identity') {
      const botMessage = {
        id: getNextMessageId(),
        text: `Please use the form above to enter your name and email.`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      return;
    }

    // If conversation is complete
    if (flowStage === 'complete') {
      const botMessage = {
        id: getNextMessageId(),
        text: `Thank you for your interest! Our team will review your requirements and get back to you soon. If you'd like to start a new conversation, please click "Start Another Idea" above.`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      return;
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
              <div className="message-text">
                {message.sender === 'bot' ? (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                ) : (
                  message.text
                )}
              </div>
              {message.showQuickReplies && flowStage === 'domain' && (
                <div className="quick-replies">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply.id}
                      className="quick-reply-button"
                      onClick={() => handleQuickReply(reply.id, reply.text)}
                    >
                      <span className="quick-reply-icon">{reply.icon}</span>
                      <span className="quick-reply-text">{reply.text}</span>
                    </button>
                  ))}
                </div>
              )}
              {message.showIdentityForm && (
                <IdentityForm onSubmit={handleIdentitySubmit} />
              )}
              {message.showFinalActions && (
                <div className="final-actions">
                  <button className="action-button primary" onClick={() => window.location.reload()}>
                    🔄 Start Another Idea
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

      {/* Persistent Button Bar - Above input for better UX */}
      {(flowStage === 'domain' || flowStage === 'subdomain') && (
        <div className="persistent-button-bar">
          {flowStage === 'domain' && (
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
          {flowStage === 'subdomain' && selectedDomain && (
            <div className="subdomain-chips">
              {subDomains[selectedDomain.id]?.map((subDomain, index) => (
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
        </div>
      )}

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Listening..." : "Type your message here..."}
            className="message-input"
            rows="1"
          />
          {voiceSupported && flowStage === 'requirement' && (
            <button
              onClick={toggleVoiceRecording}
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
              title={isRecording ? "Stop recording" : "Click to speak"}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}
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
