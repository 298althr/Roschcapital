import dotenv from 'dotenv';

dotenv.config();

// Determine CORS origin based on environment
const getCorsOrigin = () => {
  if (process.env.CORS_ORIGIN) {
    // Support comma-separated origins
    if (process.env.CORS_ORIGIN.includes(',')) {
      return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    }
    return process.env.CORS_ORIGIN;
  }
  
  // Railway deployment - allow all Railway domains
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    return [
      'https://gatwickbank.up.railway.app',
      'https://serene-reverence-production.up.railway.app',
      'https://gatwickbank-production.up.railway.app',
      /\.up\.railway\.app$/  // Allow all Railway subdomains
    ];
  }
  
  // Development
  return 'http://localhost:5173';
};

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: getCorsOrigin(),
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '30d', // Increased from 7d to 30d for longer sessions
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  // Email configuration
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'noreply@roschcapital.com',
  frontendUrl: process.env.FRONTEND_URL || 'https://roschcapital.com',
};

export default config;
