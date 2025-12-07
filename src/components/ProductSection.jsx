import { ShoppingCart, Scale, Users, ArrowRight, Sparkles } from 'lucide-react';
import './ProductSection.css';

const ProductSection = () => {
  const products = [
    {
      id: 1,
      name: 'Shakti',
      tagline: 'Best in Class AI SEO Optimizer',
      description: 'Maximize your e-commerce success with AI-powered SEO optimization for Amazon and Flipkart. Boost visibility, drive sales, and dominate the marketplace.',
      icon: ShoppingCart,
      color: '#fbbf24',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      features: ['Smart Keyword Optimization', 'Competitor Analysis', 'Real-time Performance Tracking']
    },
    {
      id: 2,
      name: 'Samarth',
      tagline: 'AI-Assisted Legal Documentation',
      description: 'Streamline your legal workflow with intelligent documentation tracking and management. Stay organized, compliant, and efficient with cutting-edge AI assistance.',
      icon: Scale,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: ['Document Auto-Classification', 'Compliance Monitoring', 'Intelligent Search & Retrieval']
    },
    {
      id: 3,
      name: 'Gati',
      tagline: 'AI-Powered Central Hub for HR',
      description: 'Transform your HR and management operations with a unified, intelligent platform. Empower your team, streamline processes, and make data-driven decisions.',
      icon: Users,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: ['Automated Workflows', 'Performance Analytics', 'Smart Resource Allocation']
    }
  ];

  return (
    <div className="product-section">
      <div className="section-header">
        <div className="sparkle-icon">
          <Sparkles size={32} />
        </div>
        <h1>Our Premium Products</h1>
        <p className="section-subtitle">
          Innovative AI solutions designed to transform your business
        </p>
      </div>

      <div className="products-grid">
        {products.map((product) => {
          const IconComponent = product.icon;
          return (
            <div key={product.id} className="product-card">
              <div className="product-card-inner">
                <div className="product-icon" style={{ background: product.gradient }}>
                  <IconComponent size={32} />
                </div>

                <div className="product-header">
                  <h2 className="product-name">{product.name}</h2>
                  <p className="product-tagline">{product.tagline}</p>
                </div>

                <p className="product-description">{product.description}</p>

                <div className="product-features">
                  {product.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <div className="feature-dot" style={{ background: product.color }}></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button className="product-cta" style={{ background: product.gradient }}>
                  <span>Learn More</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="card-glow" style={{ background: product.gradient }}></div>
            </div>
          );
        })}
      </div>

      <div className="section-footer">
        <p>Empowering businesses with cutting-edge AI technology</p>
      </div>
    </div>
  );
};

export default ProductSection;
