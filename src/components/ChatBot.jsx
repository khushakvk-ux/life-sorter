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
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubDomain, setSelectedSubDomain] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'business-owner' | 'professional' | 'freelancer' | 'student'
  const [requirement, setRequirement] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [flowStage, setFlowStage] = useState('domain'); // 'domain' | 'subdomain' | 'role' | 'role-q1' | 'role-q2' | 'role-q3' | 'role-q4' | 'requirement' | 'identity' | 'complete'

  // Context collection for business owners
  const [businessContext, setBusinessContext] = useState({
    businessType: null,      // What kind of business
    industry: null,          // Which sector/industry
    targetAudience: null,    // Who is target audience
    marketSegment: null      // What market segment
  });

  // Context collection for professionals
  const [professionalContext, setProfessionalContext] = useState({
    roleAndIndustry: null,   // Role/job title and industry
    solutionFor: null,       // For self or company
    salaryContext: null      // If salary related, the context
  });
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
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

  const roleOptions = [
    { id: 'business-owner', text: 'Business Owner / Founder', emoji: '👔', description: 'I run my own business' },
    { id: 'professional', text: 'Professional / Employee', emoji: '💼', description: 'I work for a company' },
    { id: 'freelancer', text: 'Freelancer / Consultant', emoji: '🎯', description: 'I work independently' },
    { id: 'student', text: 'Student / Learner', emoji: '📚', description: 'I\'m learning and exploring' }
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

  // Initialize Google Sign-In
  useEffect(() => {
    const checkGoogleLoaded = setInterval(() => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        clearInterval(checkGoogleLoaded);
      }
    }, 100);

    // Cleanup after 5 seconds if not loaded
    setTimeout(() => clearInterval(checkGoogleLoaded), 5000);

    return () => clearInterval(checkGoogleLoaded);
  }, []);

  const handleGoogleSignIn = () => {
    if (!isGoogleLoaded || !window.google?.accounts?.id) {
      // If Google isn't loaded, just reload
      window.location.reload();
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      // No client ID configured, just reload
      window.location.reload();
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
    });

    window.google.accounts.id.prompt();
  };

  const handleGoogleCallback = (response) => {
    // Decode the JWT to get user info
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    setUserName(payload.name);
    setUserEmail(payload.email);
    setShowAuthModal(false);
    window.location.reload();
  };

  const handleStartNewIdea = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (clientId && isGoogleLoaded) {
      setShowAuthModal(true);
    } else {
      // No Google Auth configured, just reload
      window.location.reload();
    }
  };

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
    setFlowStage('role');

    const userMessage = {
      id: getNextMessageId(),
      text: subDomain,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: getNextMessageId(),
      text: `Quick question - this helps me find the best solution for you:\n\n**What best describes you?**`,
      sender: 'bot',
      timestamp: new Date(),
      showRoleOptions: true
    };

    setMessages(prev => [...prev, userMessage, botMessage]);

    // Save subdomain selection to sheet
    saveToSheet(`Selected Sub-domain: ${subDomain}`, '', selectedDomain?.name, subDomain);
  };

  const handleRoleClick = (role) => {
    setUserRole(role);

    const userMessage = {
      id: getNextMessageId(),
      text: `${role.emoji} ${role.text}`,
      sender: 'user',
      timestamp: new Date()
    };

    // Save role selection to sheet
    saveToSheet(`User Role: ${role.text}`, '', selectedDomain?.name, selectedSubDomain);

    // Start the appropriate questioning flow based on role
    if (role.id === 'business-owner') {
      setFlowStage('role-q1');
      const botMessage = {
        id: getNextMessageId(),
        text: `Great! As a business owner, I'd love to understand your business better to find the perfect solution. 🏢\n\n**What kind of business do you run?**\n\n_(e.g., E-commerce store, Consulting firm, Restaurant, SaaS company, etc.)_`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, botMessage]);

    } else if (role.id === 'professional') {
      setFlowStage('role-q1');
      const botMessage = {
        id: getNextMessageId(),
        text: `Thanks! Let me understand your professional context better. 💼\n\n**What is your role/job title and which industry are you in?**\n\n_(e.g., Marketing Manager in Healthcare, Software Developer in Fintech, HR Lead in Retail, etc.)_`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, botMessage]);

    } else if (role.id === 'freelancer') {
      setFlowStage('role-q1');
      const botMessage = {
        id: getNextMessageId(),
        text: `Awesome! Freelancers often have unique needs. 🎯\n\n**What type of freelance work do you do and who are your typical clients?**\n\n_(e.g., Web design for small businesses, Content writing for startups, etc.)_`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, botMessage]);

    } else {
      // Student/Learner - simpler flow
      setFlowStage('requirement');
      const botMessage = {
        id: getNextMessageId(),
        text: `Great! Let me help you explore and learn. 📚\n\n**What specific problem or topic are you trying to learn about or solve?**\n\n_(Tell me in 2-3 lines what you're looking for)_`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, botMessage]);
    }
  };

  // Handle step-by-step role questions
  const handleRoleQuestion = (answer) => {
    const userMessage = {
      id: getNextMessageId(),
      text: answer,
      sender: 'user',
      timestamp: new Date()
    };

    // Business Owner Flow
    if (userRole?.id === 'business-owner') {
      if (flowStage === 'role-q1') {
        // Q1: What kind of business
        setBusinessContext(prev => ({ ...prev, businessType: answer }));
        setFlowStage('role-q2');
        const botMessage = {
          id: getNextMessageId(),
          text: `Got it! 👍\n\n**Which sector or industry is your business in?**\n\n_(e.g., Technology, Healthcare, Education, Fashion, Food & Beverage, Finance, etc.)_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

      } else if (flowStage === 'role-q2') {
        // Q2: Which industry/sector
        setBusinessContext(prev => ({ ...prev, industry: answer }));
        setFlowStage('role-q3');
        const botMessage = {
          id: getNextMessageId(),
          text: `Interesting! 🎯\n\n**Who is your target audience?**\n\n_(e.g., Young professionals aged 25-35, Small business owners, Parents with young children, B2B enterprise clients, etc.)_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

      } else if (flowStage === 'role-q3') {
        // Q3: Target audience
        setBusinessContext(prev => ({ ...prev, targetAudience: answer }));
        setFlowStage('role-q4');
        const botMessage = {
          id: getNextMessageId(),
          text: `Perfect! Last question about your business: 📊\n\n**What market segment do you target?**\n\n• **Size:** Small businesses / SMBs / Mid-market / Enterprises\n• **Reach:** Local / National / Global\n\n_(e.g., "SMBs, National" or "Enterprises, Global")_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

      } else if (flowStage === 'role-q4') {
        // Q4: Market segment - now ask the main problem
        setBusinessContext(prev => ({ ...prev, marketSegment: answer }));
        setFlowStage('requirement');
        const botMessage = {
          id: getNextMessageId(),
          text: `Excellent! Now I have a good picture of your business. 🎉\n\n**What specific problem are you trying to solve right now?**\n\n_(Tell me in 2-3 lines what challenge you're facing and what success would look like for you)_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

        // Save business context to sheet
        saveToSheet(`Business Context: ${JSON.stringify({ ...businessContext, marketSegment: answer })}`, '', selectedDomain?.name, selectedSubDomain);
      }

    // Professional Flow
    } else if (userRole?.id === 'professional') {
      if (flowStage === 'role-q1') {
        // Q1: Role and industry
        setProfessionalContext(prev => ({ ...prev, roleAndIndustry: answer }));
        setFlowStage('role-q2');
        const botMessage = {
          id: getNextMessageId(),
          text: `Thanks for sharing! 👍\n\n**Are you looking for a solution for yourself personally, or for the company/team you work for?**\n\n_(e.g., "For myself to be more productive" or "For my team/department" or "For the whole company")_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

      } else if (flowStage === 'role-q2') {
        // Q2: For self or company
        setProfessionalContext(prev => ({ ...prev, solutionFor: answer }));

        // Check if the context involves salary/compensation
        const lowerAnswer = answer.toLowerCase();
        const prevContext = (selectedSubDomain || '').toLowerCase() + ' ' + (selectedDomain?.name || '').toLowerCase();
        const isSalaryRelated = ['salary', 'compensation', 'pay', 'payroll', 'wage', 'bonus'].some(term =>
          lowerAnswer.includes(term) || prevContext.includes(term)
        );

        if (isSalaryRelated) {
          setFlowStage('role-q3');
          const botMessage = {
            id: getNextMessageId(),
            text: `I notice this might involve compensation. Let me clarify: 💰\n\n**Is this about your own salary/compensation, or about employee payroll/company compensation structure?**\n\n_(This helps me recommend the right type of solution)_`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage, botMessage]);
        } else {
          // Skip salary question and go to requirement
          setFlowStage('requirement');
          const botMessage = {
            id: getNextMessageId(),
            text: `Great context! 🎉\n\n**What's the specific situation and goal you're trying to achieve?**\n\n_(Tell me in 2-3 lines what problem you're facing and what success would look like)_`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage, botMessage]);

          // Save professional context to sheet
          saveToSheet(`Professional Context: ${JSON.stringify({ ...professionalContext, solutionFor: answer })}`, '', selectedDomain?.name, selectedSubDomain);
        }

      } else if (flowStage === 'role-q3') {
        // Q3: Salary context (only if salary-related)
        setProfessionalContext(prev => ({ ...prev, salaryContext: answer }));
        setFlowStage('requirement');
        const botMessage = {
          id: getNextMessageId(),
          text: `Got it! Now I understand the context better. 🎉\n\n**What's the specific situation and goal you're trying to achieve?**\n\n_(Tell me in 2-3 lines what problem you're facing and what success would look like)_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

        // Save professional context to sheet
        saveToSheet(`Professional Context: ${JSON.stringify({ ...professionalContext, salaryContext: answer })}`, '', selectedDomain?.name, selectedSubDomain);
      }

    // Freelancer Flow
    } else if (userRole?.id === 'freelancer') {
      if (flowStage === 'role-q1') {
        // Q1: Type of freelance work
        setBusinessContext(prev => ({ ...prev, businessType: answer }));
        setFlowStage('role-q2');
        const botMessage = {
          id: getNextMessageId(),
          text: `Nice! 🎯\n\n**What's your biggest challenge or bottleneck in your freelance work right now?**\n\n_(e.g., Finding clients, Managing projects, Invoicing, Time management, etc.)_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

      } else if (flowStage === 'role-q2') {
        // Q2: Biggest challenge - now ask the main problem
        setBusinessContext(prev => ({ ...prev, targetAudience: answer }));
        setFlowStage('requirement');
        const botMessage = {
          id: getNextMessageId(),
          text: `I understand! 🎉\n\n**What specific problem are you trying to solve right now?**\n\n_(Tell me in 2-3 lines what you need help with and what would make your work easier)_`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage, botMessage]);

        // Save freelancer context to sheet
        saveToSheet(`Freelancer Context: ${JSON.stringify(businessContext)}`, '', selectedDomain?.name, selectedSubDomain);
      }
    }
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

  // Handler for "Learn how to implement" button
  const handleLearnImplementation = async (companies, userRequirement) => {
    setIsTyping(true);

    const loadingMessage = {
      id: getNextMessageId(),
      text: "Let me put together a comprehensive implementation guide with practical steps you can start using right away...",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    // Build detailed context from collected user info
    const userType = userRole?.text || 'General user';
    const businessType = businessContext.businessType || '[YOUR BUSINESS TYPE]';
    const industry = businessContext.industry || '[YOUR INDUSTRY]';
    const targetAudience = businessContext.targetAudience || '[YOUR TARGET AUDIENCE]';
    const marketSegment = businessContext.marketSegment || '[YOUR MARKET SEGMENT]';
    const roleAndIndustry = professionalContext.roleAndIndustry || '[YOUR ROLE & INDUSTRY]';
    const solutionFor = professionalContext.solutionFor || '[YOURSELF/TEAM/COMPANY]';
    const domainName = selectedDomain?.name || '[YOUR DOMAIN]';
    const subDomainName = selectedSubDomain || '[YOUR FOCUS AREA]';
    const topTool = companies[0];

    // Build context summary for prompts
    const contextForPrompts = userRole?.id === 'business-owner'
      ? `I run a ${businessType} in the ${industry} industry. My target audience is ${targetAudience} and I serve ${marketSegment}.`
      : userRole?.id === 'professional'
      ? `I'm a ${roleAndIndustry}. I'm looking for a solution ${solutionFor}.`
      : userRole?.id === 'freelancer'
      ? `I'm a freelancer doing ${businessType}. My main challenge is ${targetAudience}.`
      : `I'm exploring solutions in ${domainName}.`;

    // Build the comprehensive starter prompts pre-filled with user context
    const starterPrompts = `
---

## 🎯 START RIGHT NOW - Copy-Paste These Prompts into ChatGPT/Claude

**These prompts are pre-filled with YOUR context. Copy, paste, and get instant results!**

---

### 📋 Prompt 1: Clarify Your Problem (Decision-Ready Spec)

\`\`\`
You are my senior operations analyst. Convert my situation into a decision-ready one-page spec with zero fluff.

CONTEXT (messy notes): ${contextForPrompts} My problem: ${userRequirement}
GOAL (desired outcome): [DESCRIBE WHAT SUCCESS LOOKS LIKE]
WHO IT AFFECTS (users/teams): ${userRole?.id === 'business-owner' ? targetAudience : userRole?.id === 'professional' ? solutionFor : '[WHO USES THIS]'}
CONSTRAINTS (time/budget/tools/policy): [LIST YOUR CONSTRAINTS]
WHAT I'VE TRIED (if any): [PAST ATTEMPTS OR "None yet"]
DEADLINE/URGENCY: [WHEN DO YOU NEED THIS SOLVED?]

Deliver exactly these sections:

1) One-sentence problem statement (include impact)
2) 3 user stories (Primary / Secondary / Admin)
3) Success metrics (3–5) with how to measure each
4) Scope:
   - In-scope (5 bullets)
   - Out-of-scope (5 bullets)
5) Requirements:
   - Must-have (top 5, testable)
   - Nice-to-have (top 5)
6) Constraints & assumptions (bulleted)
7) Top risks + mitigations (5)
8) "First 48 hours" plan (3 concrete actions)

Ask ONLY 3 clarifying questions if required. If not required, proceed with reasonable assumptions and list them.
\`\`\`

---

### 🔄 Prompt 2: Design Your Workflow (Swimlanes + Automation Map)

\`\`\`
Act as a process architect. Design a workflow that actually works in real life (handoffs, exceptions, and checks included).

PROBLEM: ${userRequirement}
USERS/ROLES: ${userRole?.id === 'business-owner' ? 'Me (owner), team members, ' + targetAudience : userRole?.id === 'professional' ? 'Me (' + roleAndIndustry + '), colleagues, stakeholders' : '[LIST ROLES INVOLVED]'}
INPUTS: [WHAT DATA/DOCUMENTS/INFO DO YOU START WITH?]
OUTPUTS: [WHAT DO YOU NEED PRODUCED?]
CONSTRAINTS: ${userRole?.id === 'business-owner' ? 'Business in ' + industry + ', serving ' + marketSegment : '[TIME/BUDGET/TOOLS/POLICY]'}
VOLUME (how often): [DAILY/WEEKLY/MONTHLY + approx count]
QUALITY BAR: [accuracy/SLAs/compliance expectations]

Output:

A) Workflow overview (5–8 steps, numbered)
B) Swimlane workflow (by role):
   For each role, list:
   - Actions they take
   - What they need to know
   - What they produce
C) Failure points & exceptions:
   - 10 likely failure modes
   - Detection signal for each
   - Fix / fallback procedure
D) Automation opportunities:
   - "Automate now" (quick wins)
   - "Automate later" (needs changes)
   - What data/inputs are required for automation
E) Controls & QA:
   - Checks at 3 points (before / during / after)
   - Acceptance criteria for the final output
F) Time estimate per step + total cycle time

Keep it practical—no theory. If something is unclear, ask max 2 questions.
\`\`\`

---

### 📄 Prompt 3: Generate First Working Artifact (Ready-to-Use)

\`\`\`
You are an expert practitioner. Produce a real, ready-to-use first draft AND a reusable template.

ARTIFACT TYPE: [DOC/TEMPLATE/EMAIL/CONTRACT/PLAN/SOP/REPORT - pick what you need]
AUDIENCE: ${userRole?.id === 'business-owner' ? targetAudience : userRole?.id === 'professional' ? 'My ' + solutionFor : '[WHO WILL READ/USE IT]'}
CONTEXT: ${contextForPrompts} Problem: ${userRequirement}
REQUIREMENTS: [SPECIFIC REQUIREMENTS FOR THIS ARTIFACT]
TONE/STYLE: [Professional/Casual/Formal/Technical]
FORMAT: [bullet / table / memo / email / etc.]
MUST INCLUDE: [KEY POINTS THAT MUST BE COVERED]
MUST AVOID: [THINGS TO NOT INCLUDE]

Deliver:

1) Version A — "Ready to send/use" (complete)
2) Version B — "Short version" (<= 40% length)
3) Version C — Fill-in-the-blank template (placeholders + guidance)
4) Checklist — 10-item QA checklist to validate it before use
5) Notes — 5 common mistakes people make with this artifact + how to avoid them

If any required info is missing, make assumptions but clearly label them.
\`\`\`

---

### 🔍 Prompt 4: Quality & Risk Review (Find Gaps, Fix Them)

\`\`\`
You are my quality reviewer and risk auditor. Your job is to break this output, find gaps, and then fix it.

OUTPUT TO REVIEW:
[PASTE YOUR DRAFT/PLAN/DOCUMENT HERE]

CONTEXT / GOAL: ${contextForPrompts} I'm trying to: ${userRequirement}
CONSTRAINTS: ${userRole?.id === 'business-owner' ? 'Business: ' + businessType + ' in ' + industry + ', Target: ' + targetAudience : '[YOUR CONSTRAINTS]'}
NON-NEGOTIABLES: [POLICY/COMPLIANCE/STYLE RULES THAT CANNOT BE BROKEN]

Return:

A) Issues list (table):
- Issue
- Severity (Critical / High / Medium / Low)
- Why it matters (1 line)
- Exact fix (specific)

B) Edge cases & failure scenarios:
- List 10 scenarios the output doesn't handle well
- For each: what breaks + how to patch it

C) Final revised output:
- Provide a revised version that fixes all Critical + High issues
- Mark changes using **[CHANGED]** tags inline

D) "Confidence check":
- What assumptions remain?
- What I should verify before using this in production?
\`\`\`

---

### 🚀 Prompt 5: 14-Day Implementation Plan (Rollout with KPIs)

\`\`\`
You are my implementation lead. Create a 14-day rollout plan that proves value fast and avoids chaos.

CURRENT STATE: [DESCRIBE HOW YOU DO THIS TODAY - or "No process yet"]
TARGET STATE: ${userRequirement} solved using ${topTool?.name || 'the recommended solution'}
TEAM / ROLES: ${userRole?.id === 'business-owner' ? 'Me (owner) + ' + (targetAudience ? 'team serving ' + targetAudience : 'small team') : userRole?.id === 'professional' ? 'Me (' + roleAndIndustry + ') + relevant colleagues' : '[PEOPLE INVOLVED]'}
TOOLS AVAILABLE: [CURRENT TOOLS YOU USE + ${topTool?.name || 'new solution'}]
CONSTRAINTS: ${userRole?.id === 'business-owner' ? industry + ' industry, ' + marketSegment + ' market' : '[TIME/BUDGET/POLICY]'}
RISKS/CONCERNS: [WHAT COULD GO WRONG?]
SUCCESS METRICS: [HOW WILL YOU KNOW IT'S WORKING?]

Deliver:

1) Pilot definition:
   - Smallest scope that proves value (1–2 workflows)
   - What will NOT be attempted in the pilot
2) 14-day plan (day-by-day table):
   - Day
   - Owner
   - Task
   - Deliverable
   - Success check
3) Adoption plan:
   - Training (30–60 min plan)
   - Habits/rituals (what happens weekly)
   - How to handle resistance
4) KPI dashboard:
   - 5 KPIs
   - How to measure each
   - Baseline estimate vs target
5) Decision rule on Day 14:
   - Scale if: [conditions]
   - Iterate if: [conditions]
   - Stop if: [conditions]
6) "Quick wins" list:
   - 5 wins you can deliver in the first 72 hours
\`\`\`

---

💡 **Pro tip:** Run Prompt 1 first to clarify your problem, then use Prompt 3 to create your first artifact. You'll have real, usable outputs within 30 minutes—before your first vendor demo!
`;

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      // Build the implementation guide header
      const guideHeader = `## 🚀 Your Implementation Guide for ${topTool?.name || 'Your Solution'}

### 1️⃣ Where This Fits in Your Workflow

This solution helps at the **${subDomainName}** stage of your ${domainName} operations:
- **Intake:** Collecting and organizing your inputs
- **Processing:** Automating analysis and generation
- **Execution:** Delivering outputs to ${userRole?.id === 'business-owner' ? targetAudience : 'stakeholders'}

### 2️⃣ What to Prepare Before You Start (Checklist)

Before onboarding or running the prompts below:
- ☐ **3-5 example documents/data** you currently work with
- ☐ **Current workflow steps** written out (even rough notes)
- ☐ **Edge cases list** - situations that don't fit the norm
- ☐ **Success metric** - What does "solved" look like? (time saved? errors reduced? revenue impact?)
- ☐ **Constraints** - Budget, timeline, compliance requirements

### 3️⃣ Minimal Pilot Plan (14 days)

**Week 1: Single Workflow Test**
- Pick ONE specific use case from your ${subDomainName} work
- Run it through ${topTool?.name || 'the solution'} end-to-end
- Document what works and what doesn't

**Week 2: Expand & Measure**
- Add 2-3 similar cases
- Track time saved vs. old process
- Decide: scale, iterate, or stop

### 4️⃣ Questions to Ask in Demo/Onboarding

When you talk to ${topTool?.name || 'the vendor'}:
1. "Can you show a case study for ${industry || domainName}?"
2. "What's the typical setup time for a ${userRole?.id === 'business-owner' ? businessType : 'team like mine'}?"
3. "How do you handle [your biggest edge case]?"
4. "What integrations are available for tools I already use?"
5. "What's pricing for my scale: ${marketSegment || solutionFor || 'my current volume'}?"
6. "What proof can you share? (accuracy data, customer results, security certifications)"

### 5️⃣ Decision Criteria

**Adopt if:**
- Saves >30% time on target workflow
- Accuracy meets your quality bar
- Team can use it without constant support

**Reject if:**
- Setup takes >2 weeks with no quick wins
- Doesn't handle your critical edge cases
- Pricing doesn't scale with your growth
`;

      if (!apiKey) {
        // Fallback response without API - provide the pre-filled prompts directly
        const fallbackGuide = {
          id: getNextMessageId(),
          text: guideHeader + starterPrompts,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackGuide]);
        setIsTyping(false);
        return;
      }

      // With API: Generate a more personalized guide header, then append the standard prompts
      const implementationPrompt = `You are an expert implementation advisor. Create a brief, personalized implementation guide header.

USER CONTEXT:
- User Type: ${userType}
- Requirement: "${userRequirement}"
- Domain: ${domainName}
- Subdomain: ${subDomainName}
${userRole?.id === 'business-owner' ? `- Business: ${businessType}
- Industry: ${industry}
- Target Audience: ${targetAudience}
- Market Segment: ${marketSegment}` : ''}
${userRole?.id === 'professional' ? `- Role: ${roleAndIndustry}
- Solution For: ${solutionFor}` : ''}

RECOMMENDED TOOL: ${topTool?.name || 'AI Solution'}
- What it solves: ${topTool?.problem || 'Business automation'}
- Description: ${topTool?.description || 'AI-powered solution'}

Write ONLY these sections (keep it concise, ~300 words total):

## 🚀 Your Implementation Guide for ${topTool?.name || 'Your Solution'}

### 1️⃣ Where This Fits in Your Workflow
(2-3 sentences specific to their use case)

### 2️⃣ What to Prepare (Checklist)
(5 bullet points with checkboxes, specific to their problem)

### 3️⃣ Your 14-Day Pilot Plan
(Week 1 and Week 2, specific to their requirement)

### 4️⃣ Demo Questions to Ask
(5 questions tailored to their specific situation)

### 5️⃣ Decision Criteria
(Adopt if / Reject if - specific to their context)

Be specific to their industry, role, and requirement. No generic advice.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: implementationPrompt },
            { role: 'user', content: `Create an implementation guide for: "${userRequirement}"` }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (response.ok) {
        const data = await response.json();
        const personalizedHeader = data.choices[0]?.message?.content || guideHeader;

        const guideMessage = {
          id: getNextMessageId(),
          text: personalizedHeader + starterPrompts,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, guideMessage]);
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.error('Error generating implementation guide:', error);
      // Provide the pre-filled prompts even on error
      const errorMessage = {
        id: getNextMessageId(),
        text: guideHeader + starterPrompts,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
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
        // Build user context for richer search results
        const userContext = {
          role: userRole?.id,
          roleText: userRole?.text,
          ...(userRole?.id === 'business-owner' && {
            businessType: businessContext.businessType,
            industry: businessContext.industry,
            targetAudience: businessContext.targetAudience,
            marketSegment: businessContext.marketSegment
          }),
          ...(userRole?.id === 'professional' && {
            roleAndIndustry: professionalContext.roleAndIndustry,
            solutionFor: professionalContext.solutionFor,
            salaryContext: professionalContext.salaryContext
          }),
          ...(userRole?.id === 'freelancer' && {
            freelanceType: businessContext.businessType,
            challenge: businessContext.targetAudience
          })
        };

        // Use AI-powered search to find relevant companies
        const searchResponse = await fetch('/api/search-companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: selectedDomain?.id,
            subdomain: selectedSubDomain,
            requirement: requirement,
            userContext: userContext
          })
        });

        const searchData = await searchResponse.json();
        console.log('Search API response:', searchData);
        console.log('Debug info:', searchData.debug);
        const relevantCompanies = searchData.companies || [];
        const helpfulResponse = searchData.helpfulResponse || '';

        // Build user-friendly response
        let marketAnalysis = '';

        if (helpfulResponse) {
          // Use the AI-generated helpful response
          marketAnalysis = `## Here's what I found for you\n\n${helpfulResponse}\n\n`;
        } else if (relevantCompanies.length > 0) {
          // Fallback to simple listing if we have companies but no AI response
          marketAnalysis = `## Here are some tools that could help\n\n`;
          relevantCompanies.forEach((company, i) => {
            marketAnalysis += `**${company.name}** - ${company.problem || company.description || 'An AI-powered solution that could help with your needs'}\n\n`;
          });
        } else {
          // Ultimate fallback - should rarely happen
          marketAnalysis = `## Let me help you\n\nI'm looking into the best tools for your needs in ${selectedDomain?.name || 'this area'}. Based on what you're looking for ("${requirement}"), there are several approaches we could explore together.\n\n`;
        }

        marketAnalysis += `---\n\n`;
        marketAnalysis += `What would you like to do next?`;

        const finalOutput = {
          id: getNextMessageId(),
          text: marketAnalysis,
          sender: 'bot',
          timestamp: new Date(),
          showFinalActions: true,
          companies: relevantCompanies,
          userRequirement: requirement
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

    // Handle role question stages (step-by-step questioning)
    if (flowStage.startsWith('role-q')) {
      // Remove the user message we already added above, since handleRoleQuestion will add it
      setMessages(prev => prev.slice(0, -1));
      handleRoleQuestion(currentInput);
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
              {message.showRoleOptions && flowStage === 'role' && (
                <div className="role-options">
                  {roleOptions.map((role) => (
                    <button
                      key={role.id}
                      className="role-option-button"
                      onClick={() => handleRoleClick(role)}
                    >
                      <span className="role-emoji">{role.emoji}</span>
                      <div className="role-info">
                        <span className="role-text">{role.text}</span>
                        <span className="role-description">{role.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {message.showIdentityForm && (
                <IdentityForm onSubmit={handleIdentitySubmit} />
              )}
              {message.showFinalActions && (
                <div className="final-actions">
                  <button className="action-button secondary" onClick={handleStartNewIdea}>
                    🔄 Start Another Idea
                  </button>
                  {message.companies && message.companies.length > 0 && (
                    <button
                      className="action-button primary"
                      onClick={() => handleLearnImplementation(message.companies, message.userRequirement)}
                    >
                      📚 Learn How to Implement
                    </button>
                  )}
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

      {/* Google Auth Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>
              ✕
            </button>
            <div className="auth-modal-content">
              <h2>Start Fresh</h2>
              <p>Sign in to save your progress and preferences</p>

              <button className="google-signin-button" onClick={handleGoogleSignIn}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button className="skip-auth-button" onClick={() => window.location.reload()}>
                Continue without signing in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
