import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';

export async function debugRoutes(fastify: FastifyInstance) {
  // Debug endpoint to check environment
  fastify.get('/debug/env', async () => {
    return {
      hasApiKey: !!config.anthropicApiKey,
      apiKeyLength: config.anthropicApiKey?.length || 0,
      apiKeyPrefix: config.anthropicApiKey?.substring(0, 10) || 'none',
      port: config.port,
      nodeEnv: config.nodeEnv,
    };
  });
}
