import { useState } from 'react';
import { Package } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import ChatBot from './components/ChatBot';
import ProductSection from './components/ProductSection';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function AppContent() {
  const [showProducts, setShowProducts] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <img src="/logo iskan 5.svg" alt="Ikshan Logo" className="logo-image" />
          <span className="logo-text">Ikshan</span>
        </div>
        <button
          className="products-button"
          onClick={() => setShowProducts(true)}
          aria-label="View Products"
          title="View our AI Products"
        >
          <Package size={20} />
        </button>
      </header>

      <main className="main-content">
        <section className="hero-chat-section" id="chat">
          <ChatBot />
        </section>
      </main>

      {/* Products Page Overlay */}
      {showProducts && (
        <div className="products-page-overlay">
          <div className="products-page-header">
            <button
              className="back-to-chat-button"
              onClick={() => setShowProducts(false)}
            >
              ← Back to Chat
            </button>
            <h1>Our AI Products</h1>
          </div>
          <div className="products-page-content">
            <ProductSection />
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>&copy; 2025 Ikshan. All rights reserved. Empowering businesses with AI innovation.</p>
      </footer>

      <Analytics />
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
