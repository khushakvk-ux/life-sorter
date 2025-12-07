import { useState } from 'react';
import ChatBot from './components/ChatBot';
import ProductSection from './components/ProductSection';
import { Menu, X } from 'lucide-react';
import './App.css';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">I</div>
          <span className="logo-text">Ikshan</span>
        </div>
        <nav className="nav-menu">
          <a href="#chat" className="nav-link">Chat</a>
          <a href="#products" className="nav-link">Products</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <a href="#chat" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Chat</a>
          <a href="#products" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Products</a>
          <a href="#about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <a href="#contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
        </div>
      )}

      <main className="main-content">
        <div className="panel chat-panel" id="chat">
          <ChatBot />
        </div>
        <div className="panel products-panel" id="products">
          <ProductSection />
        </div>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025 Ikshan. All rights reserved. Empowering businesses with AI innovation.</p>
      </footer>
    </div>
  );
}

export default App;
