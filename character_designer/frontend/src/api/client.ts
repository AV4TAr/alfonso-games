import type { Character, AIGenerateRequest, AIGenerateResponse } from '../../../shared/types/character';

const API_BASE = 'http://localhost:5174/api';

class APIClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Character endpoints
  async getCharacters(): Promise<Character[]> {
    return this.request<Character[]>('/characters');
  }

  async getCharacter(id: number): Promise<Character> {
    return this.request<Character>(`/characters/${id}`);
  }

  async createCharacter(character: Omit<Character, 'id'>): Promise<Character> {
    return this.request<Character>('/characters', {
      method: 'POST',
      body: JSON.stringify(character),
    });
  }

  async updateCharacter(id: number, updates: Partial<Character>): Promise<Character> {
    return this.request<Character>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCharacter(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/characters/${id}`, {
      method: 'DELETE',
    });
  }

  // AI endpoints
  async checkAIStatus(): Promise<{ available: boolean }> {
    return this.request<{ available: boolean }>('/ai/status');
  }

  async generateCharacter(description: string, gridSize?: number): Promise<Character> {
    const response = await this.request<AIGenerateResponse>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ description, gridSize } as AIGenerateRequest),
    });
    return response.character;
  }
}

export const apiClient = new APIClient();
