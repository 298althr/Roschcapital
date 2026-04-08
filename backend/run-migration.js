const { execSync } = require('child_process');

console.log('Running Prisma migration...');
try {
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
