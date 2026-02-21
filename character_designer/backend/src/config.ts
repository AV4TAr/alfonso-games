import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from backend directory
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || join(__dirname, '../../data/characters.db'),
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
} as const;

// Validate required config
if (!config.openRouterApiKey) {
  console.warn('⚠️  OPENROUTER_API_KEY not set in .env file. AI generation will not work.');
  console.warn('   Get your free API key at: https://openrouter.ai/keys');
}
