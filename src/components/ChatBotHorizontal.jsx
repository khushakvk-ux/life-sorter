import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ChevronLeft, ChevronRight, Check, Sparkles, Copy, CheckCircle, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatBotHorizontal.css';

const steps = [
  { id: 'welcome', title: 'Welcome', icon: '✨' },
  { id: 'domain', title: 'Domain', icon: '🎯' },
  { id: 'subdomain', title: 'Focus Area', icon: '🔍' },
  { id: 'role', title: 'Your Role', icon: '👤' },
  { id: 'details', title: 'Details', icon: '📝' },
  { id: 'identity', title: 'Contact', icon: '📧' },
  { id: 'consultant', title: 'Deep Dive', icon: '🔬' },
  { id: 'complete', title: 'Results', icon: '🎉' },
];

const domains = [
  { id: 'marketing', name: 'Marketing', emoji: '📢' },
  { id: 'sales-support', name: 'Sales & Support', emoji: '📈' },
  { id: 'social-media', name: 'Social Media', emoji: '📱' },
  { id: 'legal', name: 'Legal', emoji: '⚖️' },
  { id: 'hr-hiring', name: 'HR & Hiring', emoji: '👥' },
  { id: 'finance', name: 'Finance', emoji: '💰' },
  { id: 'supply-chain', name: 'Supply Chain', emoji: '🚚' },
  { id: 'research', name: 'Research', emoji: '🔬' },
  { id: 'data-analysis', name: 'Data Analysis', emoji: '📊' },
  { id: 'other', name: 'Other', emoji: '✨' }
];

const subDomains = {
  marketing: [
    'Getting more leads',
    'Replying to customers fast',
    'Following up properly',
    'Selling on WhatsApp/Instagram',
    'Reducing sales/agency cost',
    'Understanding customer conversion',
    'Other'
  ],
  'sales-support': [
    'AI Sales Agent',
    'Customer Support Automation',
    'Conversational Bots',
    'Lead Qualification',
    'Customer Retention',
    'Call Intelligence',
    'Other'
  ],
  'social-media': [
    'Content Creation',
    'Scheduling & Automation',
    'Analytics & Insights',
    'Community Management',
    'Influencer Outreach',
    'Other'
  ],
  legal: [
    'Contract Analysis',
    'Document Review',
    'Compliance Monitoring',
    'Legal Research',
    'Case Management',
    'Other'
  ],
  'hr-hiring': [
    'Resume Screening',
    'Candidate Matching',
    'Interview Scheduling',
    'Employee Onboarding',
    'Performance Reviews',
    'Other'
  ],
  finance: [
    'Invoice Processing',
    'Expense Management',
    'Financial Reporting',
    'Fraud Detection',
    'Budget Planning',
    'Other'
  ],
  'supply-chain': [
    'Inventory Management',
    'Demand Forecasting',
    'Supplier Management',
    'Logistics Optimization',
    'Order Tracking',
    'Other'
  ],
  research: [
    'Market Research',
    'Competitive Analysis',
    'Data Collection',
    'Trend Analysis',
    'Report Generation',
    'Other'
  ],
  'data-analysis': [
    'Business Intelligence',
    'Predictive Analytics',
    'Data Visualization',
    'Customer Insights',
    'Performance Metrics',
    'Other'
  ],
  other: [
    'Process Automation',
    'Document Processing',
    'Workflow Optimization',
    'Custom AI Solution',
    'Integration Support',
    'Other'
  ]
};

// AI Product Recommendations based on selections
const getRecommendations = (domain, subdomain, role) => {
  const recommendations = {
    marketing: {
      product: 'AI Marketing Suite',
      features: ['Lead Scoring AI', 'Smart Campaign Builder', 'Customer Journey Mapping'],
      benefit: 'Increase lead conversion by up to 40%',
      icon: '📢'
    },
    'sales-support': {
      product: 'Sales & Support Bot',
      features: ['24/7 AI Chatbot', 'Smart Ticket Routing', 'Conversation Analytics'],
      benefit: 'Reduce response time by 80%',
      icon: '📈'
    },
    'social-media': {
      product: 'Social AI Manager',
      features: ['AI Content Writer', 'Auto-Scheduler', 'Engagement Analytics'],
      benefit: 'Save 15+ hours per week on social media',
      icon: '📱'
    },
    legal: {
      product: 'Legal Doc Classifier',
      features: ['Contract Analysis', 'Risk Detection', 'Compliance Checker'],
      benefit: 'Process documents 10x faster',
      icon: '⚖️'
    },
    'hr-hiring': {
      product: 'HR AI Assistant',
      features: ['Smart Resume Parser', 'Candidate Ranking', 'Interview Scheduler'],
      benefit: 'Cut hiring time by 50%',
      icon: '👥'
    },
    finance: {
      product: 'Finance AI Suite',
      features: ['Invoice OCR', 'Expense Categorization', 'Anomaly Detection'],
      benefit: 'Automate 70% of manual tasks',
      icon: '💰'
    },
    'supply-chain': {
      product: 'Supply Chain AI',
      features: ['Demand Prediction', 'Inventory Optimizer', 'Route Planning'],
      benefit: 'Reduce costs by up to 25%',
      icon: '🚚'
    },
    research: {
      product: 'Research AI Platform',
      features: ['Data Mining', 'Insight Generator', 'Auto-Reports'],
      benefit: 'Complete research 5x faster',
      icon: '🔬'
    },
    'data-analysis': {
      product: 'Analytics AI Dashboard',
      features: ['Predictive Models', 'Visual Reports', 'Real-time Insights'],
      benefit: 'Make data-driven decisions instantly',
      icon: '📊'
    },
    other: {
      product: 'Custom AI Solution',
      features: ['Tailored Workflows', 'API Integration', 'Dedicated Support'],
      benefit: 'Built specifically for your needs',
      icon: '✨'
    }
  };
  
  return recommendations[domain] || recommendations.other;
};

const roleOptions = [
  { id: 'business-owner', text: 'Business Owner', emoji: '👔', description: 'I run my own business' },
  { id: 'professional', text: 'Professional', emoji: '💼', description: 'I work for a company' },
  { id: 'freelancer', text: 'Freelancer', emoji: '🎯', description: 'I work independently' },
  { id: 'student', text: 'Student', emoji: '📚', description: 'Learning & exploring' }
];

const ChatBotHorizontal = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('next');
  const [selections, setSelections] = useState({
    domain: null,
    subdomain: null,
    role: null,
    details: '',
    name: '',
    email: ''
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [searchResults, setSearchResults] = useState({
    companies: [],
    helpfulResponse: '',
    aiRecommendation: null
  });
  const [showImplementation, setShowImplementation] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const cardsContainerRef = useRef(null);
  
  // Expanded sections state
  const [expandedSection, setExpandedSection] = useState(null);
  const [n8nWorkflows, setN8nWorkflows] = useState([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  
  // Dynamic Apps Script state
  const [generatedAppScript, setGeneratedAppScript] = useState(null);
  const [isLoadingAppScript, setIsLoadingAppScript] = useState(false);
  
  // Consultant Mode State
  const [consultantMessages, setConsultantMessages] = useState([]);
  const [consultantInput, setConsultantInput] = useState('');
  const [isConsultantTyping, setIsConsultantTyping] = useState(false);
  const [consultantReady, setConsultantReady] = useState(false);
  const [deepInsights, setDeepInsights] = useState('');
  const consultantChatRef = useRef(null);
  
  // Text-to-Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [isSpeakingHindi, setIsSpeakingHindi] = useState(false);
  const [isLoadingHindi, setIsLoadingHindi] = useState(false);
  const audioRef = useRef(null);

  // Generate personalized message based on deep dive
  const generatePersonalizedMessage = () => {
    const domainName = domains.find(d => d.id === selections.domain)?.name || selections.domain;
    const userReplies = consultantMessages.filter(m => m.role === 'user').map(m => m.content);
    
    // Extract key insights from the conversation
    const problemContext = userReplies.join(' ').slice(0, 200);
    const hasDeepInsight = deepInsights && deepInsights.length > 0;
    
    let message = `${selections.name}, I hear you. `;
    
    if (hasDeepInsight) {
      message += `After our conversation, I understand that you're dealing with ${selections.subdomain?.toLowerCase()} challenges in ${domainName}. `;
      message += `The core issue seems to be about ${problemContext.slice(0, 100) || 'streamlining your processes and reducing manual effort'}. `;
    } else {
      message += `You're looking to solve ${selections.subdomain?.toLowerCase()} in ${domainName}. `;
    }
    
    message += `I've carefully analyzed your situation and put together a tailored solution pathway just for you. `;
    message += `These aren't generic suggestions – they're specifically chosen based on what you shared with me. `;
    message += `Let me walk you through each option so you can decide what fits your needs and budget best.`;
    
    return message;
  };

  // Text-to-Speech function using OpenAI TTS (natural voice)
  const speakMessage = async (text, language = 'english') => {
    const isHindi = language === 'hindi';
    const currentlyPlaying = isHindi ? isSpeakingHindi : isSpeaking;
    
    // If already speaking, stop
    if (currentlyPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
      setIsSpeakingHindi(false);
      return;
    }

    // Stop any other playing audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsSpeakingHindi(false);

    if (isHindi) {
      setIsLoadingHindi(true);
    } else {
      setIsLoadingVoice(true);
    }
    
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        setIsSpeakingHindi(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        setIsSpeakingHindi(false);
        setIsLoadingVoice(false);
        setIsLoadingHindi(false);
      };

      setIsLoadingVoice(false);
      setIsLoadingHindi(false);
      
      if (isHindi) {
        setIsSpeakingHindi(true);
      } else {
        setIsSpeaking(true);
      }
      await audio.play();
      
    } catch (error) {
      console.error('TTS Error:', error);
      setIsLoadingVoice(false);
      setIsLoadingHindi(false);
      setIsSpeaking(false);
      setIsSpeakingHindi(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Search n8n workflows based on user needs
  const searchN8nWorkflows = async () => {
    setIsLoadingWorkflows(true);
    const domainName = domains.find(d => d.id === selections.domain)?.name || selections.domain;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on a user who needs "${selections.subdomain}" in ${domainName}, suggest 4 specific n8n workflow templates that would help them. 

For each workflow, provide:
1. Workflow name (realistic n8n template name)
2. What it does (one sentence)
3. Key integrations used (2-3 apps like Google Sheets, Slack, Gmail, etc.)

Format as JSON array: [{"name": "...", "description": "...", "integrations": ["...", "..."]}]`,
          persona: 'technical'
        })
      });
      
      const data = await response.json();
      try {
        // Try to parse JSON from the response
        const jsonMatch = data.message.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const workflows = JSON.parse(jsonMatch[0]);
          setN8nWorkflows(workflows);
        }
      } catch (e) {
        // Fallback workflows
        setN8nWorkflows([
          { name: 'Lead Capture & Qualification', description: 'Automatically capture leads and score them', integrations: ['Typeform', 'Google Sheets', 'Slack'] },
          { name: 'Email Auto-Responder', description: 'AI-powered email responses', integrations: ['Gmail', 'OpenAI', 'Notion'] },
          { name: 'Data Sync Automation', description: 'Keep your tools in sync automatically', integrations: ['Airtable', 'HubSpot', 'Zapier'] },
          { name: 'Report Generator', description: 'Auto-generate weekly reports', integrations: ['Google Sheets', 'Slack', 'PDF'] }
        ]);
      }
    } catch (error) {
      console.error('Error fetching n8n workflows:', error);
      setN8nWorkflows([
        { name: 'Lead Capture & Qualification', description: 'Automatically capture leads and score them', integrations: ['Typeform', 'Google Sheets', 'Slack'] },
        { name: 'Email Auto-Responder', description: 'AI-powered email responses', integrations: ['Gmail', 'OpenAI', 'Notion'] }
      ]);
    }
    setIsLoadingWorkflows(false);
  };

  // Generate dynamic Apps Script based on user's specific needs
  const generateAppScript = async () => {
    if (generatedAppScript) return; // Already generated
    
    setIsLoadingAppScript(true);
    const domainName = domains.find(d => d.id === selections.domain)?.name || selections.domain;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are an expert Google Apps Script developer. Based on this user's need, create a practical, working Apps Script example.

USER'S CONTEXT:
- Domain: ${domainName}
- Focus Area: ${selections.subdomain}
- Problem: ${selections.details || 'General automation needs'}
- Role: ${roleOptions.find(r => r.id === selections.role)?.text || 'Professional'}

Create a response in this exact JSON format:
{
  "tableName": "Short name for the example data (e.g., 'Lead Tracker', 'Invoice Log')",
  "tableDescription": "One line explaining what this table tracks",
  "columns": ["Column1", "Column2", "Column3", "Column4"],
  "sampleData": [
    ["Row1Col1", "Row1Col2", "Row1Col3", "Row1Col4"],
    ["Row2Col1", "Row2Col2", "Row2Col3", "Row2Col4"],
    ["Row3Col1", "Row3Col2", "Row3Col3", "Row3Col4"]
  ],
  "scriptName": "Name of the function (e.g., processLeads, sendReminders)",
  "scriptDescription": "What this script does in one sentence",
  "scriptCode": "function example() { // Complete working Apps Script code here }",
  "triggerSuggestion": "How to set up automatic trigger (e.g., 'Run daily at 9 AM')"
}

Make the example DIRECTLY relevant to their ${selections.subdomain} need. The code should be complete and working.`,
          persona: 'technical'
        })
      });
      
      const data = await response.json();
      
      try {
        // Try to parse JSON from the response
        const jsonMatch = data.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const scriptData = JSON.parse(jsonMatch[0]);
          setGeneratedAppScript(scriptData);
        } else {
          throw new Error('No JSON found');
        }
      } catch (e) {
        // Fallback to default example
        setGeneratedAppScript({
          tableName: `${selections.subdomain} Tracker`,
          tableDescription: `Track and manage ${selections.subdomain?.toLowerCase()} data`,
          columns: ['Name', 'Email', 'Status', 'Date'],
          sampleData: [
            ['John Doe', 'john@email.com', 'Pending', '2025-01-05'],
            ['Jane Smith', 'jane@email.com', 'Completed', '2025-01-03'],
            ['Bob Wilson', 'bob@email.com', 'In Progress', '2025-01-02']
          ],
          scriptName: 'process' + selections.subdomain?.replace(/\s+/g, ''),
          scriptDescription: `Automate ${selections.subdomain?.toLowerCase()} tasks`,
          scriptCode: `function processData() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    var status = data[i][2];
    
    if (status === "Pending") {
      // Process pending items
      sheet.getRange(i+1, 3).setValue("Processed");
      Logger.log("Processed row: " + (i+1));
    }
  }
}`,
          triggerSuggestion: 'Run daily at 9 AM or on spreadsheet edit'
        });
      }
    } catch (error) {
      console.error('Error generating Apps Script:', error);
      // Set fallback
      setGeneratedAppScript({
        tableName: 'Data Tracker',
        tableDescription: 'Track and automate your workflow',
        columns: ['Item', 'Status', 'Assigned To', 'Due Date'],
        sampleData: [
          ['Task 1', 'Pending', 'John', '2025-01-05'],
          ['Task 2', 'Done', 'Jane', '2025-01-03'],
          ['Task 3', 'In Progress', 'Bob', '2025-01-02']
        ],
        scriptName: 'automateWorkflow',
        scriptDescription: 'Process and automate spreadsheet tasks',
        scriptCode: `function automateWorkflow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === "Pending") {
      sheet.getRange(i+1, 2).setValue("Processed");
    }
  }
}`,
        triggerSuggestion: 'Run daily or on spreadsheet change'
      });
    }
    setIsLoadingAppScript(false);
  };

  // Generate initial consultant question based on user's inputs
  const generateConsultantQuestion = async () => {
    setIsConsultantTyping(true);
    
    const domainName = domains.find(d => d.id === selections.domain)?.name || selections.domain;
    const roleName = roleOptions.find(r => r.id === selections.role)?.text || selections.role;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a world-class business consultant. A ${roleName} in ${domainName} needs help with "${selections.subdomain}". 
          
Their initial description: "${selections.details || 'No details provided yet'}"

Your job is to ask ONE probing question that will help uncover the REAL problem beneath the surface. Most people describe symptoms, not root causes. 

Ask about:
- What they've already tried
- The impact/cost of this problem
- Who else is affected
- What's blocking them
- Their ideal outcome

Keep it conversational and empathetic. Ask just ONE focused question. Don't be generic - reference their specific situation.`,
          persona: 'consultant'
        })
      });
      
      const data = await response.json();
      setConsultantMessages([{
        role: 'assistant',
        content: data.message || "I'd love to understand your situation better. Can you tell me what you've already tried to solve this problem, and what didn't work?"
      }]);
    } catch (error) {
      console.error('Error generating consultant question:', error);
      setConsultantMessages([{
        role: 'assistant',
        content: `Thanks for sharing that you need help with ${selections.subdomain}. Before I can recommend the best solution, I need to understand your situation deeper. What have you already tried to solve this problem, and why didn't it work?`
      }]);
    }
    
    setIsConsultantTyping(false);
  };

  // Handle consultant chat response
  const handleConsultantReply = async () => {
    if (!consultantInput.trim()) return;
    
    const userMessage = consultantInput.trim();
    setConsultantInput('');
    
    // Add user message
    setConsultantMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsConsultantTyping(true);
    
    // Build conversation history
    const conversationHistory = consultantMessages.map(m => 
      `${m.role === 'user' ? 'User' : 'Consultant'}: ${m.content}`
    ).join('\n');
    
    const domainName = domains.find(d => d.id === selections.domain)?.name || selections.domain;
    const roleName = roleOptions.find(r => r.id === selections.role)?.text || selections.role;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are a world-class business consultant having a discovery conversation.

CONTEXT:
- User: ${roleName} in ${domainName}
- Problem area: ${selections.subdomain}
- Initial details: ${selections.details}

CONVERSATION SO FAR:
${conversationHistory}
User: ${userMessage}

INSTRUCTIONS:
1. If you now have enough information (clear problem, impact, constraints, desired outcome), respond with:
   "DIAGNOSIS_COMPLETE: [2-3 sentence summary of the real problem and what they need]"

2. If you need more clarity, ask ONE more probing question. Focus on:
   - Root cause (not just symptoms)
   - Business impact (time, money, stress)
   - Constraints (budget, timeline, tech)
   - Decision criteria (what would make a solution "good"?)

Be warm and conversational. Reference their specific answers. Max 2-3 follow-up questions total before declaring diagnosis complete.`,
          persona: 'consultant'
        })
      });
      
      const data = await response.json();
      const aiResponse = data.message || "I think I have a good understanding now. Let me find the best solutions for you.";
      
      // Check if diagnosis is complete
      if (aiResponse.includes('DIAGNOSIS_COMPLETE:')) {
        const diagnosis = aiResponse.replace('DIAGNOSIS_COMPLETE:', '').trim();
        setDeepInsights(diagnosis);
        setConsultantMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Perfect, I now have a clear picture of your situation.\n\n**My Assessment:** ${diagnosis}\n\nLet me find the best solutions tailored to your specific needs...`
        }]);
        setConsultantReady(true);
      } else {
        setConsultantMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      }
      
      // Auto-complete after 3 exchanges
      if (consultantMessages.filter(m => m.role === 'user').length >= 2 && !aiResponse.includes('DIAGNOSIS_COMPLETE:')) {
        setTimeout(() => {
          setDeepInsights(`User needs ${selections.subdomain} solution in ${domainName}. They are a ${roleName}. Additional context: ${userMessage}`);
          setConsultantReady(true);
        }, 1000);
      }
      
    } catch (error) {
      console.error('Consultant chat error:', error);
      setConsultantMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I have a good understanding of your needs now. Let me find the best solutions for you." 
      }]);
      setConsultantReady(true);
    }
    
    setIsConsultantTyping(false);
  };

  // Skip consultant mode
  const skipConsultantMode = () => {
    setDeepInsights(selections.details);
    setConsultantReady(true);
  };

  // Scroll consultant chat to bottom
  useEffect(() => {
    if (consultantChatRef.current) {
      consultantChatRef.current.scrollTop = consultantChatRef.current.scrollHeight;
    }
  }, [consultantMessages]);

  // Fetch companies from CSV + AI analysis when reaching complete step
  const fetchResults = async () => {
    setIsLoadingAI(true);
    try {
      const domainName = domains.find(d => d.id === selections.domain)?.name || selections.domain;
      const roleName = roleOptions.find(r => r.id === selections.role)?.text || selections.role;
      
      // Map domain IDs to CSV domain labels
      const domainMapping = {
        'marketing': 'MARKETING',
        'sales-support': 'SALES',
        'social-media': 'SOCIAL MEDIA',
        'legal': 'LEGAL',
        'hr-hiring': 'HR',
        'finance': 'FINANCE',
        'supply-chain': 'SUPPLY CHAIN',
        'research': 'RESEARCH',
        'data-analysis': 'DATA',
        'other': ''
      };
      
      const csvDomain = domainMapping[selections.domain] || selections.domain;
      
      // Combine initial details with deep insights from consultant mode
      const fullRequirement = deepInsights 
        ? `${selections.details}\n\nDEEP INSIGHTS FROM CONSULTATION:\n${deepInsights}`
        : selections.details;
      
      // Build user context
      const userContext = {
        role: selections.role,
        roleText: roleName,
        details: fullRequirement
      };

      console.log('Searching with domain:', csvDomain, 'subdomain:', selections.subdomain);
      console.log('Full requirement with insights:', fullRequirement);

      // 1. Search companies from CSV/Google Sheet
      const searchResponse = await fetch('/api/search-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: csvDomain,
          subdomain: selections.subdomain,
          requirement: fullRequirement,
          userContext: userContext
        })
      });

      const searchData = await searchResponse.json();
      console.log('Search results:', searchData);
      
      const companies = searchData.companies || [];
      const helpfulResponse = searchData.helpfulResponse || '';

      // 2. If no AI response from search, get one from chat API
      let aiRec = null;
      if (!helpfulResponse && companies.length === 0) {
        try {
          const chatResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `I need help with ${domainName}, specifically ${selections.subdomain}. 
              My role: ${roleName}
              My requirement: ${fullRequirement}
              
              Provide a helpful response about what AI tools/solutions could help me. Be specific and actionable.`,
              persona: 'product',
              context: { domain: selections.domain, subdomain: selections.subdomain }
            })
          });
          const chatData = await chatResponse.json();
          aiRec = chatData.message;
        } catch (e) {
          console.error('Chat API error:', e);
        }
      }

      setSearchResults({
        companies,
        helpfulResponse,
        aiRecommendation: aiRec
      });

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({
        companies: [],
        helpfulResponse: '',
        aiRecommendation: 'We encountered an issue searching our database. Please try again or explore our product categories.'
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Copy prompt to clipboard
  const copyToClipboard = (text, promptId) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(promptId);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  // Generate dynamic prompts based on deep dive conversation
  const getStarterPrompts = () => {
    const domainName = domains.find(d => d.id === selections.domain)?.name || 'your domain';
    const roleName = roleOptions.find(r => r.id === selections.role)?.text || 'professional';
    const topTool = searchResults.companies[0];
    
    // Extract conversation context from deep dive
    const userMessages = consultantMessages.filter(m => m.role === 'user').map(m => m.content);
    const aiMessages = consultantMessages.filter(m => m.role === 'assistant').map(m => m.content);
    
    // Build rich context from the conversation
    const conversationSummary = userMessages.length > 0 
      ? userMessages.join('\n- ') 
      : selections.details || 'Not specified';
    
    // Extract key insights from AI responses
    const keyInsights = deepInsights || (aiMessages.length > 0 
      ? aiMessages[aiMessages.length - 1].slice(0, 300) 
      : '');
    
    // Create detailed context block that's already filled in
    const filledContext = `
## My Situation
- **Role:** ${roleName}
- **Domain:** ${domainName}
- **Focus Area:** ${selections.subdomain || 'General'}
- **Initial Problem:** ${selections.details || 'Need AI automation solution'}

## From Our Deep Dive Conversation
${userMessages.length > 0 ? userMessages.map((msg, i) => `- ${msg}`).join('\n') : '- No additional context provided yet'}

## Key Insights Identified
${keyInsights || 'Seeking solutions for process optimization and efficiency improvements'}

## Recommended Tool
${topTool ? `${topTool.name} - ${topTool.description || 'AI solution for your use case'}` : 'Exploring AI solutions'}
`.trim();

    return [
      {
        id: 'solution',
        title: '🎯 Build My Solution',
        description: 'Get a complete implementation plan based on our conversation',
        prompt: `You are an expert ${domainName} consultant. Based on my specific situation, create a detailed, actionable solution.

${filledContext}

## What I Need From You

1. **Solution Overview** (2-3 paragraphs)
   - Exactly how to solve my specific problem
   - Why this approach will work for my situation

2. **Step-by-Step Implementation** (numbered, detailed)
   - Each step should be actionable TODAY
   - Include specific tools, templates, or scripts needed
   - Time estimate for each step

3. **Quick Wins** (3 things I can do in the next 30 minutes)
   - Immediate actions that show progress
   - Low effort, high impact

4. **Potential Roadblocks & Solutions**
   - What might go wrong
   - How to handle each issue

5. **Success Metrics**
   - How will I know this is working?
   - What should I measure?

Be specific to MY situation - don't give generic advice. Reference my actual problem and context.`
      },
      {
        id: 'template',
        title: '📄 Create My Template',
        description: 'Generate a ready-to-use document for your specific need',
        prompt: `You are a senior ${domainName} expert. Create a professional, ready-to-use template based on my exact situation.

${filledContext}

## Template Request

Create a complete, fill-in-the-blank template that I can use immediately. The template should:

1. **Be specific to my situation** - not generic
2. **Include example content** filled in based on my context
3. **Have clear [PLACEHOLDERS]** only for things you genuinely don't know
4. **Be professionally formatted** and ready to share

Also provide:
- A "completed example" showing how it looks when filled out
- 5 tips for customizing this template
- Common mistakes to avoid

Output the template in a format I can copy directly into Google Docs or Word.`
      },
      {
        id: 'automation',
        title: '⚡ Automate This For Me',
        description: 'Get specific automation scripts and workflows',
        prompt: `You are an automation expert specializing in ${domainName}. Build me a practical automation based on my exact situation.

${filledContext}

## Automation Request

Create automation solutions I can implement TODAY:

### Option 1: No-Code Solution (Zapier/Make/n8n)
- Exact workflow steps
- Which triggers and actions to use
- How to connect the tools

### Option 2: Google Sheets + Apps Script
- Complete script I can copy-paste
- How to set it up (step-by-step with screenshots description)
- How to trigger it (manually, on schedule, etc.)

### Option 3: AI Prompt Automation
- Prompts I can save and reuse
- How to batch process multiple items
- Integration with my existing tools

For each option:
- Time to implement
- Cost (free vs paid)
- Maintenance required
- Limitations

Recommend which option is best for MY specific situation and why.`
      },
      {
        id: 'analyze',
        title: '🔍 Analyze My Situation',
        description: 'Deep analysis with specific recommendations',
        prompt: `You are a senior business analyst specializing in ${domainName}. Perform a thorough analysis of my situation.

${filledContext}

## Analysis Request

Provide a comprehensive analysis:

### 1. Root Cause Analysis
- What's really causing my problem?
- Hidden factors I might not have considered
- How this connects to bigger issues

### 2. Opportunity Assessment
- What's the potential improvement (time/money/quality)?
- Quick wins vs long-term gains
- ROI estimate if applicable

### 3. Competitive Landscape
- How do others in ${domainName} solve this?
- Best practices I should know about
- Emerging trends and tools

### 4. Risk Analysis
- What could go wrong with different approaches?
- How to mitigate each risk
- Warning signs to watch for

### 5. Prioritized Recommendations
- Top 3 actions ranked by impact
- For each: effort required, timeline, expected outcome
- What to do first, second, third

Be brutally honest - tell me what I need to hear, not what I want to hear.`
      },
      {
        id: 'pitch',
        title: '🚀 Help Me Get Buy-In',
        description: 'Create a compelling pitch for stakeholders',
        prompt: `You are a persuasion expert. Help me get buy-in for solving my problem from stakeholders/management.

${filledContext}

## Create a Compelling Pitch

### 1. Executive Summary (2-3 sentences)
- The problem in business terms
- The solution in one line
- The expected outcome

### 2. Problem Statement
- Current state (pain points, costs, risks)
- Impact on business (quantified if possible)
- Why this matters NOW

### 3. Proposed Solution
- What we'll do (high-level)
- Why this approach (vs alternatives)
- Proof it works (examples, case studies)

### 4. Investment & Returns
- Time/resources needed
- Expected benefits (be specific)
- Timeline to see results

### 5. Risk Mitigation
- What could go wrong
- How we'll handle it
- Fallback options

### 6. Call to Action
- Specific ask (budget, approval, resources)
- Next steps if approved
- Decision deadline

Also provide:
- 3 likely objections and responses
- A one-page visual summary I can present
- Email template to send to decision makers`
      }
    ];
  };

  const goToStep = (stepIndex) => {
    if (isAnimating || stepIndex === currentStep) return;
    setDirection(stepIndex > currentStep ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsAnimating(false);
    }, 50);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && !isAnimating) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0 && !isAnimating) {
      goToStep(currentStep - 1);
    }
  };

  const handleDomainSelect = (domain) => {
    setSelections(prev => ({ ...prev, domain, subdomain: null }));
    setTimeout(nextStep, 300);
  };

  const handleSubdomainSelect = (subdomain) => {
    setSelections(prev => ({ ...prev, subdomain }));
    setTimeout(nextStep, 300);
  };

  const handleRoleSelect = (role) => {
    setSelections(prev => ({ ...prev, role }));
    setTimeout(nextStep, 300);
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (selections.details.trim()) {
      nextStep();
    }
  };

  const handleIdentitySubmit = (e) => {
    e.preventDefault();
    if (selections.name.trim() && selections.email.trim()) {
      // Go to consultant mode first, not directly to results
      nextStep();
      // Start the consultant conversation
      generateConsultantQuestion();
    }
  };

  // Handle proceeding from consultant to results
  const handleConsultantComplete = () => {
    fetchResults();
    nextStep();
  };

  const getSubdomainOptions = () => {
    if (selections.domain && subDomains[selections.domain]) {
      return subDomains[selections.domain];
    }
    return subDomains.other;
  };

  const renderStepContent = (stepId) => {
    switch (stepId) {
      case 'welcome':
        return (
          <div className="step-content welcome-step">
            <div className="welcome-icon">
              <Sparkles size={48} />
            </div>
            <h2>Welcome to Ikshan! ✨</h2>
            <p>Let's find the perfect AI solution for your needs.</p>
            <p className="subtitle">This will only take a minute.</p>
            <button className="primary-btn" onClick={nextStep}>
              Let's Start <ChevronRight size={20} />
            </button>
          </div>
        );

      case 'domain':
        return (
          <div className="step-content">
            <h2>What area are you interested in?</h2>
            <p>Select your primary domain</p>
            <div className="options-grid">
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  className={`option-card ${selections.domain === domain.id ? 'selected' : ''}`}
                  onClick={() => handleDomainSelect(domain.id)}
                >
                  <span className="option-emoji">{domain.emoji}</span>
                  <span className="option-text">{domain.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'subdomain':
        return (
          <div className="step-content">
            <h2>What specific challenge?</h2>
            <p>Tell us more about your focus area</p>
            <div className="options-list">
              {getSubdomainOptions().map((sub, index) => (
                <button
                  key={index}
                  className={`option-pill ${selections.subdomain === sub ? 'selected' : ''}`}
                  onClick={() => handleSubdomainSelect(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        );

      case 'role':
        return (
          <div className="step-content">
            <h2>What describes you best?</h2>
            <p>This helps us personalize recommendations</p>
            <div className="role-options">
              {roleOptions.map((role) => (
                <button
                  key={role.id}
                  className={`role-card ${selections.role === role.id ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <span className="role-emoji">{role.emoji}</span>
                  <div className="role-info">
                    <span className="role-title">{role.text}</span>
                    <span className="role-desc">{role.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="step-content">
            <h2>Tell us more</h2>
            <p>Any specific requirements or challenges?</p>
            <form onSubmit={handleDetailsSubmit} className="details-form">
              <textarea
                placeholder="Describe your specific needs, challenges, or goals..."
                value={selections.details}
                onChange={(e) => setSelections(prev => ({ ...prev, details: e.target.value }))}
                rows={4}
              />
              <button type="submit" className="primary-btn" disabled={!selections.details.trim()}>
                Continue <ChevronRight size={20} />
              </button>
            </form>
          </div>
        );

      case 'identity':
        return (
          <div className="step-content">
            <h2>Almost there!</h2>
            <p>How can we reach you?</p>
            <form onSubmit={handleIdentitySubmit} className="identity-form">
              <input
                type="text"
                placeholder="Your Name"
                value={selections.name}
                onChange={(e) => setSelections(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="email"
                placeholder="Your Email"
                value={selections.email}
                onChange={(e) => setSelections(prev => ({ ...prev, email: e.target.value }))}
              />
              <button 
                type="submit" 
                className="primary-btn"
                disabled={!selections.name.trim() || !selections.email.trim()}
              >
                Continue <ChevronRight size={20} />
              </button>
            </form>
          </div>
        );

      case 'consultant':
        return (
          <div className="step-content consultant-step">
            <div className="consultant-mode-header">
              <div className="consultant-badge">
                <MessageCircle size={24} />
                <span>Deep Dive Mode</span>
              </div>
              <h2>Let me understand your situation better</h2>
              <p>Most people describe symptoms, not root causes. A few questions will help me find the <strong>right</strong> solution.</p>
            </div>

            <div className="consultant-chat" ref={consultantChatRef}>
              {consultantMessages.map((msg, idx) => (
                <div key={idx} className={`consultant-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className="message-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              
              {isConsultantTyping && (
                <div className="consultant-message assistant">
                  <div className="message-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="message-content typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </div>

            {!consultantReady ? (
              <div className="consultant-input-area">
                <input
                  type="text"
                  placeholder="Type your response..."
                  value={consultantInput}
                  onChange={(e) => setConsultantInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleConsultantReply()}
                  disabled={isConsultantTyping}
                />
                <button 
                  onClick={handleConsultantReply} 
                  disabled={!consultantInput.trim() || isConsultantTyping}
                  className="send-btn"
                >
                  <Send size={18} />
                </button>
              </div>
            ) : (
              <div className="consultant-ready">
                <div className="ready-icon">✅</div>
                <p>Great! I have a clear understanding of your needs.</p>
                <button className="primary-btn" onClick={handleConsultantComplete}>
                  Show My Solutions <ChevronRight size={20} />
                </button>
              </div>
            )}

            <button className="skip-btn" onClick={() => { skipConsultantMode(); handleConsultantComplete(); }}>
              Skip deep dive → Show results now
            </button>
          </div>
        );

      case 'complete':
        const { companies, helpfulResponse, aiRecommendation } = searchResults;
        const starterPrompts = getStarterPrompts();
        const domainName = domains.find(d => d.id === selections.domain)?.name || 'your domain';
        const roleName = roleOptions.find(r => r.id === selections.role)?.text || 'user';
        
        // Check if user needs Google-based automation
        const needsGoogleAutomation = selections.details?.toLowerCase().includes('sheet') || 
                                       selections.details?.toLowerCase().includes('google') ||
                                       selections.details?.toLowerCase().includes('spreadsheet') ||
                                       selections.details?.toLowerCase().includes('record') ||
                                       selections.details?.toLowerCase().includes('data entry') ||
                                       selections.subdomain?.toLowerCase().includes('data');

        // Solution categories for the horizontal roadmap - Google Automation only if needed
        const baseSolutionCategories = [
          { id: 'tools', title: 'Existing Tools', subtitle: 'Ready-to-use products', icon: '🛠️', color: '#9359B6' },
          { id: 'gpts', title: 'Custom GPTs', subtitle: 'AI assistants', icon: '🤖', color: '#3C8AD1' },
          { id: 'prompts', title: 'Action Prompts', subtitle: 'Copy-paste templates', icon: '📝', color: '#10b981' },
          { id: 'workflows', title: 'n8n Workflows', subtitle: 'Agentic automations', icon: '⚡', color: '#f59e0b' }
        ];
        
        // Only add Google Automations if actually relevant
        const solutionCategories = needsGoogleAutomation 
          ? [...baseSolutionCategories, { id: 'appscript', title: 'Google Automations', subtitle: 'Apps Script', icon: '📊', color: '#ec4899' }]
          : baseSolutionCategories;

        return (
          <div className="step-content complete-step consultant-view">
            {isLoadingAI ? (
              <div className="ai-loading">
                <div className="loading-spinner"></div>
                <h2>🔍 Analyzing your requirements...</h2>
                <p>Finding the best solutions for {selections.subdomain}</p>
              </div>
            ) : (
              <>
                {/* Personalized Problem Summary with Voice */}
                <div className="problem-summary-card">
                  <div className="summary-header">
                    <div className="summary-icon-wrapper">
                      <Bot size={24} />
                    </div>
                    <div className="summary-title">
                      <span className="greeting">I understand your challenge, {selections.name}</span>
                      <span className="context-tag">{domainName} • {selections.subdomain}</span>
                    </div>
                    <div className="speak-buttons">
                      <button 
                        className={`speak-btn ${isSpeaking ? 'speaking' : ''} ${isLoadingVoice ? 'loading' : ''}`}
                        onClick={() => speakMessage(generatePersonalizedMessage(), 'english')}
                        title={isSpeaking ? 'Stop' : 'Listen in English'}
                        disabled={isLoadingVoice || isLoadingHindi}
                      >
                        {isLoadingVoice ? (
                          <><div className="btn-spinner"></div><span>Loading...</span></>
                        ) : isSpeaking ? (
                          <><VolumeX size={20} /><span>Stop</span></>
                        ) : (
                          <><Volume2 size={20} /><span>Listen</span></>
                        )}
                      </button>
                      <button 
                        className={`speak-btn hindi ${isSpeakingHindi ? 'speaking' : ''} ${isLoadingHindi ? 'loading' : ''}`}
                        onClick={() => speakMessage(generatePersonalizedMessage(), 'hindi')}
                        title={isSpeakingHindi ? 'रुकें' : 'हिंदी में समझें'}
                        disabled={isLoadingVoice || isLoadingHindi}
                      >
                        {isLoadingHindi ? (
                          <><div className="btn-spinner"></div><span>Loading...</span></>
                        ) : isSpeakingHindi ? (
                          <><VolumeX size={20} /><span>रुकें</span></>
                        ) : (
                          <><span className="hindi-icon">🇮🇳</span><span>हिंदी में सुनें</span></>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="problem-content">
                    <p className="empathy-message">
                      {generatePersonalizedMessage()}
                    </p>
                    
                    {/* What we identified from deep dive */}
                    {consultantMessages.filter(m => m.role === 'user').length > 0 && (
                      <div className="identified-points">
                        <h4>🔍 What I learned from our conversation:</h4>
                        <ul>
                          <li><strong>Your focus:</strong> {selections.subdomain} in {domainName}</li>
                          <li><strong>Your role:</strong> {roleOptions.find(r => r.id === selections.role)?.text || 'Professional'}</li>
                          {selections.details && (
                            <li><strong>Key challenge:</strong> {selections.details.slice(0, 100)}{selections.details.length > 100 ? '...' : ''}</li>
                          )}
                          {consultantMessages.filter(m => m.role === 'user').slice(-1)[0] && (
                            <li><strong>Additional context:</strong> {consultantMessages.filter(m => m.role === 'user').slice(-1)[0].content.slice(0, 80)}...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="proposed-approach">
                    <span className="approach-label">✨ My recommended approach for you:</span>
                    <p>I've prepared {solutionCategories.length} solution categories below – from ready-made tools to DIY options. Click on any step to explore the details.</p>
                  </div>
                </div>

                {/* Horizontal Roadmap - Sleek Design */}
                <div className="roadmap-section">
                  <h3 className="roadmap-title-slim">Your Solution Pathway</h3>
                  <div className="roadmap-horizontal">
                    {solutionCategories.map((cat, idx) => (
                      <div 
                        key={cat.id} 
                        className={`roadmap-item ${expandedSection === cat.id ? 'active' : ''}`}
                        style={{ '--item-color': cat.color }}
                        onClick={() => {
                          if (cat.id === 'workflows' && expandedSection !== 'workflows') {
                            searchN8nWorkflows();
                          }
                          if (cat.id === 'appscript' && expandedSection !== 'appscript' && !generatedAppScript) {
                            generateAppScript();
                          }
                          setExpandedSection(expandedSection === cat.id ? null : cat.id);
                        }}
                      >
                        <div className="roadmap-item-marker">
                          <span className="marker-icon">{cat.icon}</span>
                          <span className="marker-num">{idx + 1}</span>
                        </div>
                        {idx < solutionCategories.length - 1 && <div className="roadmap-connector" />}
                        <div className="roadmap-item-label">
                          <h4>{cat.title}</h4>
                          <p>{cat.subtitle}</p>
                        </div>
                        
                        {/* Quick preview chips */}
                        <div className="roadmap-item-preview">
                          {cat.id === 'tools' && companies.slice(0, 2).map((t, i) => (
                            <span key={i} className="preview-chip">{t.name}</span>
                          ))}
                          {cat.id === 'gpts' && (
                            <>
                              <span className="preview-chip">{domainName} Assistant</span>
                              <span className="preview-chip">Doc Analyzer</span>
                            </>
                          )}
                          {cat.id === 'prompts' && (
                            <>
                              <span className="preview-chip green">Solution</span>
                              <span className="preview-chip green">Automate</span>
                              <span className="preview-chip green">Analyze</span>
                            </>
                          )}
                          {cat.id === 'workflows' && (
                            <>
                              <span className="preview-chip orange">Lead Bot</span>
                              <span className="preview-chip orange">Email Auto</span>
                            </>
                          )}
                          {cat.id === 'appscript' && needsGoogleAutomation && (
                            <span className="preview-chip pink">Recommended!</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded Detail Section - Shows below roadmap when clicked */}
                {expandedSection && (
                  <div className="detail-panel" style={{ '--panel-color': solutionCategories.find(c => c.id === expandedSection)?.color }}>
                    <button className="close-panel" onClick={() => setExpandedSection(null)}>✕</button>
                    
                    {expandedSection === 'tools' && (
                      <div className="panel-content">
                        <h4>🛠️ Existing AI Tools</h4>
                        <p className="panel-desc">These companies offer ready-made solutions. Request demos to see if they fit your needs.</p>
                        <div className="tools-grid">
                          {companies.slice(0, 4).map((tool, i) => (
                            <div key={i} className="tool-card-slim">
                              <strong>{tool.name}</strong>
                              {tool.country && <span className="tool-country">{tool.country}</span>}
                              {tool.problem && <p>{tool.problem}</p>}
                            </div>
                          ))}
                        </div>
                        <p className="panel-tip">💡 Contact these companies for demos to evaluate fit and budget.</p>
                      </div>
                    )}

                    {expandedSection === 'gpts' && (
                      <div className="panel-content">
                        <h4>🤖 Custom GPTs</h4>
                        <p className="panel-desc">AI assistants tailored for your use case</p>
                        <div className="gpts-grid">
                          <div className="gpt-item">
                            <strong>{domainName} Assistant</strong>
                            <p>Custom GPT for {selections.subdomain}</p>
                          </div>
                          <div className="gpt-item">
                            <strong>Document Analyzer</strong>
                            <p>Process & extract insights from files</p>
                          </div>
                        </div>
                        <div className="access-box">
                          <h5>How to Access:</h5>
                          <ul>
                            <li><strong>ChatGPT Plus:</strong> <a href="https://chat.openai.com/gpts" target="_blank" rel="noopener noreferrer">chat.openai.com/gpts</a> → Search for your use case</li>
                            <li><strong>Create Your Own:</strong> ChatGPT → Explore GPTs → Create</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {expandedSection === 'prompts' && (
                      <div className="panel-content">
                        <h4>📝 Action Prompts — Personalized For You</h4>
                        <p className="panel-desc">These prompts include YOUR context from our conversation. Just copy, paste, and get instant results!</p>
                        
                        <div className="platform-bar">
                          <span><strong>ChatGPT</strong> - General tasks</span>
                          <span><strong>Claude</strong> - Long docs, coding</span>
                          <span><strong>Gemini</strong> - Google integration</span>
                        </div>

                        <div className="prompts-list">
                          {starterPrompts.map((prompt, idx) => (
                            <div key={prompt.id} className="prompt-item">
                              <div className="prompt-item-header">
                                <span className="prompt-num">{idx + 1}</span>
                                <div>
                                  <strong>{prompt.title.replace(/^[📋🔄📄🔍🚀🎯⚡]\s*/, '')}</strong>
                                  <p>{prompt.description}</p>
                                </div>
                                <button 
                                  className={`copy-btn-slim ${copiedPrompt === prompt.id ? 'copied' : ''}`}
                                  onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                                >
                                  {copiedPrompt === prompt.id ? '✓ Copied!' : '📋 Copy'}
                                </button>
                              </div>
                              <pre className="prompt-preview">{prompt.prompt.slice(0, 250)}...</pre>
                              <p className="customize-hint">✅ Your context is already included — just copy and paste!</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedSection === 'workflows' && (
                      <div className="panel-content">
                        <h4>⚡ n8n Workflows</h4>
                        <p className="panel-desc">Free, open-source automation. 7000+ templates available.</p>
                        
                        {isLoadingWorkflows ? (
                          <div className="loading-inline"><div className="loading-spinner small"></div> Searching workflows...</div>
                        ) : (
                          <div className="workflows-grid">
                            {n8nWorkflows.map((wf, i) => (
                              <div key={i} className="workflow-item">
                                <strong>{wf.name}</strong>
                                <p>{wf.description}</p>
                                <div className="integrations">
                                  {wf.integrations?.map((int, j) => (
                                    <span key={j}>{int}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <a href="https://n8n.io/workflows/" target="_blank" rel="noopener noreferrer" className="browse-link">
                          🔍 Browse All n8n Templates
                        </a>
                      </div>
                    )}

                    {expandedSection === 'appscript' && (
                      <div className="panel-content appscript-panel">
                        <h4>📊 Google Apps Script - Automate Your Sheets</h4>
                        <p className="panel-desc">
                          Apps Script is Google's free automation tool that works directly inside Google Sheets, Gmail, and Calendar. 
                          It's perfect for automating repetitive tasks while you explore other solutions!
                        </p>
                        
                        <div className="appscript-intro">
                          <div className="intro-highlight">
                            <span className="highlight-icon">💡</span>
                            <p><strong>Why Apps Script?</strong> It's free, runs in the cloud, and can automate boring Google Sheets tasks in minutes. No software to install!</p>
                          </div>
                        </div>

                        {isLoadingAppScript ? (
                          <div className="loading-appscript">
                            <div className="loading-spinner"></div>
                            <p>Generating a custom Apps Script for your {selections.subdomain} needs...</p>
                          </div>
                        ) : generatedAppScript ? (
                          <>
                            {/* Dynamic Data Example */}
                            <div className="example-section">
                              <h5>📋 {generatedAppScript.tableName}: {generatedAppScript.tableDescription}</h5>
                              <div className="dummy-table">
                                <table>
                                  <thead>
                                    <tr>
                                      {generatedAppScript.columns.map((col, i) => (
                                        <th key={i}>{col}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {generatedAppScript.sampleData.map((row, i) => (
                                      <tr key={i}>
                                        {row.map((cell, j) => (
                                          <td key={j}>{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Dynamic Apps Script */}
                            <div className="example-section">
                              <h5>⚡ {generatedAppScript.scriptDescription}</h5>
                              <div className="code-block">
                                <pre>{generatedAppScript.scriptCode}</pre>
                                <button 
                                  className={`copy-code-btn ${copiedPrompt === 'appscript-code' ? 'copied' : ''}`}
                                  onClick={() => copyToClipboard(generatedAppScript.scriptCode, 'appscript-code')}
                                >
                                  {copiedPrompt === 'appscript-code' ? '✓ Copied!' : '📋 Copy Code'}
                                </button>
                              </div>
                              <p className="trigger-tip">⏰ <strong>Suggested trigger:</strong> {generatedAppScript.triggerSuggestion}</p>
                            </div>
                          </>
                        ) : (
                          <div className="generate-script-cta">
                            <p>Click below to generate a custom Apps Script example based on your "{selections.subdomain}" needs:</p>
                            <button className="generate-btn" onClick={generateAppScript}>
                              ✨ Generate Custom Script
                            </button>
                          </div>
                        )}

                        {/* How to use */}
                        <div className="how-to-section">
                          <h5>🚀 How to add this to your Google Sheet:</h5>
                          <ol>
                            <li>Open your Google Sheet</li>
                            <li>Go to <strong>Extensions → Apps Script</strong></li>
                            <li>Paste the code and click <strong>Run</strong></li>
                            <li>Grant permissions when asked</li>
                          </ol>
                        </div>

                        {/* ChatGPT Prompt for Custom Script */}
                        <div className="chatgpt-prompt-section">
                          <h5>🤖 Want an even more customized script?</h5>
                          <p>Copy this prompt and paste it in ChatGPT for a fully tailored solution:</p>
                          <div className="prompt-box">
                            <pre>{`I need a Google Apps Script for my Google Sheet. Here's my situation:

**My Goal:** ${selections.subdomain} automation for ${domainName}
**What I want to automate:** ${selections.details || 'Automate repetitive tasks in my spreadsheet'}
**My data columns:** ${generatedAppScript ? generatedAppScript.columns.join(', ') : '[Describe your columns - e.g., Name, Email, Status, Date]'}

Please provide:
1. Complete Apps Script code with comments explaining each part
2. Step-by-step instructions on how to add this to my Google Sheet
3. How to set up automatic triggers (daily/hourly run)
4. Any permissions I need to grant
5. How to test it safely before running on real data

Make the code beginner-friendly with clear variable names.`}</pre>
                            <button 
                              className={`copy-code-btn ${copiedPrompt === 'appscript-prompt' ? 'copied' : ''}`}
                              onClick={() => copyToClipboard(`I need a Google Apps Script for my Google Sheet. Here's my situation:

**My Goal:** ${selections.subdomain} automation for ${domainName}
**What I want to automate:** ${selections.details || 'Automate repetitive tasks in my spreadsheet'}
**My data columns:** ${generatedAppScript ? generatedAppScript.columns.join(', ') : '[Describe your columns - e.g., Name, Email, Status, Date]'}

Please provide:
1. Complete Apps Script code with comments explaining each part
2. Step-by-step instructions on how to add this to my Google Sheet
3. How to set up automatic triggers (daily/hourly run)
4. Any permissions I need to grant
5. How to test it safely before running on real data

Make the code beginner-friendly with clear variable names.`, 'appscript-prompt')}
                            >
                              {copiedPrompt === 'appscript-prompt' ? '✓ Copied!' : '📋 Copy Prompt for ChatGPT'}
                            </button>
                          </div>
                          <p className="prompt-tip">
                            💡 <strong>Pro tip:</strong> The prompt already includes your context. Paste it in ChatGPT and get detailed implementation instructions!
                          </p>
                        </div>

                        <div className="appscript-footer">
                          <p>✨ Apps Script is a great way to start automating while you evaluate other solutions. It's free and you own the code!</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Summary & CTA - Compact */}
                <div className="summary-slim">
                  <div className="summary-text">
                    <h4>📋 What's Next?</h4>
                    <p><strong>Option 1:</strong> Try the recommended tools above (request demos)</p>
                    <p><strong>Option 2:</strong> DIY with prompts + n8n + Google Scripts</p>
                    <p><strong>Need help?</strong> <a href="mailto:hello@ikshan.ai">hello@ikshan.ai</a></p>
                  </div>
                  <div className="summary-actions">
                    <button className="action-btn primary" onClick={() => setExpandedSection('prompts')}>
                      View All Prompts
                    </button>
                    <button className="action-btn secondary" onClick={() => window.location.reload()}>
                      Start Over
                    </button>
                  </div>
                </div>

                <p className="email-note">📧 Report sent to <strong>{selections.email}</strong></p>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="horizontal-chat">
      {/* Progress Bar */}
      <div className="progress-header">
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => index < currentStep && goToStep(index)}
            >
              <div className="step-indicator">
                {index < currentStep ? (
                  <Check size={14} />
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              <span className="step-label">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Cards Container */}
      <div className="cards-viewport">
        <div 
          ref={cardsContainerRef}
          className={`cards-container ${direction}`}
        >
          <div 
            className={`step-card ${isAnimating ? 'animating' : ''}`}
            key={steps[currentStep].id}
          >
            <div className="card-inner">
              {renderStepContent(steps[currentStep].id)}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="navigation-footer">
        <button 
          className="nav-btn prev"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <div className="step-counter">
          {currentStep + 1} / {steps.length}
        </div>
        <button 
          className="nav-btn next"
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
          style={{ visibility: currentStep === steps.length - 1 ? 'hidden' : 'visible' }}
        >
          Skip
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatBotHorizontal;
