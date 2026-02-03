// Simple local dev server for API routes
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Import API handlers
import chatHandler from './api/chat.js';
import searchCompaniesHandler from './api/search-companies.js';
import companiesHandler from './api/companies.js';
import speakHandler from './api/speak.js';
import marketIntelligenceHandler from './api/market-intelligence.js';

// API routes
app.post('/api/chat', async (req, res) => {
  await chatHandler(req, res);
});

app.post('/api/search-companies', async (req, res) => {
  await searchCompaniesHandler(req, res);
});

app.get('/api/companies', async (req, res) => {
  await companiesHandler(req, res);
});

app.post('/api/speak', async (req, res) => {
  await speakHandler(req, res);
});

app.post('/api/market-intelligence', async (req, res) => {
  await marketIntelligenceHandler(req, res);
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API routes:`);
  console.log(`   - POST /api/chat`);
  console.log(`   - POST /api/search-companies`);
  console.log(`   - GET /api/companies`);
  console.log(`   - POST /api/speak (TTS)`);
  console.log(`   - POST /api/market-intelligence`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`   Frontend: Serving built files from /dist`);
  }
});
