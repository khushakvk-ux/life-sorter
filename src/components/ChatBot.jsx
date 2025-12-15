import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatBot.css';

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
      text: "Hey, I'm Ikshan's AI Copilot. What are you here for today?\n\nLet's capture your idea! First, select the business domain:",
      sender: 'bot',
      timestamp: new Date(),
      showDomains: true
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
    { id: 'sales', name: 'Sales', emoji: '📈' },
    { id: 'marketing', name: 'Marketing', emoji: '📢' },
    { id: 'hr', name: 'HR / Talent', emoji: '👥' },
    { id: 'finance', name: 'Finance', emoji: '💰' },
    { id: 'legal', name: 'Legal', emoji: '⚖️' },
    { id: 'research', name: 'Research & Market Intelligence', emoji: '🔬' },
    { id: 'social', name: 'Social Media', emoji: '📱' },
    { id: 'youtube', name: 'YouTube', emoji: '🎥' },
    { id: 'analytics', name: 'Data Analytics', emoji: '📊' },
    { id: 'supply', name: 'Supply Chain', emoji: '🚚' },
    { id: 'support', name: 'User Support', emoji: '💬' },
    { id: 'ops', name: 'Ops / CX', emoji: '⚙️' },
    { id: 'other', name: 'Other', emoji: '💡' }
  ];

  const subDomains = {
    sales: ['Lead Generation', 'CRM Management', 'Outreach Automation', 'Sales Forecasting', 'Pipeline Management'],
    marketing: ['Content Creation', 'Campaign Management', 'Marketing Analytics', 'SEO Optimization', 'Email Marketing'],
    hr: ['Recruitment', 'Onboarding', 'Performance Management', 'Training & Development', 'Employee Engagement'],
    finance: ['Invoicing', 'Expense Tracking', 'Financial Reporting', 'Budget Forecasting', 'Compliance Management'],
    legal: ['Contract Management', 'Legal Compliance', 'Document Review', 'Legal Research', 'Case Management'],
    research: ['Market Research', 'Competitive Analysis', 'Data Collection', 'Consumer Insights', 'Trend Analysis'],
    social: ['Content Scheduling', 'Engagement Tracking', 'Analytics & Reporting', 'Community Management', 'Influencer Outreach'],
    youtube: ['Video SEO', 'Content Planning', 'Analytics & Insights', 'Audience Growth', 'Monetization'],
    analytics: ['Data Visualization', 'Predictive Analytics', 'Business Intelligence', 'KPI Tracking', 'Custom Reports'],
    supply: ['Inventory Management', 'Logistics Optimization', 'Supplier Management', 'Demand Forecasting', 'Order Tracking'],
    support: ['Ticket Management', 'Live Chat Support', 'Knowledge Base', 'Customer Feedback', 'Support Analytics'],
    ops: ['Process Automation', 'Quality Control', 'Workflow Optimization', 'Resource Planning', 'Operational Reporting'],
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
      text: `Cool. Pick a sub-domain:`,
      sender: 'bot',
      timestamp: new Date(),
      showSubDomains: true,
      domainId: domain.id
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

    // Generate final output
    setTimeout(() => {
      const finalOutput = {
        id: getNextMessageId(),
        text: `## Market Analysis\n\n**Existing Tools:**\n- Similar solutions in the ${selectedDomain?.name} space for ${selectedSubDomain}\n- [This is a placeholder - will be populated with real market research]\n\n**Gaps to Exploit:**\n- Opportunity areas identified\n- Differentiation possibilities\n\n## Ikshan's Suggested Direction\n\n**Proposed Solution:**\nBased on your requirement for "${requirement}", we can build a solution that...\n\n**Differentiators:**\n- Unique value propositions\n- Competitive advantages\n\n**Next Steps:**\n1. Schedule a discovery call\n2. Review detailed requirements\n3. Discuss implementation timeline`,
        sender: 'bot',
        timestamp: new Date(),
        showFinalActions: true
      };

      setMessages(prev => [...prev, finalOutput]);
      setIsTyping(false);

      // Save final output to sheet
      saveToSheet('Final Analysis Generated', finalOutput.text, selectedDomain?.name, selectedSubDomain);
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
              {message.showDomains && (
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
              {message.showSubDomains && message.domainId && (
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
