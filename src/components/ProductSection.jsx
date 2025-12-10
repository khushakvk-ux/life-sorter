import { ShoppingCart, Scale, Users, ArrowRight, Sparkles } from 'lucide-react';
import './ProductSection.css';

const ProductSection = () => {
  const products = [
    {
      id: 1,
      name: 'ecommerce optimizer',
      tagline: 'AI-Powered SEO for E-commerce',
      description: 'Maximize your e-commerce success with AI-powered SEO optimization for Amazon and Flipkart. Boost visibility, drive sales, and dominate the marketplace.',
      icon: ShoppingCart,
      color: '#fbbf24',
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      features: ['Smart Keyword Optimization', 'Competitor Analysis', 'Real-time Performance Tracking'],
      available: true
    },
    {
      id: 2,
      name: 'Samarth',
      tagline: 'Coming Soon',
      description: 'AI-assisted legal documentation tracking and management platform.',
      icon: Scale,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      features: ['Document Auto-Classification', 'Compliance Monitoring', 'Intelligent Search & Retrieval'],
      available: false
    },
    {
      id: 3,
      name: 'Gati',
      tagline: 'Coming Soon',
      description: 'AI-powered central hub for HR and management operations.',
      icon: Users,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      features: ['Automated Workflows', 'Performance Analytics', 'Smart Resource Allocation'],
      available: false
    }
  ];

  return (
    <div className="product-section">
      <div className="section-header">
        <h1>Products</h1>
        <p className="section-subtitle">
          AI solutions designed to transform your business operations
        </p>
      </div>

      <div className="products-grid">
        {products.map((product) => {
          const IconComponent = product.icon;
          return (
            <div key={product.id} className="product-card">
              <div className="product-card-inner">
                <div className="product-icon" style={{ background: product.gradient }}>
                  <IconComponent size={24} />
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

                <button
                  className={`product-cta ${!product.available ? 'disabled' : ''}`}
                  style={{ background: product.available ? product.gradient : 'rgba(255, 255, 255, 0.05)' }}
                  disabled={!product.available}
                >
                  <span>{product.available ? 'Learn More' : 'Coming Soon'}</span>
                  {product.available && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-footer">
        <p>© 2025 Ikshan. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ProductSection;
