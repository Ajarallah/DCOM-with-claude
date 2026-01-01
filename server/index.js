import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API endpoint for generating analysis with streaming
app.post('/api/generate-stream', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error: API key not found'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({
        error: 'Missing required fields: model and contents'
      });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const streamResult = await ai.models.generateContentStream({
      model,
      contents,
      config: config || {}
    });

    for await (const chunk of streamResult) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Stream generation error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Analysis generation failed',
        message: error.message
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

// API endpoint for non-streaming content generation
app.post('/api/generate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error: API key not found'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({
        error: 'Missing required fields: model and contents'
      });
    }

    const result = await ai.models.generateContent({
      model,
      contents,
      config: config || {}
    });

    res.json(result);

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      error: 'Analysis generation failed',
      message: error.message
    });
  }
});

// Handles any requests that don't match the ones above (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DCOM Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
