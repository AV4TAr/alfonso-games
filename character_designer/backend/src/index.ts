import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { initializeDatabase } from './db/index.js';
import { characterRoutes } from './routes/characters.js';
import { aiRoutes } from './routes/ai.js';
import { debugRoutes } from './routes/debug.js';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

// CORS configuration
await fastify.register(cors, {
  origin: config.frontendUrl,
  credentials: true,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(characterRoutes, { prefix: '/api' });
await fastify.register(aiRoutes, { prefix: '/api' });
await fastify.register(debugRoutes, { prefix: '/api' });

// Initialize database
await initializeDatabase();

// Start server
try {
  await fastify.listen({ port: config.port, host: '0.0.0.0' });
  console.log('');
  console.log('🚀 Character Designer Backend');
  console.log(`📍 Server: http://localhost:${config.port}`);
  console.log(`🗄️  Database: ${config.databasePath}`);
  console.log(`🤖 AI Service: ${config.openRouterApiKey ? '✅ OpenRouter' : '❌ Not configured'}`);
  if (config.openRouterApiKey) {
    console.log(`   Model: ${config.openRouterModel}`);
  } else {
    console.log(`   Get your free API key at: https://openrouter.ai/keys`);
  }
  console.log('');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    await fastify.close();
    process.exit(0);
  });
}
