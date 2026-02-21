import type { FastifyInstance } from 'fastify';
import { aiService } from '../services/ai.service.js';
import type { AIGenerateRequest, AIGenerateResponse } from '../../../shared/types/character.js';

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function aiRoutes(fastify: FastifyInstance) {
  // Check AI service availability
  fastify.get('/ai/status', async (request, reply) => {
    return {
      available: aiService.isAvailable(),
      model: aiService.getModel(),
      provider: 'openrouter',
    };
  });

  // Get AI generation prompt
  fastify.get('/ai/prompt', async (request, reply) => {
    try {
      const promptPath = join(__dirname, '../../../docs/ai-generation-prompt.md');
      const promptContent = await readFile(promptPath, 'utf-8');

      // Find the prompt section - starts after "COMPLETE PROMPT" header
      // and ends before the next markdown section
      const startMarker = '## 🎨 COMPLETE PROMPT (Copy Everything Below)';
      const startIndex = promptContent.indexOf(startMarker);

      if (startIndex === -1) {
        // Fallback: just return whole content
        return { prompt: promptContent };
      }

      // Find the first ``` after the start marker
      const firstCodeBlock = promptContent.indexOf('```', startIndex);
      if (firstCodeBlock === -1) {
        return { prompt: promptContent };
      }

      // Find the section end (next ## or --- or end of file)
      let endIndex = promptContent.indexOf('\n---\n', firstCodeBlock);
      if (endIndex === -1) {
        endIndex = promptContent.indexOf('\n## ', firstCodeBlock + 10);
      }
      if (endIndex === -1) {
        endIndex = promptContent.length;
      }

      // Extract the content between first ``` and the section end
      const fullSection = promptContent.substring(firstCodeBlock, endIndex);

      // Remove the opening and closing ``` markers
      const prompt = fullSection
        .replace(/^```\n/, '')  // Remove opening ```
        .replace(/\n```\s*$/, '') // Remove closing ```
        .trim();

      return { prompt };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to load AI prompt',
      });
    }
  });

  // Generate character from description
  fastify.post<{ Body: AIGenerateRequest }>('/ai/generate', async (request, reply) => {
    try {
      const { description, gridSize } = request.body;

      if (!description || description.trim().length === 0) {
        return reply.status(400).send({
          error: 'Description is required',
        });
      }

      if (!aiService.isAvailable()) {
        return reply.status(503).send({
          error: 'AI service not available. Please configure OPENROUTER_API_KEY in .env file. Get your free key at: https://openrouter.ai/keys',
        });
      }

      const resolvedGridSize = gridSize ?? 32;
      fastify.log.info(`Generating character: "${description}" (${resolvedGridSize}×${resolvedGridSize})`);

      const character = await aiService.generateCharacter(description, resolvedGridSize);

      fastify.log.info(`Character generated: ${character.name}`);

      return { character } as AIGenerateResponse;
    } catch (error) {
      fastify.log.error(error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      reply.status(500).send({
        error: `Failed to generate character: ${errorMessage}`,
      });
    }
  });
}
