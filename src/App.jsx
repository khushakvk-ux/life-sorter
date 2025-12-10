import ChatBot from './components/ChatBot';
import ProductSection from './components/ProductSection';
import './App.css';

function App() {

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo-text">Ikshan</span>
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

export default App;
