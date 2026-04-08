// Determine CORS origin based on environment
const getCorsOrigin = () => {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  
  // Railway deployment - allow all gatwickbank domains
  if (process.env.NODE_ENV === 'production') {
    return [
      'https://gatwickbank.up.railway.app',
      'https://gatwickbank-production.up.railway.app',
      /\.up\.railway\.app$/  // Allow all Railway subdomains
    ];
  }
  
  // Development
  return 'http://localhost:5173';
};

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  corsOrigin: getCorsOrigin(),
};
