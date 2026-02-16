import { ArrowLeft, Target, Zap, Brain, TrendingUp, ShoppingCart, Users, Youtube, Sparkles, FileText, Shield, Rocket, BarChart3, Lightbulb, Cpu, Linkedin } from 'lucide-react';
import './About.css';

const About = ({ onBack }) => {
  const problems = [
    { icon: Shield, title: 'The Cost Barrier', desc: 'Elite growth teams and specialized agencies drain your runway.' },
    { icon: Brain, title: 'The AI Overwhelm', desc: 'The AI landscape is noisy. Founders waste hours trying to piece together fragmented tools instead of actually using them to drive revenue.' },
    { icon: Target, title: 'Blind Spots in Growth', desc: "Without the bandwidth for deep market, competitor, and internal analysis, companies miss hidden gaps in their customer funnels, brand positioning, and core value propositions." },
    { icon: Zap, title: 'The Execution Bottleneck', desc: 'Even when a strategy is clear, executing complex operational, sales, and marketing tasks delays momentum and burns out small teams.' },
  ];

  const howItWorks = [
    { icon: BarChart3, title: 'Deep Analysis', desc: 'Through our AI Agents, Ikshan deeply analyzes your overall company, your competitors, and the market. We build the massive context needed to pinpoint the exact gaps holding you back.' },
    { icon: Lightbulb, title: 'Custom Strategy', desc: 'From there, we hand you a customized action plan covering over 150+ revenue-growth categories. Generate more leads, improve sales conversion, build bulletproof strategy.' },
    { icon: Cpu, title: 'One-Click Execution', desc: "We don't stop at strategy. Ikshan connects you directly to the best DIY automation and AI tools, letting you execute complex tasks with a single click\u2014all before you ever need to hire." },
  ];

  const pillars = [
    { icon: TrendingUp, title: 'Lead Generation', desc: 'Marketing, SEO, and Social.' },
    { icon: Users, title: 'Sales & Retention', desc: 'Calling, Support, and Account Expansion.' },
    { icon: Brain, title: 'Business Strategy', desc: 'Market Intelligence and Organizational Design.' },
    { icon: Zap, title: 'Save Time', desc: 'Automation Workflows, Operations, Finance, and Admin.' },
  ];

  const products = [
    { icon: ShoppingCart, title: 'Ecom Listing SEO', desc: 'Optimize your listings and drive a 30-40% improvement in revenue.' },
    { icon: Target, title: 'Learn from Competitors', desc: 'Reverse-engineer and deploy the best growth hacks in your industry.' },
    { icon: Users, title: 'B2B Lead Gen', desc: 'Scrape and secure hot, high-intent leads from platforms like Reddit and LinkedIn.' },
    { icon: Youtube, title: 'YouTube Helper', desc: 'End-to-end video strategy, including script writing, thumbnail generation, and keyword analysis.' },
    { icon: Sparkles, title: 'AI Team Professionals', desc: 'Deploy specialized AI agents for Marketing, Ops, HR, and more.' },
    { icon: FileText, title: 'Content Creator', desc: 'Dominate SEO, Instagram, Blogs, and LinkedIn with high-converting, automated content.' },
  ];

  return (
    <div className="about-page">
      <div className="about-header-bar">
        <button className="about-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>

      <div className="about-content">
        {/* Hero */}
        <section className="about-hero">
          <div className="about-hero-left">
            <p className="about-eyebrow">About Ikshan</p>
            <h1 className="about-hero-title">
              Elite Growth Strategy & Execution<span className="about-highlight">&mdash;Unlocked by AI.</span>
            </h1>
          </div>
          <div className="about-hero-right">
            <p className="about-hero-desc">
              Most small businesses and startups leave money on the table every single day. Not because they lack vision, but because hiring elite, full-time growth experts or agencies is financially out of reach. At the same time, founders know they need AI to scale, but figuring out how to practically integrate it across their operations is confusing and time-consuming.
            </p>
            <p className="about-hero-desc">
              Ikshan was built to change that. We believe that world-class business growth shouldn't be a luxury reserved for massive enterprises. We are bridging the gap between high-level strategy and everyday execution by giving you on-demand AI growth expertise that diagnoses your business gaps, ships the perfect strategy, and provides the DIY tools to execute it.
            </p>
          </div>
        </section>

        <div className="about-divider" />

        {/* Problem Section */}
        <section className="about-section">
          <h2 className="about-section-title">The Problem We Are Solving</h2>
          <p className="about-section-desc">
            Growing a business is hard. Scaling it without breaking the bank is even harder. We built Ikshan to dismantle the four biggest roadblocks founders face:
          </p>
          <div className="about-grid">
            {problems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="about-card">
                  <div className="about-card-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="about-divider" />

        {/* How It Works */}
        <section className="about-section">
          <h2 className="about-section-title">How Ikshan Works</h2>
          <p className="about-section-subtitle">Your AI-Powered Growth Engine</p>
          <p className="about-section-desc">
            Ikshan doesn't just tell you what to do; it helps you do it.
          </p>
          <div className="about-how-grid">
            {howItWorks.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="about-how-card">
                  <div className="about-how-num">{i + 1}</div>
                  <div className="about-how-icon">
                    <Icon size={22} />
                  </div>
                  <div className="about-how-text">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="about-divider" />

        {/* Journey Section */}
        <section className="about-section">
          <h2 className="about-section-title">The Ikshan Journey</h2>
          <p className="about-section-desc">
            It starts with a simple promise: <strong>Make your business run better&mdash;starting today.</strong> You select a goal, and we instantly build your action plan across four core pillars:
          </p>
          <div className="about-pillars">
            {pillars.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="about-pillar">
                  <div className="about-pillar-icon">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="about-callout">
            <Rocket size={18} />
            <p>
              <strong>Ready to go deeper?</strong> The Ikshan Paid Journey unlocks a profound audit of your market, customers, and funnels, paired with a comprehensive 1-month AI-powered execution plan tailored exactly to your business.
            </p>
          </div>
        </section>

        <div className="about-divider" />

        {/* Arsenal Section */}
        <section className="about-section">
          <h2 className="about-section-title">Our Arsenal</h2>
          <p className="about-section-subtitle">Built for Immediate Impact</p>
          <p className="about-section-desc">
            Ikshan comes equipped with a growing suite of specialized AI products designed to replace expensive agency retainers with instant, scalable output:
          </p>
          <div className="about-products">
            {products.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="about-product-card">
                  <div className="about-product-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="about-divider" />

        {/* Founder */}
        <section className="about-section about-founder">
          <h2 className="about-section-title">Meet the Founder</h2>
          <div className="about-founder-card">
            <div className="about-founder-avatar">VG</div>
            <div className="about-founder-info">
              <h3>Vivek Gaur</h3>
              <p className="about-founder-role">Founder, Ikshan</p>
              <p className="about-founder-bio">
                Vivek is a serial entrepreneur and growth operator who understands the mechanics of scale from the ground up. Before founding Ikshan, Vivek served as the Chief Growth Officer (CGO) at Physics Wallah (PW), where he engineered and led the company's hyper-growth trajectory from its early startup days all the way to a historic IPO.
              </p>
              <p className="about-founder-bio">
                With a track record that includes two previously acquired startups, Vivek brings a fiercely pragmatic approach to business building. He has spent his career mastering the transition from raw startup hustle to highly efficient, systemized scale.
              </p>
              <a
                href="https://www.linkedin.com/in/vivek88/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-founder-linkedin"
              >
                <Linkedin size={16} />
                <span>Connect on LinkedIn</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
