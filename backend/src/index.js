import express from 'express';
import cors from 'cors';
import * as helmetModule from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/app.js';
import prisma from './config/prisma.js';
import redis from './config/redis.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { scheduleAutomaticBackups } from './services/backupService.js';
import { processDueRecurringPayments } from './services/recurringPaymentService.js';

const helmet = helmetModule.default || helmetModule.helmet || helmetModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for Railway (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    }
  } : false
}));

// CORS configuration with logging
console.log('🔒 CORS Origins:', config.corsOrigin);
app.use(cors({ 
  origin: config.corsOrigin, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(morgan('dev'));

// Rate limiting middleware (apply to all routes)
app.use('/api', generalLimiter);

// Health check endpoint (before any other routes)
app.get('/healthz', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'rosch-capital-bank-backend',
    version: '1.0.1',
    timestamp: new Date().toISOString()
  });
});

// Serve uploaded files (MUST be before SPA fallback)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes with versioning
app.use('/api/v1', apiRouter);

// Legacy API route support
app.use('/api', apiRouter);

// Serve static files from frontend build (production only)
if (config.nodeEnv === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  
  // Serve static files, but skip API and uploads routes
  app.use(express.static(frontendDistPath, {
    index: false, // Don't serve index.html automatically
    setHeaders: (res, path) => {
      // Don't cache HTML files
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
  
  // Serve index.html for all non-API, non-uploads routes (SPA support)
  app.get('*', (req, res, next) => {
    // Don't serve index.html for API or uploads routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/healthz')) {
      return next(); // Pass to next handler (will be 404)
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server with error handling
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Schedule recurring payments processing (every 10 minutes)
    setInterval(processDueRecurringPayments, 10 * 60 * 1000);
    // Initial run after startup
    setTimeout(processDueRecurringPayments, 5000);
    
    const server = app.listen(config.port, () => {
      console.log(`✅ API listening on port ${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API endpoints available at http://localhost:${config.port}/api/v1`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('⏹️  SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
