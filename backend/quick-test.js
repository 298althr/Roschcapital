/**
 * Quick test to check if backend is accessible
 */

import https from 'https';

const urls = [
  'https://serene-reverence-production.up.railway.app/api/v1/currencies',
  'https://gatwickbank.up.railway.app/api/v1/currencies'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\nTesting: ${url}`);
    
    https.get(url, (res) => {
      console.log(`✅ Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Response: ${JSON.stringify(json).substring(0, 100)}...`);
          resolve(true);
        } catch (e) {
          console.log(`⚠️  Response: ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🔍 QUICK BACKEND CONNECTIVITY TEST');
  console.log('═══════════════════════════════════════');
  
  for (const url of urls) {
    await testUrl(url);
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('✅ Test Complete');
  console.log('═══════════════════════════════════════\n');
}

main();
