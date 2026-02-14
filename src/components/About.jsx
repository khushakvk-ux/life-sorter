import { ArrowLeft, Target, Zap, Brain, TrendingUp, ShoppingCart, Users, Youtube, Sparkles, FileText, ArrowRight } from 'lucide-react';
import './About.css';

const About = ({ onBack }) => {
  const capabilities = [
    { icon: TrendingUp, title: 'Lead Generation', desc: 'Marketing, SEO, and Social media growth.' },
    { icon: Users, title: 'Sales & Retention', desc: 'Calling, support, and account expansion.' },
    { icon: Brain, title: 'Business Strategy', desc: 'Market intelligence and org design.' },
    { icon: Zap, title: 'Save Time', desc: 'Automation, operations, and admin.' },
  ];

  const products = [
    { icon: ShoppingCart, title: 'Ecom Listing SEO', desc: '30-40% revenue improvement' },
    { icon: Target, title: 'Competitor Intel', desc: 'Reverse-engineer growth hacks' },
    { icon: Users, title: 'B2B Lead Gen', desc: 'High-intent leads from Reddit & LinkedIn' },
    { icon: Youtube, title: 'YouTube Helper', desc: 'Scripts, thumbnails & keyword analysis' },
    { icon: Sparkles, title: 'AI Team', desc: 'Marketing, Ops, HR agents' },
    { icon: FileText, title: 'Content Creator', desc: 'SEO, blogs & social content' },
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
          <p className="about-eyebrow">About Ikshan</p>
          <h1 className="about-hero-title">
            Growth expertise,<br />
            <span className="about-highlight">powered by AI.</span>
          </h1>
          <p className="about-hero-desc">
            World-class business growth shouldn't be reserved for enterprises.
            Ikshan gives you on-demand AI expertise that diagnoses gaps, builds strategy, and provides the tools to execute.
          </p>
        </section>

        {/* How it works */}
        <section className="about-section">
          <div className="about-section-label">How it works</div>
          <div className="about-steps">
            <div className="about-step">
              <div className="about-step-num">1</div>
              <div>
                <h3>Select a goal</h3>
                <p>Tell us what matters most to your business right now.</p>
              </div>
            </div>
            <div className="about-step">
              <div className="about-step-num">2</div>
              <div>
                <h3>Get your action plan</h3>
                <p>AI analyzes your company, competitors, and market to build a custom strategy.</p>
              </div>
            </div>
            <div className="about-step">
              <div className="about-step-num">3</div>
              <div>
                <h3>Execute instantly</h3>
                <p>Use our AI tools to act on every recommendation with a single click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="about-section">
          <div className="about-section-label">Capabilities</div>
          <div className="about-caps-grid">
            {capabilities.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="about-cap">
                  <div className="about-cap-icon">
                    <Icon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Products */}
        <section className="about-section">
          <div className="about-section-label">Products</div>
          <div className="about-products">
            {products.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="about-product-row">
                  <div className="about-product-icon">
                    <Icon size={18} />
                  </div>
                  <div className="about-product-text">
                    <span className="about-product-name">{item.title}</span>
                    <span className="about-product-desc">{item.desc}</span>
                  </div>
                  <ArrowRight size={14} className="about-product-arrow" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Founder */}
        <section className="about-section about-founder">
          <div className="about-section-label">Founder</div>
          <div className="about-founder-card">
            <div className="about-founder-avatar">VG</div>
            <div className="about-founder-info">
              <h3>Vivek Gaur</h3>
              <p className="about-founder-role">Founder, Ikshan</p>
              <p className="about-founder-bio">
                Serial entrepreneur and former CGO at Physics Wallah, where he led the company's growth from startup to IPO. Two previously acquired startups under his belt.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
