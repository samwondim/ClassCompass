#!/usr/bin/env node

console.log('🧪 ClassCompass Mini App Test Checklist\n');

// Check environment variables
const requiredEnvVars = ['BOT_TOKEN', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

console.log('📋 Environment Variables:');
requiredEnvVars.forEach(envVar => {
  const exists = process.env[envVar];
  console.log(`  ${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'Set' : 'Missing'}`);
});

if (missingEnvVars.length > 0) {
  console.log(`\n⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.log('   Please create a .env file with these variables.\n');
}

// Check if running
const isDevMode = process.argv.includes('--dev');
if (isDevMode) {
  console.log('\n🚀 Starting development server...');
  console.log('   After the server starts:');
  console.log('   1. Open another terminal');
  console.log('   2. Run: ngrok http 3000');
  console.log('   3. Use the https:// URL for BotFather\n');
} else {
  console.log('\n📱 Testing Instructions:');
  console.log('   1. Deploy to Vercel: vercel --prod');
  console.log('   2. Configure BotFather with your Vercel URL');
  console.log('   3. Test by opening your bot in Telegram');
  console.log('   4. Look for the Menu button at the bottom');
  console.log('   5. Tap it to open your Mini App\n');
}

console.log('🔗 Useful Links:');
console.log('   • BotFather: https://t.me/BotFather');
console.log('   • Telegram Bot Docs: https://core.telegram.org/bots/webapps');
console.log('   • Your Bot: https://t.me/' + (process.env.BOT_TOKEN ? 'your_bot_username' : 'YOUR_BOT_USERNAME'));
