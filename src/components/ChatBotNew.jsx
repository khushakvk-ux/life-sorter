import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Mic, MicOff, Package, Box, Gift, ArrowLeft, Plus, MessageSquare, ShoppingCart, Scale, Users, Sparkles, Youtube, History, X, Menu, Edit3, Chrome, Zap, Brain, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatBotNew.css';
import { formatCompaniesForDisplay, analyzeMarketGaps } from '../utils/csvParser';

// Generate unique message IDs to prevent React key conflicts
const generateUniqueId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// SOLUTION RECOMMENDATIONS DATA
// ============================================

// Chrome Extensions & Plugins mapped to categories
const CHROME_EXTENSIONS_DATA = {
  'social-media': [
    { name: 'Buffer', url: 'https://chrome.google.com/webstore/detail/buffer', description: 'Schedule posts across all social platforms', free: true },
    { name: 'Hootsuite', url: 'https://chrome.google.com/webstore/detail/hootsuite', description: 'Social media management dashboard', free: false },
    { name: 'Canva', url: 'https://chrome.google.com/webstore/detail/canva', description: 'Create stunning social graphics instantly', free: true }
  ],
  'seo-leads': [
    { name: 'SEOquake', url: 'https://chrome.google.com/webstore/detail/seoquake', description: 'Instant SEO metrics for any page', free: true },
    { name: 'Keywords Everywhere', url: 'https://chrome.google.com/webstore/detail/keywords-everywhere', description: 'See search volume on Google', free: false },
    { name: 'Hunter.io', url: 'https://chrome.google.com/webstore/detail/hunter', description: 'Find email addresses from any website', free: true },
    { name: 'Ubersuggest', url: 'https://chrome.google.com/webstore/detail/ubersuggest', description: 'SEO insights and keyword ideas', free: true }
  ],
  'ads-marketing': [
    { name: 'Facebook Pixel Helper', url: 'https://chrome.google.com/webstore/detail/facebook-pixel-helper', description: 'Debug your Facebook pixel', free: true },
    { name: 'Google Tag Assistant', url: 'https://chrome.google.com/webstore/detail/tag-assistant', description: 'Verify Google tags are working', free: true },
    { name: 'Adblock (for competitor research)', url: 'https://chrome.google.com/webstore/detail/adblock', description: 'See ads competitors are running', free: true }
  ],
  'automation': [
    { name: 'Bardeen', url: 'https://chrome.google.com/webstore/detail/bardeen', description: 'Automate any repetitive browser task', free: true },
    { name: 'Zapier', url: 'https://chrome.google.com/webstore/detail/zapier', description: 'Connect apps and automate workflows', free: true },
    { name: 'Data Scraper', url: 'https://chrome.google.com/webstore/detail/data-scraper', description: 'Extract data from web pages', free: true }
  ],
  'productivity': [
    { name: 'Notion Web Clipper', url: 'https://chrome.google.com/webstore/detail/notion-web-clipper', description: 'Save anything to Notion', free: true },
    { name: 'Loom', url: 'https://chrome.google.com/webstore/detail/loom', description: 'Record quick video messages', free: true },
    { name: 'Grammarly', url: 'https://chrome.google.com/webstore/detail/grammarly', description: 'Write better emails and docs', free: true },
    { name: 'Otter.ai', url: 'https://chrome.google.com/webstore/detail/otter', description: 'AI meeting notes & transcription', free: true }
  ],
  'research': [
    { name: 'Similar Web', url: 'https://chrome.google.com/webstore/detail/similarweb', description: 'Website traffic insights', free: true },
    { name: 'Wappalyzer', url: 'https://chrome.google.com/webstore/detail/wappalyzer', description: 'See what tech websites use', free: true },
    { name: 'ChatGPT for Google', url: 'https://chrome.google.com/webstore/detail/chatgpt-for-google', description: 'AI answers alongside search', free: true }
  ],
  'finance': [
    { name: 'DocuSign', url: 'https://chrome.google.com/webstore/detail/docusign', description: 'E-sign documents from browser', free: false },
    { name: 'Expensify', url: 'https://chrome.google.com/webstore/detail/expensify', description: 'Capture receipts instantly', free: true }
  ],
  'support': [
    { name: 'Intercom', url: 'https://chrome.google.com/webstore/detail/intercom', description: 'Customer messaging platform', free: false },
    { name: 'Zendesk', url: 'https://chrome.google.com/webstore/detail/zendesk', description: 'Support ticket management', free: false },
    { name: 'Tidio', url: 'https://chrome.google.com/webstore/detail/tidio', description: 'Live chat + AI chatbot', free: true }
  ]
};

// Custom GPTs mapped to problem categories
const CUSTOM_GPTS_DATA = {
  'content-creation': [
    { name: 'Canva GPT', url: 'https://chat.openai.com/g/canva', description: 'Design social posts with AI', rating: '4.8' },
    { name: 'Copywriter GPT', url: 'https://chat.openai.com/g/copywriter', description: 'Write converting ad copy', rating: '4.7' },
    { name: 'Video Script Writer', url: 'https://chat.openai.com/g/video-script', description: 'Scripts for YouTube & Reels', rating: '4.6' }
  ],
  'seo-marketing': [
    { name: 'SEO GPT', url: 'https://chat.openai.com/g/seo', description: 'Keyword research & optimization', rating: '4.8' },
    { name: 'Blog Post Generator', url: 'https://chat.openai.com/g/blog-generator', description: 'SEO-optimized articles', rating: '4.7' },
    { name: 'Landing Page Expert', url: 'https://chat.openai.com/g/landing-page', description: 'High-converting page copy', rating: '4.5' }
  ],
  'sales-leads': [
    { name: 'Cold Email GPT', url: 'https://chat.openai.com/g/cold-email', description: 'Personalized outreach emails', rating: '4.6' },
    { name: 'Sales Pitch Creator', url: 'https://chat.openai.com/g/sales-pitch', description: 'Compelling sales scripts', rating: '4.5' },
    { name: 'LinkedIn Outreach', url: 'https://chat.openai.com/g/linkedin-outreach', description: 'Professional connection messages', rating: '4.4' }
  ],
  'automation': [
    { name: 'Automation Expert', url: 'https://chat.openai.com/g/automation', description: 'Design workflow automations', rating: '4.7' },
    { name: 'Zapier Helper', url: 'https://chat.openai.com/g/zapier-helper', description: 'Build Zaps step by step', rating: '4.5' },
    { name: 'Excel Formula GPT', url: 'https://chat.openai.com/g/excel-formula', description: 'Complex formulas explained', rating: '4.8' }
  ],
  'data-analysis': [
    { name: 'Data Analyst GPT', url: 'https://chat.openai.com/g/data-analyst', description: 'Analyze data & create charts', rating: '4.9' },
    { name: 'SQL Expert', url: 'https://chat.openai.com/g/sql-expert', description: 'Write & optimize queries', rating: '4.7' },
    { name: 'Dashboard Designer', url: 'https://chat.openai.com/g/dashboard', description: 'Plan effective dashboards', rating: '4.5' }
  ],
  'legal-contracts': [
    { name: 'Contract Reviewer', url: 'https://chat.openai.com/g/contract-review', description: 'Spot risky clauses', rating: '4.6' },
    { name: 'Legal Document Drafter', url: 'https://chat.openai.com/g/legal-drafter', description: 'Draft basic agreements', rating: '4.5' }
  ],
  'hr-recruiting': [
    { name: 'Job Description Writer', url: 'https://chat.openai.com/g/job-description', description: 'Compelling job posts', rating: '4.7' },
    { name: 'Interview Question GPT', url: 'https://chat.openai.com/g/interview-questions', description: 'Role-specific questions', rating: '4.6' },
    { name: 'Resume Reviewer', url: 'https://chat.openai.com/g/resume-reviewer', description: 'Screen candidates faster', rating: '4.5' }
  ],
  'customer-support': [
    { name: 'Support Response GPT', url: 'https://chat.openai.com/g/support-response', description: 'Draft customer replies', rating: '4.6' },
    { name: 'FAQ Generator', url: 'https://chat.openai.com/g/faq-generator', description: 'Build knowledge bases', rating: '4.5' }
  ],
  'personal-productivity': [
    { name: 'Task Prioritizer', url: 'https://chat.openai.com/g/task-prioritizer', description: 'Organize your to-dos', rating: '4.7' },
    { name: 'Meeting Summarizer', url: 'https://chat.openai.com/g/meeting-summarizer', description: 'Notes from transcripts', rating: '4.8' },
    { name: 'Learning Coach', url: 'https://chat.openai.com/g/learning-coach', description: 'Personalized study plans', rating: '4.6' }
  ]
};

// Function to get relevant extensions based on category
const getRelevantExtensions = (category, goal) => {
  const categoryLower = (category || '').toLowerCase();
  const goalLower = (goal || '').toLowerCase();
  
  let extensions = [];
  
  if (categoryLower.includes('social') || categoryLower.includes('content') || categoryLower.includes('post')) {
    extensions = [...(CHROME_EXTENSIONS_DATA['social-media'] || [])];
  }
  if (categoryLower.includes('seo') || categoryLower.includes('lead') || categoryLower.includes('google')) {
    extensions = [...extensions, ...(CHROME_EXTENSIONS_DATA['seo-leads'] || [])];
  }
  if (categoryLower.includes('ad') || categoryLower.includes('marketing') || categoryLower.includes('roi')) {
    extensions = [...extensions, ...(CHROME_EXTENSIONS_DATA['ads-marketing'] || [])];
  }
  if (categoryLower.includes('automate') || categoryLower.includes('workflow') || goalLower.includes('save-time')) {
    extensions = [...extensions, ...(CHROME_EXTENSIONS_DATA['automation'] || [])];
  }
  if (categoryLower.includes('meeting') || categoryLower.includes('email') || categoryLower.includes('draft')) {
    extensions = [...extensions, ...(CHROME_EXTENSIONS_DATA['productivity'] || [])];
  }
  if (categoryLower.includes('competitor') || categoryLower.includes('research') || categoryLower.includes('trend')) {
    extensions = [...extensions, ...(CHROME_EXTENSIONS_DATA['research'] || [])];
  }
  if (categoryLower.includes('finance') || categoryLower.includes('invoice') || categoryLower.includes('expense')) {
    extensions = [...extensions, ...(CHROME_EXTENSIONS_DATA['finance'] || [])];
  }
  if (categoryLower.includes('support') || categoryLower.includes('ticket') || categoryLower.includes('chat')) {
    extensions = [...extensions, ...(CHROME_EXTENSIONS_DATA['support'] || [])];
  }
  
  // Deduplicate and limit
  const unique = [...new Map(extensions.map(e => [e.name, e])).values()];
  return unique.slice(0, 4);
};

// Function to get relevant GPTs based on category
const getRelevantGPTs = (category, goal, role) => {
  const categoryLower = (category || '').toLowerCase();
  const goalLower = (goal || '').toLowerCase();
  const roleLower = (role || '').toLowerCase();
  
  let gpts = [];
  
  if (categoryLower.includes('content') || categoryLower.includes('social') || categoryLower.includes('video')) {
    gpts = [...(CUSTOM_GPTS_DATA['content-creation'] || [])];
  }
  if (categoryLower.includes('seo') || categoryLower.includes('blog') || categoryLower.includes('landing')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['seo-marketing'] || [])];
  }
  if (categoryLower.includes('lead') || categoryLower.includes('sales') || categoryLower.includes('outreach')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['sales-leads'] || [])];
  }
  if (categoryLower.includes('automate') || categoryLower.includes('excel') || goalLower.includes('save-time')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['automation'] || [])];
  }
  if (categoryLower.includes('dashboard') || categoryLower.includes('data') || categoryLower.includes('analytics')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['data-analysis'] || [])];
  }
  if (categoryLower.includes('contract') || categoryLower.includes('legal') || roleLower.includes('legal')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['legal-contracts'] || [])];
  }
  if (categoryLower.includes('hire') || categoryLower.includes('interview') || categoryLower.includes('recruit') || roleLower.includes('hr')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['hr-recruiting'] || [])];
  }
  if (categoryLower.includes('support') || categoryLower.includes('ticket') || categoryLower.includes('customer')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['customer-support'] || [])];
  }
  if (goalLower.includes('personal') || categoryLower.includes('plan') || categoryLower.includes('learning')) {
    gpts = [...gpts, ...(CUSTOM_GPTS_DATA['personal-productivity'] || [])];
  }
  
  // Deduplicate and limit
  const unique = [...new Map(gpts.map(g => [g.name, g])).values()];
  return unique.slice(0, 3);
};

// Generate immediate action prompt based on context
const generateImmediatePrompt = (goal, role, category, requirement) => {
  const goalText = goal === 'grow-revenue' ? 'increase revenue' : 
                   goal === 'save-time' ? 'save time and automate' :
                   goal === 'better-decisions' ? 'make better decisions' : 'improve and grow';
  
  return `Act as my expert AI consultant. I need to ${goalText}.

**My Context:**
- Role: ${role || 'Business Professional'}
- Problem Area: ${category || 'General business improvement'}
- Specific Need: ${requirement || '[Describe your specific situation]'}

**Your Task:**
1. Analyze my situation and identify the TOP 3 quick wins I can implement TODAY
2. For each quick win, provide:
   - A clear 2-step action plan
   - Expected time to complete (be realistic)
   - Expected impact (low/medium/high)
3. Then suggest ONE longer-term solution worth investigating

Keep your response actionable and practical. No fluff - just tell me exactly what to do.`;
};

// ============================================
// Categories data structure based on CSV - Maps Goal + Role to Categories
// ============================================
const CATEGORIES_DATA = {
  'grow-revenue': {
    'founder-owner': [
      'Social media content (posts, ads, videos, product visuals)',
      'Get more leads from Google & website (SEO)',
      'Run Google and Meta ads + improve ROI',
      'Google Business Profile visibility',
      'Understanding why customers don\'t convert',
      'Selling on WhatsApp/Instagram',
      'Lead Qualification, Follow Up & Conversion',
      'Ecommerce Listing SEO + upsell bundles'
    ],
    'sales-marketing': [
      'Run Google and Meta ads + improve ROI',
      'Social media content (posts, ads, videos, product visuals)',
      'Get more leads from Google & website (SEO)',
      'Qualify & route leads automatically (AI SDR)',
      'Selling on WhatsApp/Instagram',
      'Improve Google Business Profile leads',
      'Write SEO Keyword, blogs and landing pages',
      'Write product titles that rank SEO',
      'Create ad creatives that convert',
      'Create upsell/cross-sell messaging'
    ],
    'ops-admin': [
      'Reduce missed leads with faster replies',
      'Improve order experience to boost repeats',
      'Call, Chat & Ticket Intelligence',
      'Smart CCTV: revenue/footfall insights (advanced)'
    ],
    'finance-legal': [
      'Spot profit leaks and improve margins',
      'Prevent revenue leakage from contracts (renewals, pricing, penalties)',
      'Speed up deal closure with faster contract review',
      'Sales & revenue forecasting'
    ],
    'hr-recruiting': [
      'Hire faster to support growth',
      'Find candidates faster (multi-source)',
      'Resume screening + shortlisting'
    ],
    'support-success': [
      'Improve retention and reduce churn',
      'Upsell/cross-sell recommendations',
      'Improve reviews and response quality',
      'Find why customers don\'t convert',
      'Call, Chat & Ticket Intelligence'
    ],
    'individual-student': [
      'Personal brand to get opportunities',
      'Business Idea Generation',
      'Trending Products'
    ]
  },
  'save-time': {
    'founder-owner': [
      'Automate lead capture into Sheets/CRM',
      'Draft proposals, quotes, and emails faster',
      'Extract data from PDFs/images to Sheets',
      'Automate procurement requests/approvals',
      '24/7 support assistant + escalation',
      'Automate order updates and tracking',
      'Summarize meetings + action items',
      'Automate HR or Finance'
    ],
    'sales-marketing': [
      'Auto-capture leads from forms/ads',
      'Mail + DM + influencer outreach automation',
      'Repurpose long videos into shorts',
      'Schedule posts + reuse content ideas',
      'Bulk update product listings/catalog',
      'Generate A+ store content at scale',
      'Auto-create weekly content calendar',
      'Auto-reply + follow-up sequences'
    ],
    'ops-admin': [
      'Automate repetitive admin workflows',
      'Excel and App script Automation',
      'Extract invoice/order data from PDFs',
      'Classify docs (invoice/contract/report)',
      'Auto-tag and organize documents',
      'Summarize meetings + send action items',
      'Automate procurement approvals',
      'Track orders + customer notifications',
      'Support ticket routing automation',
      'Smart CCTV: critical event alerts (advanced)'
    ],
    'finance-legal': [
      'Bookkeeping assistance + auto categorization',
      'Expense tracking + spend control automation',
      'Extract invoices/receipts from PDFs into Sheets',
      'Auto-generate client/vendor payment reminders',
      'Draft finance emails, reports, and summaries faster',
      'Extract key terms from contracts (payment, renewal, notice period)',
      'Automate contract approvals, renewals, and deadline reminders'
    ],
    'hr-recruiting': [
      'Automate interview scheduling',
      'Automate candidate follow-ups',
      'High-volume hiring coordination',
      'Onboarding checklists + HR support',
      'Draft job descriptions and outreach'
    ],
    'support-success': [
      '24/7 support assistant + escalation',
      'Auto-tag, route, and prioritize tickets',
      'Draft replies in brand voice',
      'Summarize calls/chats into CRM notes',
      'Build a support knowledge base',
      'WhatsApp/Instagram instant replies'
    ],
    'individual-student': [
      'Draft emails, reports, and proposals',
      'Summarize PDFs and long documents',
      'Extract data from PDFs/images',
      'Organize notes automatically'
    ]
  },
  'better-decisions': {
    'founder-owner': [
      'Instant sales dashboard (daily/weekly)',
      'Marketing performance dashboard (ROI)',
      'Build a knowledge base from SOPs',
      'Track competitors, pricing, and offers',
      'Market & industry trend summaries',
      'Predict demand & business outcomes',
      'Review sentiment → improvement ideas',
      'Churn & retention insights',
      'Cashflow + spend control dashboard'
    ],
    'sales-marketing': [
      'Campaign performance tracking dashboard',
      'Track calls, clicks, and form fills',
      'Call/chat/ticket insights from conversations',
      'Review sentiment + competitor comparisons',
      'Competitor monitoring & price alerts',
      'Market & trend research summaries',
      'Chat with past campaigns and assets'
    ],
    'ops-admin': [
      'Ops dashboard (orders, backlog, SLA)',
      'AI research summaries for decisions',
      'Predict demand and stock needs',
      'Supplier risk monitoring',
      'Delivery/logistics performance reporting',
      'Internal Q&A bot from SOPs/policies',
      'Industry best practice',
      'Customer Churn & Retention Insights'
    ],
    'finance-legal': [
      'Instant finance dashboard (monthly/weekly)',
      'Budget vs actual insights with variance alerts',
      'Cashflow forecast (30/60/90 days)',
      'Predict demand & business outcomes from past data',
      'Spend control alerts and trend insights',
      'Contract risk snapshot (high-risk clauses, obligations, renewals)',
      'Supplier risk and exposure tracking'
    ],
    'hr-recruiting': [
      'Hiring funnel dashboard',
      'Improve hire quality insights',
      'Interview feedback summaries',
      'HR knowledge base from policies',
      'Internal Q&A bot for HR queries',
      'Organize resumes and candidate notes'
    ],
    'support-success': [
      'Support SLA dashboard',
      'Call/chat/ticket intelligence insights',
      'Review sentiment + issue detection',
      'Churn & retention insights',
      'Brand monitoring & crisis alerts',
      'Search/chat across help docs',
      'Internal Q&A bot from SOPs'
    ],
    'individual-student': [
      'Weekly goals + progress summary',
      'Chat with your personal documents',
      'Auto-tag and organize your files',
      'Market & industry trend summaries'
    ]
  },
  'personal-growth': {
    'founder-owner': [
      'Plan weekly priorities and tasks',
      'Prep for pitches and presentations',
      'Personal branding content plan',
      'Create a learning plan + summaries',
      'Contract drafting & review support',
      'Team Spirit Action plan'
    ],
    'sales-marketing': [
      'Plan weekly priorities and tasks',
      'Prep for pitches and presentations',
      'Personal branding content plan',
      'Create a learning plan + summaries',
      'Contract drafting & review support',
      'Team Spirit Action plan'
    ],
    'ops-admin': [
      'Plan weekly priorities and tasks',
      'Prep for pitches and presentations',
      'Personal branding content plan',
      'Create a learning plan + summaries',
      'Contract drafting & review support',
      'Team Spirit Action plan'
    ],
    'finance-legal': [
      'Plan weekly priorities and tasks',
      'Prep for pitches and presentations',
      'Personal branding content plan',
      'Create a learning plan + summaries',
      'Contract drafting & review support',
      'Team Spirit Action plan'
    ],
    'hr-recruiting': [
      'Plan weekly priorities and tasks',
      'Interview prep + question practice',
      'Personal branding content plan',
      'Create a learning plan + summaries',
      'Contract drafting & review support',
      'Team Spirit Action plan'
    ],
    'support-success': [
      'Plan weekly priorities and tasks',
      'Prep for pitches and presentations',
      'Personal branding content plan',
      'Create a learning plan + summaries',
      'Contract drafting & review support',
      'Team Spirit Action plan'
    ],
    'individual-student': [
      'Plan weekly priorities and tasks',
      'Prep for pitches and presentations',
      'Personal branding content plan',
      'Create a learning plan + summaries',
      'Contract drafting & review support'
    ]
  }
};

// LocalStorage keys
const STORAGE_KEYS = {
  CHAT_HISTORY: 'ikshan-chat-history',
  USER_NAME: 'ikshan-user-name',
  USER_EMAIL: 'ikshan-user-email'
};

// Helper to safely parse JSON from localStorage
const getFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper to safely save to localStorage
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage might be full or disabled - fail silently
  }
};

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    onSubmit(name, email);
  };

  return (
    <div className="chat-identity-form">
      <form onSubmit={handleSubmit}>
        <div className="chat-form-group">
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            className="chat-identity-input"
          />
        </div>
        <div className="chat-form-group">
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="chat-identity-input"
          />
        </div>
        {error && <div className="chat-form-error">{error}</div>}
        <button type="submit" className="chat-action-btn primary">
          Continue →
        </button>
      </form>
    </div>
  );
};

const ChatBotNew = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      text: "✨ Welcome to Ikshan! 😊\n\nLet's find the perfect AI solution for you.",
      sender: 'bot',
      timestamp: new Date(),
      showGoalOptions: true
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubDomain, setSelectedSubDomain] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [requirement, setRequirement] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [flowStage, setFlowStage] = useState('goal');

  const [businessContext, setBusinessContext] = useState({
    businessType: null,
    industry: null,
    targetAudience: null,
    marketSegment: null
  });

  const [professionalContext, setProfessionalContext] = useState({
    roleAndIndustry: null,
    solutionFor: null,
    salaryContext: null
  });

  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dashboard view state
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    goalLabel: '',
    roleLabel: '',
    category: '',
    companies: [],
    extensions: [],
    customGPTs: [],
    immediatePrompt: ''
  });
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  // Load chat history from localStorage on mount
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = getFromStorage(STORAGE_KEYS.CHAT_HISTORY, []);
    // Convert timestamp strings back to Date objects
    return saved.map(chat => ({
      ...chat,
      timestamp: new Date(chat.timestamp),
      messages: chat.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  });
  
  // Persist chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      saveToStorage(STORAGE_KEYS.CHAT_HISTORY, chatHistory);
    }
  }, [chatHistory]);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
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
    { id: 'data-analysis', name: 'Data Analysis', emoji: '📊' },
    { id: 'other', name: 'Other', emoji: '✨' }
  ];

  const goalOptions = [
    { id: 'grow-revenue', text: 'Grow Revenue', emoji: '📈' },
    { id: 'save-time', text: 'Save Time', emoji: '⏱️' },
    { id: 'better-decisions', text: 'Make Better Decisions', emoji: '🎯' },
    { id: 'personal-growth', text: 'Personal Growth', emoji: '🚀' }
  ];

  const roleOptions = [
    { id: 'founder-owner', text: 'Founder / Owner', emoji: '👔' },
    { id: 'sales-marketing', text: 'Sales / Marketing', emoji: '📈' },
    { id: 'ops-admin', text: 'Ops / Admin', emoji: '⚙️' },
    { id: 'finance-legal', text: 'Finance / Legal', emoji: '💼' },
    { id: 'hr-recruiting', text: 'HR / Recruiting', emoji: '👥' },
    { id: 'support-success', text: 'Support / Success', emoji: '🎧' },
    { id: 'individual-student', text: 'Individual / Student', emoji: '📚' },
    { id: 'other-role', text: 'Other (Please type below)', emoji: '✏️' }
  ];

  // State for custom role input
  const [customRole, setCustomRole] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Get categories based on selected goal and role
  const getCategoriesForSelection = useCallback(() => {
    if (!selectedGoal || !userRole) return [];
    const roleKey = userRole === 'other-role' ? 'individual-student' : userRole;
    return CATEGORIES_DATA[selectedGoal]?.[roleKey] || [];
  }, [selectedGoal, userRole]);

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

  // Use unique ID generator instead of counter to prevent key conflicts
  const getNextMessageId = () => generateUniqueId();

  const scrollToBottom = () => {
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
        setIsRecording(false);
        // Provide user-friendly error messages
        switch (event.error) {
          case 'no-speech':
            setSpeechError('No speech detected. Please try again.');
            break;
          case 'not-allowed':
            setSpeechError('Microphone access denied. Please enable microphone permissions.');
            break;
          case 'network':
            setSpeechError('Network error. Please check your connection.');
            break;
          default:
            setSpeechError('Voice recognition failed. Please try again.');
        }
        // Auto-clear error after 3 seconds
        setTimeout(() => setSpeechError(null), 3000);
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

    setTimeout(() => clearInterval(checkGoogleLoaded), 5000);

    return () => clearInterval(checkGoogleLoaded);
  }, []);

  const handleGoogleSignIn = () => {
    if (!isGoogleLoaded || !window.google?.accounts?.id) {
      // Show error message instead of causing infinite reload loop
      const errorMessage = {
        id: generateUniqueId(),
        text: '⚠️ Google Sign-In is not available right now. You can continue without signing in.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowAuthModal(false);
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      // Show configuration error instead of reloading
      const errorMessage = {
        id: generateUniqueId(),
        text: '⚠️ Sign-in is not configured. Please continue without signing in.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowAuthModal(false);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
    });

    window.google.accounts.id.prompt();
  };

  const handleGoogleCallback = (response) => {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    setUserName(payload.name);
    setUserEmail(payload.email);
    setShowAuthModal(false);

    setSelectedDomain(null);
    setSelectedSubDomain(null);
    setUserRole(null);
    setRequirement(null);
    setBusinessContext({
      businessType: null,
      industry: null,
      targetAudience: null,
      marketSegment: null
    });
    setProfessionalContext({
      roleAndIndustry: null,
      solutionFor: null,
      salaryContext: null
    });
    setFlowStage('domain');

    const botMessage = {
      id: messageIdCounter.current++,
      text: `Welcome back, ${payload.name}! 🚀\n\nLet's explore another idea. Pick a domain to get started:`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const handleStartNewIdea = () => {
    // Save current chat to history if there are messages beyond the initial welcome
    if (messages.length > 1) {
      const userMessages = messages.filter(m => m.sender === 'user');
      const goalLabel = goalOptions.find(g => g.id === selectedGoal)?.text || '';
      const chatTitle = goalLabel || userMessages[0]?.text?.slice(0, 30) || 'New Chat';
      const lastUserMessage = userMessages[userMessages.length - 1]?.text || '';
      
      const newHistoryItem = {
        id: `chat-${Date.now()}`,
        title: chatTitle,
        preview: lastUserMessage.slice(0, 80) + (lastUserMessage.length > 80 ? '...' : ''),
        timestamp: new Date(),
        domain: selectedCategory || 'General',
        messages: [...messages]
      };
      
      setChatHistory(prev => [newHistoryItem, ...prev]);
    }

    // Reset all state for new chat
    setSelectedGoal(null);
    setSelectedDomain(null);
    setSelectedSubDomain(null);
    setUserRole(null);
    setRequirement(null);
    setUserName(null);
    setUserEmail(null);
    setCustomRole('');
    setSelectedCategory(null);
    setCustomCategoryInput('');
    setBusinessContext({
      businessType: null,
      industry: null,
      targetAudience: null,
      marketSegment: null
    });
    setProfessionalContext({
      roleAndIndustry: null,
      solutionFor: null,
      salaryContext: null
    });
    setFlowStage('goal');
    setShowDashboard(false);
    setDashboardData({
      goalLabel: '',
      roleLabel: '',
      category: '',
      companies: [],
      extensions: [],
      customGPTs: [],
      immediatePrompt: ''
    });
    setCopiedPrompt(false);

    // Start fresh with welcome message
    const welcomeMessage = {
      id: getNextMessageId(),
      text: "✨ Welcome to Ikshan! 😊\n\nLet's find the perfect AI solution for you.",
      sender: 'bot',
      timestamp: new Date(),
      showGoalOptions: true
    };
    setMessages([welcomeMessage]);
  };

  // Handle goal selection (Question 1)
  const handleGoalClick = (goal) => {
    setSelectedGoal(goal.id);

    const userMessage = {
      id: getNextMessageId(),
      text: `${goal.emoji} ${goal.text}`,
      sender: 'user',
      timestamp: new Date()
    };

    const botMessage = {
      id: getNextMessageId(),
      text: `Great choice! You want to **${goal.text.toLowerCase()}**. 🎯\n\nNow, which best describes you?`,
      sender: 'bot',
      timestamp: new Date(),
      showRoleOptions: true
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setFlowStage('role');

    saveToSheet(`Selected Goal: ${goal.text}`, '', '', '');
  };

  // Handle role selection (Question 2)
  const handleRoleClick = (role) => {
    setUserRole(role.id);

    const userMessage = {
      id: getNextMessageId(),
      text: `${role.emoji} ${role.text}`,
      sender: 'user',
      timestamp: new Date()
    };

    if (role.id === 'other-role') {
      // Show input for custom role
      setFlowStage('custom-role');
      const botMessage = {
        id: getNextMessageId(),
        text: `No problem! Please tell us your role:\n\n**Type your role below:**`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage, botMessage]);
    } else {
      // Show categories based on goal + role
      setFlowStage('category');
      const categories = CATEGORIES_DATA[selectedGoal]?.[role.id] || [];
      const botMessage = {
        id: getNextMessageId(),
        text: `Perfect! 🎯\n\nBased on your selection, here are the categories where your problems might fall:\n\n**Select one that best matches your need:**`,
        sender: 'bot',
        timestamp: new Date(),
        showCategoryOptions: true,
        categories: categories
      };
      setMessages(prev => [...prev, userMessage, botMessage]);
    }

    saveToSheet(`User Role: ${role.text}`, '', '', '');
  };

  // Handle custom role submission
  const handleCustomRoleSubmit = (customRoleText) => {
    setCustomRole(customRoleText);

    const userMessage = {
      id: getNextMessageId(),
      text: customRoleText,
      sender: 'user',
      timestamp: new Date()
    };

    // Use individual-student categories as fallback for custom roles
    setFlowStage('category');
    const categories = CATEGORIES_DATA[selectedGoal]?.['individual-student'] || [];
    const botMessage = {
      id: getNextMessageId(),
      text: `Thanks! As a **${customRoleText}**, here are some categories that might help:\n\n**Select one that best matches your need:**`,
      sender: 'bot',
      timestamp: new Date(),
      showCategoryOptions: true,
      categories: categories
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    saveToSheet(`Custom Role: ${customRoleText}`, '', '', '');
  };

  // Handle category selection (Question 3) - Go directly to solution
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);

    const userMessage = {
      id: getNextMessageId(),
      text: `📌 ${category}`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    saveToSheet(`Selected Category: ${category}`, '', '', '');
    
    // Directly show solution
    showSolutionStack(category);
  };

  // Handle "Type here" button click - skip category selection
  const handleTypeCustomProblem = () => {
    const userMessage = {
      id: getNextMessageId(),
      text: `✏️ I'll describe my problem`,
      sender: 'user',
      timestamp: new Date()
    };

    // For custom problems, still ask for details
    setFlowStage('requirement');
    const botMessage = {
      id: getNextMessageId(),
      text: `No problem! 🚀\n\n**Please describe what you're trying to achieve or the problem you want to solve:**\n\n_(Tell me in 2-3 lines so I can find the best solutions for you)_`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    saveToSheet(`User chose to type custom problem`, '', '', '');
  };

  // Show solution stack directly after category selection - CHAT VERSION (Stage 1 Format)
  const showSolutionStack = async (category) => {
    setFlowStage('complete');
    setIsTyping(true);

    try {
      // Get goal and role labels for display
      const goalLabel = goalOptions.find(g => g.id === selectedGoal)?.text || selectedGoal;
      const roleLabel = roleOptions.find(r => r.id === userRole)?.text || customRole || userRole;
      
      // Search for relevant companies from CSV
      let relevantCompanies = [];
      try {
        const searchResponse = await fetch('/api/search-companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: category,
            subdomain: category,
            requirement: category,
            goal: selectedGoal,
            role: userRole,
            userContext: {
              goal: selectedGoal,
              role: userRole,
              category: category
            }
          })
        });
        const searchData = await searchResponse.json();
        relevantCompanies = (searchData.companies || []).slice(0, 3);
      } catch (e) {
        console.log('Company search failed, using fallback');
        relevantCompanies = [
          { name: 'Bardeen', problem: 'Automate any browser workflow with AI', differentiator: 'No-code browser automation' },
          { name: 'Zapier', problem: 'Connect 5000+ apps without code', differentiator: 'Largest integration library' },
          { name: 'Make (Integromat)', problem: 'Visual automation builder', differentiator: 'Complex workflow scenarios' }
        ];
      }
      
      // Get relevant Chrome extensions and GPTs
      let extensions = getRelevantExtensions(category, selectedGoal);
      let customGPTs = getRelevantGPTs(category, selectedGoal, userRole);
      
      // Use fallbacks if empty
      if (extensions.length === 0) {
        extensions = [
          { name: 'Bardeen', description: 'Automate browser tasks with AI', free: true, source: 'Chrome Web Store' },
          { name: 'Notion Web Clipper', description: 'Save anything instantly', free: true, source: 'Chrome Web Store' },
          { name: 'Grammarly', description: 'Write better emails & docs', free: true, source: 'Chrome Web Store' }
        ];
      }
      
      if (customGPTs.length === 0) {
        customGPTs = [
          { name: 'Task Prioritizer GPT', description: 'Organize your to-dos efficiently', rating: '4.7' },
          { name: 'Data Analyst GPT', description: 'Analyze data & create charts', rating: '4.9' },
          { name: 'Automation Expert GPT', description: 'Design smart workflows', rating: '4.7' }
        ];
      }
      
      if (relevantCompanies.length === 0) {
        relevantCompanies = [
          { name: 'Bardeen', problem: 'Automate any browser workflow with AI', differentiator: 'No-code browser automation' },
          { name: 'Zapier', problem: 'Connect 5000+ apps without code', differentiator: 'Largest integration library' },
          { name: 'Make (Integromat)', problem: 'Visual automation builder', differentiator: 'Complex workflow scenarios' }
        ];
      }
      
      // Generate the immediate action prompt
      const immediatePrompt = generateImmediatePrompt(selectedGoal, roleLabel, category, category);

      // Build Stage 1 Desired Output Format - Chat Response
      let solutionResponse = `## 🎯 Recommended Solution Pathways (Immediate Action)\n\n`;
      solutionResponse += `I recommend the following solution pathways that you can start implementing immediately, based on your current setup and goals.\n\n`;
      solutionResponse += `---\n\n`;

      // Section 1: Tools & Extensions (If Google Workspace Is Your Main Stack)
      solutionResponse += `## 🔌 If Google Tools / Google Workspace Is Your Main Stack\n\n`;
      solutionResponse += `If Google Workspace is your primary tool stack, here are some tools and extensions that integrate well and can be implemented quickly.\n\n`;
      solutionResponse += `### Tools & Extensions\n\n`;
      
      extensions.slice(0, 3).forEach((ext) => {
        const freeTag = ext.free ? '🆓 Free' : '💰 Paid';
        solutionResponse += `**🔧 ${ext.name}** ${freeTag}\n`;
        solutionResponse += `> **Where this helps:** ${ext.description}\n`;
        solutionResponse += `> **Where to find:** ${ext.source || 'Chrome Web Store / Official Website'}\n\n`;
      });

      solutionResponse += `---\n\n`;

      // Section 2: Custom GPTs
      solutionResponse += `## 🤖 Using Custom GPTs for Task Automation & Decision Support\n\n`;
      solutionResponse += `You can also leverage Custom GPTs to automate repetitive thinking tasks, research, analysis, and execution support.\n\n`;
      solutionResponse += `### Custom GPTs\n\n`;
      
      customGPTs.slice(0, 3).forEach((gpt) => {
        solutionResponse += `**🧠 ${gpt.name}** ⭐${gpt.rating}\n`;
        solutionResponse += `> **What this GPT does:** ${gpt.description}\n\n`;
      });

      solutionResponse += `---\n\n`;

      // Section 3: AI Companies
      solutionResponse += `## 🚀 AI Companies Offering Ready-Made Solutions\n\n`;
      solutionResponse += `If you are looking for AI-powered tools and well-structured, ready-made solutions, here are companies whose products align with your needs.\n\n`;
      solutionResponse += `### AI Solution Providers\n\n`;
      
      relevantCompanies.slice(0, 3).forEach((company) => {
        solutionResponse += `**🏢 ${company.name}**\n`;
        solutionResponse += `> **What they do:** ${company.problem || company.description || 'AI-powered solution for your needs'}\n\n`;
      });

      solutionResponse += `---\n\n`;

      // Section 4: How to Use This Framework
      solutionResponse += `### 📋 How to Use This Framework\n\n`;
      solutionResponse += `1. **Start with Google Workspace tools** for quick wins\n`;
      solutionResponse += `2. **Add Custom GPTs** for intelligence and automation\n`;
      solutionResponse += `3. **Scale using specialized AI companies** when workflows mature\n\n`;
      
      solutionResponse += `---\n\n`;
      solutionResponse += `### What would you like to do next?`;

      const finalOutput = {
        id: getNextMessageId(),
        text: solutionResponse,
        sender: 'bot',
        timestamp: new Date(),
        showFinalActions: true,
        showCopyPrompt: true,
        immediatePrompt: immediatePrompt,
        companies: relevantCompanies,
        extensions: extensions,
        customGPTs: customGPTs,
        userRequirement: category
      };

      setMessages(prev => [...prev, finalOutput]);
      setIsTyping(false);

      saveToSheet('Solution Stack Generated', `Goal: ${goalLabel}, Role: ${roleLabel}, Category: ${category}`, category, category);
    } catch (error) {
      console.error('Error generating solution stack:', error);

      // Fallback response with Stage 1 format
      const goalLabel = goalOptions.find(g => g.id === selectedGoal)?.text || selectedGoal;
      const roleLabel = roleOptions.find(r => r.id === userRole)?.text || customRole || userRole;
      const fallbackPrompt = generateImmediatePrompt(selectedGoal, roleLabel, category, category);
      
      let fallbackResponse = `## 🎯 Recommended Solution Pathways (Immediate Action)\n\n`;
      fallbackResponse += `I recommend the following solution pathways that you can start implementing immediately.\n\n`;
      fallbackResponse += `---\n\n`;
      
      fallbackResponse += `## 🔌 If Google Tools / Google Workspace Is Your Main Stack\n\n`;
      fallbackResponse += `### Tools & Extensions\n\n`;
      fallbackResponse += `**🔧 Bardeen** 🆓 Free\n`;
      fallbackResponse += `> **Where this helps:** Automate browser tasks with AI\n`;
      fallbackResponse += `> **Where to find:** Chrome Web Store\n\n`;
      fallbackResponse += `**🔧 Notion Web Clipper** 🆓 Free\n`;
      fallbackResponse += `> **Where this helps:** Save anything instantly\n`;
      fallbackResponse += `> **Where to find:** Chrome Web Store\n\n`;
      fallbackResponse += `**🔧 Grammarly** 🆓 Free\n`;
      fallbackResponse += `> **Where this helps:** Write better emails & docs\n`;
      fallbackResponse += `> **Where to find:** Chrome Web Store\n\n`;
      
      fallbackResponse += `---\n\n`;
      fallbackResponse += `## 🤖 Using Custom GPTs for Task Automation & Decision Support\n\n`;
      fallbackResponse += `### Custom GPTs\n\n`;
      fallbackResponse += `**🧠 Data Analyst GPT** ⭐4.9\n`;
      fallbackResponse += `> **What this GPT does:** Analyze your data & create charts\n\n`;
      fallbackResponse += `**🧠 Task Prioritizer GPT** ⭐4.7\n`;
      fallbackResponse += `> **What this GPT does:** Plan and organize your work\n\n`;
      
      fallbackResponse += `---\n\n`;
      fallbackResponse += `## 🚀 AI Companies Offering Ready-Made Solutions\n\n`;
      fallbackResponse += `### AI Solution Providers\n\n`;
      fallbackResponse += `**🏢 Bardeen**\n`;
      fallbackResponse += `> **What they do:** Automate any browser workflow with AI\n\n`;
      fallbackResponse += `**🏢 Zapier**\n`;
      fallbackResponse += `> **What they do:** Connect 5000+ apps without code\n\n`;
      
      fallbackResponse += `---\n\n`;
      fallbackResponse += `### 📋 How to Use This Framework\n\n`;
      fallbackResponse += `1. **Start with Google Workspace tools** for quick wins\n`;
      fallbackResponse += `2. **Add Custom GPTs** for intelligence and automation\n`;
      fallbackResponse += `3. **Scale using specialized AI companies** when workflows mature\n\n`;
      fallbackResponse += `---\n\n### What would you like to do next?`;

      const fallbackOutput = {
        id: getNextMessageId(),
        text: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
        showFinalActions: true,
        showCopyPrompt: true,
        immediatePrompt: fallbackPrompt,
        userRequirement: category
      };

      setMessages(prev => [...prev, fallbackOutput]);
      setIsTyping(false);
    }
  };

  // Handle explore implementation - switch to chat mode
  const handleExploreImplementation = () => {
    setShowDashboard(false);
    
    // Add context message to chat
    const contextMessage = {
      id: getNextMessageId(),
      text: `Great! Let's explore how to implement solutions for **${dashboardData.category}**.\n\nI can help you with:\n- Setting up the recommended tools\n- Step-by-step implementation guides\n- Integration tips and best practices\n\n**What would you like to learn more about?**`,
      sender: 'bot',
      timestamp: new Date(),
      showFinalActions: true,
      companies: dashboardData.companies,
      userRequirement: dashboardData.category
    };

    setMessages(prev => [...prev, contextMessage]);
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(dashboardData.immediatePrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle custom category input
  const handleCustomCategorySubmit = (customText) => {
    setSelectedCategory(customText);
    setCustomCategoryInput('');

    const userMessage = {
      id: getNextMessageId(),
      text: `📝 ${customText}`,
      sender: 'user',
      timestamp: new Date()
    };

    setFlowStage('requirement');
    const botMessage = {
      id: getNextMessageId(),
      text: `Got it! 🚀\n\nYou're looking to work on: **${customText}**\n\n**Please share more details about your specific problem:**\n\n_(Tell me in 2-3 lines so I can find the best solutions for you)_`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    saveToSheet(`Custom Category: ${customText}`, '', '', '');
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

  // Legacy domain/subdomain handlers - kept for backward compatibility but not used in new flow
  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
    // Domain selection is no longer part of main flow, but kept for potential future use
    saveToSheet(`Selected Domain: ${domain.name}`, '', domain.name, '');
  };

  const handleSubDomainClick = (subDomain) => {
    setSelectedSubDomain(subDomain);
    saveToSheet(`Selected Sub-domain: ${subDomain}`, '', selectedDomain?.name, subDomain);
  };

  const handleRoleQuestion = (answer) => {
    const userMessage = {
      id: getNextMessageId(),
      text: answer,
      sender: 'user',
      timestamp: new Date()
    };

    // Simplified role question handling for new flow
    setFlowStage('requirement');
    const botMessage = {
      id: getNextMessageId(),
      text: `Got it! 👍\n\n**What specific problem are you trying to solve right now?**\n\n_(Tell me in 2-3 lines what challenge you're facing and what success would look like for you)_`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage, botMessage]);
    saveToSheet(`Role Question Answer: ${answer}`, '', '', '');
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

  const handleLearnImplementation = async (companies, userRequirement) => {
    setIsTyping(true);

    const loadingMessage = {
      id: getNextMessageId(),
      text: "Let me put together a comprehensive implementation guide with practical steps you can start using right away...",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

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

    const contextForPrompts = userRole?.id === 'business-owner'
      ? `I run a ${businessType} in the ${industry} industry. My target audience is ${targetAudience} and I serve ${marketSegment}.`
      : userRole?.id === 'professional'
      ? `I'm a ${roleAndIndustry}. I'm looking for a solution ${solutionFor}.`
      : userRole?.id === 'freelancer'
      ? `I'm a freelancer doing ${businessType}. My main challenge is ${targetAudience}.`
      : `I'm exploring solutions in ${domainName}.`;

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

💡 **Pro tip:** Run Prompt 1 first to clarify your problem. You'll have real, usable outputs within 30 minutes!
`;

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      const guideHeader = `## 🚀 Your Implementation Guide for ${topTool?.name || 'Your Solution'}

### 1️⃣ Where This Fits in Your Workflow

This solution helps at the **${subDomainName}** stage of your ${domainName} operations.

### 2️⃣ What to Prepare Before You Start (Checklist)

- ☐ **3-5 example documents/data** you currently work with
- ☐ **Current workflow steps** written out
- ☐ **Edge cases list** - situations that don't fit the norm
- ☐ **Success metric** - What does "solved" look like?
- ☐ **Constraints** - Budget, timeline, compliance requirements
`;

      if (!apiKey) {
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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `Create a brief implementation guide for ${topTool?.name || 'the solution'}` },
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
      text: `Thank you, ${name}! 🎯\n\nAnalyzing your requirements and finding the best solutions...`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(true);

    await saveToSheet(`User Identity: ${name} (${email})`, '', selectedCategory, requirement);

    setTimeout(async () => {
      try {
        // Get goal and role labels for display
        const goalLabel = goalOptions.find(g => g.id === selectedGoal)?.text || selectedGoal;
        const roleLabel = roleOptions.find(r => r.id === userRole)?.text || customRole || userRole;
        
        // Search for relevant companies from CSV
        const searchResponse = await fetch('/api/search-companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            domain: selectedCategory,
            subdomain: selectedCategory,
            requirement: requirement,
            goal: selectedGoal,
            role: userRole,
            userContext: {
              goal: selectedGoal,
              role: userRole,
              category: selectedCategory
            }
          })
        });

        const searchData = await searchResponse.json();
        let relevantCompanies = (searchData.companies || []).slice(0, 3);
        
        // Get relevant Chrome extensions and GPTs
        let extensions = getRelevantExtensions(selectedCategory, selectedGoal);
        let customGPTs = getRelevantGPTs(selectedCategory, selectedGoal, userRole);
        
        // Use fallbacks if empty
        if (extensions.length === 0) {
          extensions = [
            { name: 'Bardeen', description: 'Automate browser tasks with AI', free: true, source: 'Chrome Web Store' },
            { name: 'Notion Web Clipper', description: 'Save anything instantly', free: true, source: 'Chrome Web Store' },
            { name: 'Grammarly', description: 'Write better emails & docs', free: true, source: 'Chrome Web Store' }
          ];
        }
        
        if (customGPTs.length === 0) {
          customGPTs = [
            { name: 'Task Prioritizer GPT', description: 'Organize your to-dos efficiently', rating: '4.7' },
            { name: 'Data Analyst GPT', description: 'Analyze data & create charts', rating: '4.9' },
            { name: 'Automation Expert GPT', description: 'Design smart workflows', rating: '4.7' }
          ];
        }
        
        if (relevantCompanies.length === 0) {
          relevantCompanies = [
            { name: 'Bardeen', problem: 'Automate any browser workflow with AI', differentiator: 'No-code browser automation' },
            { name: 'Zapier', problem: 'Connect 5000+ apps without code', differentiator: 'Largest integration library' },
            { name: 'Make (Integromat)', problem: 'Visual automation builder', differentiator: 'Complex workflow scenarios' }
          ];
        }
        
        // Generate the immediate action prompt
        const immediatePrompt = generateImmediatePrompt(selectedGoal, roleLabel, selectedCategory, requirement);

        // Build Stage 1 Desired Output Format - Chat Response
        let solutionResponse = `## 🎯 Recommended Solution Pathways (Immediate Action)\n\n`;
        solutionResponse += `I recommend the following solution pathways that you can start implementing immediately, based on your current setup and goals.\n\n`;
        solutionResponse += `---\n\n`;

        // Section 1: Tools & Extensions (If Google Workspace Is Your Main Stack)
        solutionResponse += `## 🔌 If Google Tools / Google Workspace Is Your Main Stack\n\n`;
        solutionResponse += `If Google Workspace is your primary tool stack, here are some tools and extensions that integrate well and can be implemented quickly.\n\n`;
        solutionResponse += `### Tools & Extensions\n\n`;
        
        extensions.slice(0, 3).forEach((ext) => {
          const freeTag = ext.free ? '🆓 Free' : '💰 Paid';
          solutionResponse += `**🔧 ${ext.name}** ${freeTag}\n`;
          solutionResponse += `> **Where this helps:** ${ext.description}\n`;
          solutionResponse += `> **Where to find:** ${ext.source || 'Chrome Web Store / Official Website'}\n\n`;
        });

        solutionResponse += `---\n\n`;

        // Section 2: Custom GPTs
        solutionResponse += `## 🤖 Using Custom GPTs for Task Automation & Decision Support\n\n`;
        solutionResponse += `You can also leverage Custom GPTs to automate repetitive thinking tasks, research, analysis, and execution support.\n\n`;
        solutionResponse += `### Custom GPTs\n\n`;
        
        customGPTs.slice(0, 3).forEach((gpt) => {
          solutionResponse += `**🧠 ${gpt.name}** ⭐${gpt.rating}\n`;
          solutionResponse += `> **What this GPT does:** ${gpt.description}\n\n`;
        });

        solutionResponse += `---\n\n`;

        // Section 3: AI Companies
        solutionResponse += `## 🚀 AI Companies Offering Ready-Made Solutions\n\n`;
        solutionResponse += `If you are looking for AI-powered tools and well-structured, ready-made solutions, here are companies whose products align with your needs.\n\n`;
        solutionResponse += `### AI Solution Providers\n\n`;
        
        relevantCompanies.slice(0, 3).forEach((company) => {
          solutionResponse += `**🏢 ${company.name}**\n`;
          solutionResponse += `> **What they do:** ${company.problem || company.description || 'AI-powered solution for your needs'}\n\n`;
        });

        solutionResponse += `---\n\n`;

        // Section 4: How to Use This Framework
        solutionResponse += `### 📋 How to Use This Framework\n\n`;
        solutionResponse += `1. **Start with Google Workspace tools** for quick wins\n`;
        solutionResponse += `2. **Add Custom GPTs** for intelligence and automation\n`;
        solutionResponse += `3. **Scale using specialized AI companies** when workflows mature\n\n`;
        
        solutionResponse += `---\n\n`;
        solutionResponse += `### What would you like to do next?`;

        const finalOutput = {
          id: getNextMessageId(),
          text: solutionResponse,
          sender: 'bot',
          timestamp: new Date(),
          showFinalActions: true,
          showCopyPrompt: true,
          immediatePrompt: immediatePrompt,
          companies: relevantCompanies,
          extensions: extensions,
          customGPTs: customGPTs,
          userRequirement: requirement
        };

        setMessages(prev => [...prev, finalOutput]);
        setIsTyping(false);
        setFlowStage('complete');

        saveToSheet('Solution Stack Generated', `Goal: ${selectedGoal}, Role: ${userRole}, Category: ${selectedCategory}`, selectedCategory, requirement);
      } catch (error) {
        console.error('Error generating solution stack:', error);

        // Fallback response with Stage 1 format
        const goalLabel = goalOptions.find(g => g.id === selectedGoal)?.text || selectedGoal;
        const roleLabel = roleOptions.find(r => r.id === userRole)?.text || customRole || userRole;
        const fallbackPrompt = generateImmediatePrompt(selectedGoal, roleLabel, selectedCategory, requirement);
        
        let fallbackResponse = `## 🎯 Recommended Solution Pathways (Immediate Action)\n\n`;
        fallbackResponse += `I recommend the following solution pathways that you can start implementing immediately.\n\n`;
        fallbackResponse += `---\n\n`;
        
        fallbackResponse += `## 🔌 If Google Tools / Google Workspace Is Your Main Stack\n\n`;
        fallbackResponse += `### Tools & Extensions\n\n`;
        fallbackResponse += `**🔧 Bardeen** 🆓 Free\n`;
        fallbackResponse += `> **Where this helps:** Automate browser tasks with AI\n`;
        fallbackResponse += `> **Where to find:** Chrome Web Store\n\n`;
        fallbackResponse += `**🔧 Notion Web Clipper** 🆓 Free\n`;
        fallbackResponse += `> **Where this helps:** Save anything instantly\n`;
        fallbackResponse += `> **Where to find:** Chrome Web Store\n\n`;
        fallbackResponse += `**🔧 Grammarly** 🆓 Free\n`;
        fallbackResponse += `> **Where this helps:** Write better emails & docs\n`;
        fallbackResponse += `> **Where to find:** Chrome Web Store\n\n`;
        
        fallbackResponse += `---\n\n`;
        fallbackResponse += `## 🤖 Using Custom GPTs for Task Automation & Decision Support\n\n`;
        fallbackResponse += `### Custom GPTs\n\n`;
        fallbackResponse += `**🧠 Data Analyst GPT** ⭐4.9\n`;
        fallbackResponse += `> **What this GPT does:** Analyze your data & create charts\n\n`;
        fallbackResponse += `**🧠 Task Prioritizer GPT** ⭐4.7\n`;
        fallbackResponse += `> **What this GPT does:** Plan and organize your work\n\n`;
        
        fallbackResponse += `---\n\n`;
        fallbackResponse += `## 🚀 AI Companies Offering Ready-Made Solutions\n\n`;
        fallbackResponse += `### AI Solution Providers\n\n`;
        fallbackResponse += `**🏢 Bardeen**\n`;
        fallbackResponse += `> **What they do:** Automate any browser workflow with AI\n\n`;
        fallbackResponse += `**🏢 Zapier**\n`;
        fallbackResponse += `> **What they do:** Connect 5000+ apps without code\n\n`;
        
        fallbackResponse += `---\n\n`;
        fallbackResponse += `### 📋 How to Use This Framework\n\n`;
        fallbackResponse += `1. **Start with Google Workspace tools** for quick wins\n`;
        fallbackResponse += `2. **Add Custom GPTs** for intelligence and automation\n`;
        fallbackResponse += `3. **Scale using specialized AI companies** when workflows mature\n\n`;
        fallbackResponse += `---\n\n### What would you like to do next?`;

        const fallbackOutput = {
          id: getNextMessageId(),
          text: fallbackResponse,
          sender: 'bot',
          timestamp: new Date(),
          showFinalActions: true,
          showCopyPrompt: true,
          immediatePrompt: fallbackPrompt,
          userRequirement: requirement
        };

        setMessages(prev => [...prev, fallbackOutput]);
        setIsTyping(false);
        setFlowStage('complete');
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

    if (flowStage === 'domain') {
      const inputLower = currentInput.toLowerCase().trim();
      const matchedDomain = domains.find(d =>
        d.name.toLowerCase() === inputLower ||
        d.id.toLowerCase() === inputLower ||
        d.name.toLowerCase().includes(inputLower) ||
        inputLower.includes(d.name.toLowerCase())
      );

      if (matchedDomain) {
        handleDomainClick(matchedDomain);
        return;
      }

      setIsTyping(true);

      try {
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

        const botMessage = {
          id: getNextMessageId(),
          text: `${aiAnswer}\n\nNow, to help you find the right business solution, please select a domain from the options below:`,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error calling AI:', error);

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

    if (flowStage === 'subdomain') {
      const inputLower = currentInput.toLowerCase().trim();
      const availableSubDomains = subDomains[selectedDomain?.id] || [];
      const matchedSubDomain = availableSubDomains.find(sd =>
        sd.toLowerCase() === inputLower ||
        sd.toLowerCase().includes(inputLower) ||
        inputLower.includes(sd.toLowerCase())
      );

      if (matchedSubDomain) {
        handleSubDomainClick(matchedSubDomain);
        return;
      }

      setIsTyping(true);

      try {
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

        const botMessage = {
          id: getNextMessageId(),
          text: `${aiAnswer}\n\nNow, please choose a specific area from the options below:`,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error calling AI:', error);

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

    if (flowStage === 'other-domain') {
      setSelectedDomain({ id: 'other', name: currentInput, emoji: '✨' });
      setSelectedSubDomain(currentInput);
      setFlowStage('role');

      const botMessage = {
        id: getNextMessageId(),
        text: `Got it! **${currentInput}** - that's interesting! 🎯\n\nNow tell me a bit about yourself:`,
        sender: 'bot',
        timestamp: new Date(),
        showRoleOptions: true
      };

      setMessages(prev => [...prev, botMessage]);
      saveToSheet(`Custom Domain: ${currentInput}`, '', currentInput, currentInput);
      return;
    }

    if (flowStage.startsWith('role-q')) {
      setMessages(prev => prev.slice(0, -1));
      handleRoleQuestion(currentInput);
      return;
    }

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
      saveToSheet(`Requirement: ${currentInput}`, '', selectedDomain?.name, selectedSubDomain);
      return;
    }

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

    if (flowStage === 'complete') {
      const botMessage = {
        id: getNextMessageId(),
        text: `Great! Feel free to explore more AI tools for different needs. Just click the button below to check another idea! 🚀`,
        sender: 'bot',
        timestamp: new Date(),
        showFinalActions: true
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

  const formatHistoryTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLoadChat = (chat) => {
    setMessages(chat.messages);
    setShowChatHistory(false);
    setFlowStage('complete');
  };

  return (
    <div className="chatbot-new-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-header-logo">
          <img src="/logo iskan 5.svg" alt="Ikshan Logo" className="mobile-logo-icon" />
          <span className="mobile-logo-title">Ikshan</span>
        </div>
        <button 
          className="mobile-history-btn" 
          onClick={() => setShowChatHistory(!showChatHistory)}
          aria-label="Chat history"
        >
          <History size={22} />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Desktop Header */}
      <header className="chatbot-new-header">
        <div className="header-logo-container">
          <img src="/logo iskan 5.svg" alt="Ikshan Logo" className="header-logo-icon" />
          <span className="header-logo-title">Ikshan</span>
        </div>
        <div className="header-nav-container">
          <h1 className="header-nav-title">Products Of Ikshan</h1>
          <div className="header-nav-marquee">
            <div className="header-nav-icons">
              <button className="nav-product-btn" aria-label="Ecom Listing Optimizer">
                <ShoppingCart size={20} />
                <span>Ecom Listing Optimizer</span>
              </button>
              <button className="nav-product-btn" aria-label="Legal Doc Classifier">
                <Scale size={20} />
                <span>Legal Doc Classifier</span>
              </button>
              <button className="nav-product-btn" aria-label="Sales & Support Bot">
                <Users size={20} />
                <span>Sales & Support Bot</span>
              </button>
              <button className="nav-product-btn" aria-label="AnyOCR">
                <Sparkles size={20} />
                <span>AnyOCR</span>
              </button>
              <button className="nav-product-btn" aria-label="Tube Helper">
                <Youtube size={20} />
                <span>Tube Helper</span>
              </button>
              {/* Duplicate for seamless loop */}
              <button className="nav-product-btn" aria-label="Ecom Listing Optimizer">
                <ShoppingCart size={20} />
                <span>Ecom Listing Optimizer</span>
              </button>
              <button className="nav-product-btn" aria-label="Legal Doc Classifier">
                <Scale size={20} />
                <span>Legal Doc Classifier</span>
              </button>
              <button className="nav-product-btn" aria-label="Sales & Support Bot">
                <Users size={20} />
                <span>Sales & Support Bot</span>
              </button>
              <button className="nav-product-btn" aria-label="AnyOCR">
                <Sparkles size={20} />
                <span>AnyOCR</span>
              </button>
              <button className="nav-product-btn" aria-label="Tube Helper">
                <Youtube size={20} />
                <span>Tube Helper</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="chatbot-new-main">
        {/* Sidebar */}
        <aside className={`chatbot-new-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-top-buttons">
            <button className="sidebar-new-chat-btn" onClick={() => { handleStartNewIdea(); setMobileMenuOpen(false); }}>
              <Plus size={18} />
              New Chat
            </button>
            <button className="sidebar-history-btn" onClick={() => { setShowChatHistory(true); setMobileMenuOpen(false); }}>
              <History size={18} />
              Chat History
            </button>
          </div>
          
          <div className="sidebar-user-profile">
            <span className="sidebar-user-name">{userName || 'user name'}</span>
            <div className="sidebar-user-avatar">
              <User size={40} />
            </div>
          </div>
        </aside>

        {/* Chat History Panel */}
        {showChatHistory && (
          <div className="chat-history-overlay" onClick={() => setShowChatHistory(false)}>
            <div className="chat-history-panel" onClick={(e) => e.stopPropagation()}>
              <div className="chat-history-header">
                <h2>Chat History</h2>
                <button className="chat-history-close" onClick={() => setShowChatHistory(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="chat-history-list">
                {chatHistory.map((chat) => (
                  <div 
                    key={chat.id} 
                    className="chat-history-item"
                    onClick={() => handleLoadChat(chat)}
                  >
                    <div className="chat-history-item-icon">
                      <MessageSquare size={20} />
                    </div>
                    <div className="chat-history-item-content">
                      <div className="chat-history-item-title">{chat.title}</div>
                      <div className="chat-history-item-preview">{chat.preview}</div>
                      <div className="chat-history-item-time">{formatHistoryTime(chat.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <main className="chatbot-new-chat-area">
          <div className="chat-main-content">
            {/* Typeform-style Full Screen Selection View */}
            {['goal', 'role', 'category', 'custom-role'].includes(flowStage) ? (
              <div className="typeform-view">
                {/* Question 1: What do you want to improve right now? */}
                {flowStage === 'goal' && (
                  <div className="typeform-question-container">
                    <div className="typeform-greeting">✨ Welcome to Ikshan! 😊</div>
                    <h1 className="typeform-question">What do you want to improve right now?</h1>
                    <p className="typeform-subtitle">Select what matters most to you:</p>
                    <div className="typeform-options">
                      {goalOptions.map((goal, index) => (
                        <button
                          key={goal.id}
                          className="typeform-option-btn"
                          onClick={() => handleGoalClick(goal)}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <span className="option-emoji">{goal.emoji}</span>
                          {goal.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question 2: Which best describes you? */}
                {flowStage === 'role' && (
                  <div className="typeform-question-container">
                    <button className="typeform-back-btn" onClick={() => {
                      setSelectedGoal(null);
                      setFlowStage('goal');
                    }}>
                      <ArrowLeft size={20} />
                      Back
                    </button>
                    <h1 className="typeform-question">Which best describes you?</h1>
                    <p className="typeform-subtitle">This helps us find the most relevant solutions:</p>
                    <div className="typeform-options">
                      {roleOptions.map((role, index) => (
                        <button
                          key={role.id}
                          className="typeform-option-btn"
                          onClick={() => handleRoleClick(role)}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <span className="option-emoji">{role.emoji}</span>
                          {role.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Role Input (when user selects "Other") */}
                {flowStage === 'custom-role' && (
                  <div className="typeform-question-container">
                    <button className="typeform-back-btn" onClick={() => {
                      setUserRole(null);
                      setFlowStage('role');
                    }}>
                      <ArrowLeft size={20} />
                      Back
                    </button>
                    <h1 className="typeform-question">Tell us about your role</h1>
                    <p className="typeform-subtitle">Please describe what you do:</p>
                    <div className="typeform-input-container">
                      <input
                        type="text"
                        className="typeform-text-input"
                        placeholder="e.g., Content Creator, Consultant, Teacher..."
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && customRole.trim()) {
                            handleCustomRoleSubmit(customRole.trim());
                          }
                        }}
                        autoFocus
                      />
                      <button 
                        className="typeform-submit-btn"
                        onClick={() => customRole.trim() && handleCustomRoleSubmit(customRole.trim())}
                        disabled={!customRole.trim()}
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}

                {/* Question 3: In which category does your problem fall? */}
                {flowStage === 'category' && (
                  <div className="typeform-question-container">
                    <button className="typeform-back-btn" onClick={() => {
                      setUserRole(null);
                      setCustomRole('');
                      setFlowStage('role');
                    }}>
                      <ArrowLeft size={20} />
                      Back
                    </button>
                    <h1 className="typeform-question">In which category does your problem fall?</h1>
                    <p className="typeform-subtitle">Select the area where you need help:</p>
                    <div className="typeform-options category-grid">
                      {getCategoriesForSelection().map((category, index) => (
                        <button
                          key={index}
                          className="typeform-option-btn category-btn"
                          onClick={() => handleCategoryClick(category)}
                          style={{ animationDelay: `${index * 0.02}s` }}
                        >
                          <span className="option-emoji">📌</span>
                          {category}
                        </button>
                      ))}
                      {/* Type here button */}
                      <button
                        className="typeform-option-btn category-btn type-custom"
                        onClick={handleTypeCustomProblem}
                      >
                        <span className="option-emoji">✏️</span>
                        Type here (describe your problem)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : showDashboard ? (
              /* Dashboard View for Solution Stack */
              <div className="solution-dashboard">
                {/* Dashboard Header */}
                <div className="dashboard-header">
                  <div className="dashboard-header-top">
                    <h1 className="dashboard-title">🎯 Your Personalized Solution Stack</h1>
                    <button 
                      className={`header-copy-btn ${copiedPrompt ? 'copied' : ''}`}
                      onClick={handleCopyPrompt}
                    >
                      {copiedPrompt ? '✓ Copied!' : '📋 Copy Prompt'}
                    </button>
                  </div>
                  <div className="dashboard-context">
                    <span className="context-tag goal-tag">
                      <strong>Goal:</strong> {dashboardData.goalLabel}
                    </span>
                    <span className="context-tag role-tag">
                      <strong>Role:</strong> {dashboardData.roleLabel}
                    </span>
                    <span className="context-tag category-tag">
                      <strong>Focus:</strong> {dashboardData.category}
                    </span>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="dashboard-scroll-content">
                  {/* Instant Prompt Section - Prominent */}
                  <div className="dashboard-prompt-section">
                  <div className="prompt-header">
                    <span className="prompt-icon">⚡</span>
                    <h3>Instant Solution - Copy & Paste to ChatGPT/Claude</h3>
                  </div>
                  <div className="prompt-box-large">
                    <pre>{dashboardData.immediatePrompt}</pre>
                  </div>
                  <div className="prompt-actions">
                    <button 
                      className={`copy-prompt-btn-large ${copiedPrompt ? 'copied' : ''}`}
                      onClick={handleCopyPrompt}
                    >
                      {copiedPrompt ? '✓ Copied to Clipboard!' : '📋 Copy This Prompt'}
                    </button>
                    <span className="prompt-tip-inline">💡 Get actionable steps in under 2 minutes!</span>
                  </div>
                </div>

                {/* Dashboard Cards Grid */}
                <div className="dashboard-grid">
                  {/* AI Tools Card */}
                  <div className="dashboard-card ai-tools-card">
                    <div className="card-header">
                      <span className="card-icon">🚀</span>
                      <h2>AI Tools & Startups</h2>
                    </div>
                    <div className="card-content">
                      {dashboardData.companies.map((company, i) => (
                        <div key={i} className="tool-item">
                          <div className="tool-name">{company.name}</div>
                          <div className="tool-description">{company.problem || company.description}</div>
                          {company.differentiator && (
                            <div className="tool-differentiator">✨ {company.differentiator}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chrome Extensions Card */}
                  <div className="dashboard-card extensions-card">
                    <div className="card-header">
                      <span className="card-icon">🔌</span>
                      <h2>Chrome Extensions</h2>
                    </div>
                    <div className="card-content">
                      {dashboardData.extensions.map((ext, i) => (
                        <div key={i} className="extension-item">
                          <div className="extension-name">
                            {ext.name}
                            <span className={`extension-badge ${ext.free ? 'free' : 'paid'}`}>
                              {ext.free ? '🆓 Free' : '💰 Paid'}
                            </span>
                          </div>
                          <div className="extension-description">{ext.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom GPTs Card */}
                  <div className="dashboard-card gpts-card">
                    <div className="card-header">
                      <span className="card-icon">🤖</span>
                      <h2>Custom GPTs</h2>
                    </div>
                    <div className="card-content">
                      {dashboardData.customGPTs.map((gpt, i) => (
                        <div key={i} className="gpt-item">
                          <div className="gpt-name">
                            {gpt.name}
                            <span className="gpt-rating">⭐{gpt.rating}</span>
                          </div>
                          <div className="gpt-description">{gpt.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div> {/* End dashboard-grid */}
              </div> {/* End dashboard-scroll-content */}

                {/* Dashboard Actions - Fixed at bottom */}
                <div className="dashboard-actions">
                  <button className="dashboard-btn primary" onClick={handleExploreImplementation}>
                    🔍 Explore Implementation
                  </button>
                  <button className="dashboard-btn secondary" onClick={handleStartNewIdea}>
                    🚀 Check Another Idea
                  </button>
                </div>
              </div>
            ) : (
              /* Regular Chat View for typing stages */
              <div className="chat-messages-container" ref={messagesContainerRef}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${message.sender === 'user' ? 'user-msg' : 'bot-msg'}`}
                  >
                    <div className="chat-message-avatar">
                      {message.sender === 'user' ? (
                        <User size={20} />
                      ) : (
                        <Bot size={20} />
                      )}
                    </div>
                    <div className="chat-message-content">
                      <div className="chat-message-text">
                        {message.sender === 'bot' ? (
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        ) : (
                          message.text
                        )}
                      </div>
                      
                      {/* Identity Form */}
                      {message.showIdentityForm && (
                        <IdentityForm onSubmit={handleIdentitySubmit} />
                      )}
                      
                      {/* Final Actions */}
                      {message.showFinalActions && (
                        <div className="chat-action-buttons">
                          <button className="chat-action-btn primary" onClick={handleStartNewIdea}>
                            🚀 Check Another Idea
                          </button>
                          {message.companies && message.companies.length > 0 && (
                            <button
                                className="chat-action-btn secondary"
                                onClick={() => handleLearnImplementation(message.companies, message.userRequirement)}
                              >
                                📚 Learn How to Implement
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                {isTyping && (
                  <div className="chat-message bot-msg">
                    <div className="chat-message-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="chat-message-content">
                      <div className="typing-indicator-new">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input - Only show when user needs to type (not during selection or dashboard) */}
          {!['goal', 'role', 'category', 'custom-role'].includes(flowStage) && !showDashboard && (
            <div className="chat-input-area">
              {/* Speech Error Toast */}
              {speechError && (
                <div className="speech-error-toast">
                  {speechError}
                </div>
              )}
              <div className="chat-input-wrapper">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRecording ? "Listening..." : "Type your message here..."}
                  className="chat-text-input"
                  rows="1"
                />
                <button
                  onClick={voiceSupported ? toggleVoiceRecording : handleSend}
                  className={`chat-mic-btn ${isRecording ? 'recording' : ''}`}
                  aria-label={isRecording ? "Stop recording" : "Start voice input"}
                  title={isRecording ? "Stop recording" : "Click to speak"}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Google Auth Modal */}
      {showAuthModal && (
        <div className="chat-auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="chat-auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="chat-auth-modal-close" onClick={() => setShowAuthModal(false)}>
              ✕
            </button>
            <div className="chat-auth-modal-content">
              <h2>Start Fresh</h2>
              <p>Sign in to save your progress and preferences</p>

              <button className="chat-google-signin-btn" onClick={handleGoogleSignIn}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="chat-auth-divider">
                <span>or</span>
              </div>

              <button className="chat-skip-auth-btn" onClick={() => window.location.reload()}>
                Continue without signing in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotNew;
