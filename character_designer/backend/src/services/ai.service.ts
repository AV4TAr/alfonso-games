import OpenAI from 'openai';
import { config } from '../config.js';
import type { Character } from '../../../shared/types/character.js';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// AI Provider interface (supports future local models)
export interface AIProvider {
  generateCharacter(description: string, gridSize?: number): Promise<Character>;
  isAvailable(): boolean;
}

// OpenRouter API Provider (supports 100+ models)
class OpenRouterProvider implements AIProvider {
  private client: OpenAI;
  private systemPrompt: string | null = null;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openRouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5173', // For OpenRouter credits
        'X-Title': 'Character Designer', // For OpenRouter dashboard
      },
    });
  }

  async loadSystemPrompt(): Promise<void> {
    if (this.systemPrompt) return;

    try {
      const promptPath = join(__dirname, '../../../docs/ai-generation-prompt.md');
      const promptContent = await readFile(promptPath, 'utf-8');

      // Extract the actual prompt from the markdown (between the code blocks)
      const match = promptContent.match(/```\n([\s\S]*?)\n```/);
      if (match) {
        this.systemPrompt = match[1].trim();
      } else {
        this.systemPrompt = promptContent;
      }
    } catch (error) {
      console.error('Failed to load AI generation prompt:', error);
      throw new Error('AI generation prompt not found');
    }
  }

  /**
   * Process prompt template by substituting {{VAR}} placeholders with computed values
   */
  private processPromptTemplate(prompt: string, gridSize: number): string {
    const vars: Record<string, string> = {
      GRID_SIZE: String(gridSize),
      MAX_INDEX: String(gridSize - 1),
      MAX_INDEX_MINUS_ONE: String(gridSize - 2),
      TOTAL_PIXELS: String(gridSize * gridSize),
      PAD_TOP: String(Math.floor(gridSize * 0.22)),
      HEAD_START: String(Math.floor(gridSize * 0.25)),
      HEAD_END: String(Math.floor(gridSize * 0.38)),
      BODY_START: String(Math.floor(gridSize * 0.40)),
      BODY_END: String(Math.floor(gridSize * 0.70)),
      LEGS_START: String(Math.floor(gridSize * 0.72)),
      LEGS_END: String(Math.floor(gridSize * 0.88)),
      PAD_BOTTOM: String(Math.floor(gridSize * 0.90)),
      COL_PAD_LEFT: String(Math.floor(gridSize * 0.28)),
      COL_CHAR_START: String(Math.floor(gridSize * 0.30)),
      COL_CHAR_END: String(Math.floor(gridSize * 0.68)),
      COL_PAD_RIGHT: String(Math.floor(gridSize * 0.70)),
      COL_CENTER: String(Math.floor(gridSize / 2)),
      ROW_CENTER: String(Math.floor(gridSize / 2)),
    };
    return prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
  }

  isAvailable(): boolean {
    return !!config.openRouterApiKey;
  }

  async generateCharacter(description: string, gridSize: number = 32): Promise<Character> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API key not configured');
    }

    await this.loadSystemPrompt();

    // Process template variables in the prompt for the requested grid size
    const processedPrompt = this.processPromptTemplate(this.systemPrompt!, gridSize);

    // Enhance user description with pixel art context
    const enhancedDescription = `${description}, ${gridSize}x${gridSize} pixel art game character sprite`;

    const fullPrompt = `${processedPrompt}\n\n=== YOUR CHARACTER REQUEST ===\n\n${enhancedDescription}\n\nNOW GENERATE THE CHARACTER JSON:`;

    try {
      const response = await this.client.chat.completions.create({
        model: config.openRouterModel,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error('No response from OpenRouter API');
      }

      // Extract JSON from response (handles markdown code blocks)
      const characterJson = this.extractCharacterJSON(messageContent, gridSize);
      return characterJson;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenRouter API Error: ${error.message}`);
      }
      throw error;
    }
  }

  private extractCharacterJSON(text: string, gridSize: number = 32): Character {
    // Try to extract JSON from markdown code blocks first
    let jsonStr = text;

    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // If no code block, try to find JSON object directly
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }

    // Remove any leading/trailing whitespace
    jsonStr = jsonStr.trim();

    try {
      const character = JSON.parse(jsonStr) as Character;

      // Validate character structure
      if (!character.name || !character.type || !character.pixelData) {
        throw new Error('Invalid character structure: missing required fields');
      }

      if (!Array.isArray(character.pixelData)) {
        throw new Error('Invalid pixel data: pixelData must be an array');
      }

      // Detect format: palette (number[][]) or legacy (hex string[][])?
      const hasPalette = character.palette && Array.isArray(character.palette);
      const firstCell = character.pixelData[0]?.[0];
      const isNumberFormat = typeof firstCell === 'number';

      // Auto-fix grid size: accept smaller grids, reject larger ones
      const rows = character.pixelData.length;

      // Reject if too many rows (can't crop character)
      if (rows > gridSize) {
        throw new Error(`Invalid pixel data: grid too large (${rows} rows), maximum is ${gridSize}`);
      }

      // Pad rows if too few (use 0 for palette format, null for legacy)
      if (isNumberFormat) {
        const numData = character.pixelData as number[][];
        while (numData.length < gridSize) {
          numData.push(new Array(gridSize).fill(0));
        }
        for (let i = 0; i < numData.length; i++) {
          if (!Array.isArray(numData[i])) {
            throw new Error(`Invalid pixel data: row ${i} is not an array`);
          }
          const cols = numData[i].length;
          if (cols > gridSize) {
            throw new Error(`Invalid pixel data: row ${i} too wide (${cols} columns), maximum is ${gridSize}`);
          }
          while (numData[i].length < gridSize) {
            numData[i].push(0);
          }
        }
      } else {
        const strData = character.pixelData as (string | null)[][];
        while (strData.length < gridSize) {
          strData.push(new Array(gridSize).fill(null));
        }
        for (let i = 0; i < strData.length; i++) {
          if (!Array.isArray(strData[i])) {
            throw new Error(`Invalid pixel data: row ${i} is not an array`);
          }
          const cols = strData[i].length;
          if (cols > gridSize) {
            throw new Error(`Invalid pixel data: row ${i} too wide (${cols} columns), maximum is ${gridSize}`);
          }
          while (strData[i].length < gridSize) {
            strData[i].push(null);
          }
        }
      }

      // Validate palette if present
      if (hasPalette && character.palette) {
        if (!Array.isArray(character.palette) || character.palette.length === 0) {
          throw new Error('Invalid palette: must be non-empty array');
        }
        // Verify all palette entries are hex colors
        for (const color of character.palette) {
          if (typeof color !== 'string' || !color.match(/^#[0-9a-fA-F]{6}$/)) {
            throw new Error(`Invalid palette color: ${color} (must be #RRGGBB format)`);
          }
        }
      }

      // Ensure gridSize is set correctly on the returned character
      character.gridSize = gridSize;

      return character;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse character JSON: ${error.message}`);
      }
      throw error;
    }
  }
}

// AI Service - uses OpenRouter for access to 100+ models
export class AIService {
  private provider: AIProvider;

  constructor() {
    this.provider = new OpenRouterProvider();
  }

  async generateCharacter(description: string, gridSize: number = 32): Promise<Character> {
    if (!this.provider.isAvailable()) {
      throw new Error('OpenRouter API key not configured. Get your free key at: https://openrouter.ai/keys');
    }

    return this.provider.generateCharacter(description, gridSize);
  }

  isAvailable(): boolean {
    return this.provider.isAvailable();
  }

  getModel(): string {
    return config.openRouterModel;
  }
}

// Singleton instance
export const aiService = new AIService();
