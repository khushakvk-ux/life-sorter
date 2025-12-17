import { Moon, Droplet, Leaf } from 'lucide-react';
import ChatBot from './components/ChatBot';
import ProductSection from './components/ProductSection';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <img src="/ikshan logo.svg" alt="Ikshan Logo" className="logo-image" />
          <span className="logo-text">Ikshan</span>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Change theme"
          title={`Current: ${theme.charAt(0).toUpperCase() + theme.slice(1)} theme - Click to cycle`}
        >
          {theme === 'dark' && <Moon size={20} />}
          {theme === 'blue' && <Droplet size={20} />}
          {theme === 'green' && <Leaf size={20} />}
        </button>
      </header>

      <main className="main-content">
        <section className="hero-chat-section" id="chat">
          <ChatBot />
        </section>

        <section className="products-section-wrapper" id="products">
          <ProductSection />
        </section>
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
