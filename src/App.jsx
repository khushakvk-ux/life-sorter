import { useState } from 'react';
import { Package } from 'lucide-react';
import ChatBotHorizontal from './components/ChatBotHorizontal';
import ProductSection from './components/ProductSection';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function AppContent() {
  const [showProducts, setShowProducts] = useState(false);

  return (
    <div className="app">
      {/* Animated Background Elements */}
      <div className="bg-animation">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
        <div className="floating-orb orb-4"></div>
        <div className="particles">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="particle" style={{
              '--delay': `${Math.random() * 20}s`,
              '--duration': `${15 + Math.random() * 20}s`,
              '--x-start': `${Math.random() * 100}%`,
              '--x-end': `${Math.random() * 100}%`,
              '--size': `${2 + Math.random() * 4}px`,
              '--opacity': Math.random() * 0.5 + 0.2
            }}></div>
          ))}
        </div>
        <div className="grid-overlay"></div>
      </div>
      
      <header className="app-header">
        <div className="logo">
          <img src="/logo iskan 5.svg" alt="Ikshan Logo" className="logo-image" />
          <span className="logo-text">Ikshan</span>
        </div>
        
        <div className="header-controls">
          <button
            className="products-btn"
            onClick={() => setShowProducts(!showProducts)}
            aria-label="View Products"
            title="View Our Products"
          >
            <Package size={18} />
            <span>Products</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-chat-section" id="chat">
          <ChatBotHorizontal />
        </section>

        {/* Products Overlay */}
        {showProducts && (
          <div className="products-overlay">
            <div className="products-overlay-content">
              <button className="close-overlay" onClick={() => setShowProducts(false)}>
                ✕
              </button>
              <ProductSection />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Ikshan. All rights reserved. Empowering businesses with AI innovation.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
