# Ikshan - AI-Powered Business Solutions

A premium, modern website for Ikshan featuring an interactive AI chatbot and showcase of innovative AI products.

## Features

- **Interactive AI Chatbot**: Engage with visitors through a beautiful, ChatGPT/Claude-style chat interface
- **Premium Product Showcase**: Highlight three flagship products:
  - **Shakti**: Best in class AI SEO optimizer for Amazon and Flipkart
  - **Samarth**: AI-assisted legal documentation tracker and manager
  - **Gati**: AI-powered central hub for HR and management panel
- **Responsive Design**: Fully responsive layout that works on all devices
- **Modern UI/UX**: Premium glass-morphism effects, smooth animations, and gradient designs
- **Two-Panel Layout**: Split-screen design with chatbot on the left and products on the right

## Tech Stack

- **React 18** - Modern JavaScript framework
- **Vite** - Lightning-fast build tool
- **Lucide React** - Beautiful icon library
- **CSS3** - Advanced styling with gradients, animations, and backdrop filters

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd life-sorter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
life-sorter/
├── src/
│   ├── components/
│   │   ├── ChatBot.jsx          # AI chatbot component
│   │   ├── ChatBot.css          # Chatbot styles
│   │   ├── ProductSection.jsx   # Products showcase
│   │   └── ProductSection.css   # Product styles
│   ├── App.jsx                  # Main app component
│   ├── App.css                  # App-level styles
│   ├── index.css                # Global styles
│   └── main.jsx                 # App entry point
├── index.html                   # HTML template
├── package.json                 # Dependencies
└── vite.config.js              # Vite configuration
```

## Features in Detail

### Chatbot Interface
- Real-time message simulation
- Typing indicators
- Message timestamps
- Smooth animations
- Auto-scrolling to latest messages
- Premium gradient design

### Product Section
- Interactive product cards
- Hover effects with glow animations
- Feature highlights for each product
- Call-to-action buttons
- Responsive grid layout

### Design System
- Color palette: Purple/indigo gradients with dark backgrounds
- Typography: Inter font family
- Glass-morphism effects
- Smooth transitions and animations
- Mobile-first responsive design

## Customization

### Changing Colors
Edit the gradient values in the CSS files to match your brand colors:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adding More Products
Edit `src/components/ProductSection.jsx` and add items to the `products` array.

### Customizing Chatbot Responses
Modify the bot response logic in `src/components/ChatBot.jsx` in the `handleSend` function.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for your own purposes.

## Contact

For questions or support, reach out through the chatbot on our website!
