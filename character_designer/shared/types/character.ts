// Shared types between frontend and backend

export type CharacterType = 'player' | 'enemy' | 'boss';

export interface Character {
  id?: number;
  name: string;
  type: CharacterType;
  game: string;
  version: number;
  gridSize: number;
  created: string;
  // New optimized format with color palette
  palette?: string[];
  // pixelData can be either:
  // - Old format: (string | null)[][] - direct hex colors
  // - New format: number[][] - palette indices (0 = transparent)
  pixelData: (string | null)[][] | number[][];
}

export interface CharacterVersion {
  id: number;
  characterId: number;
  version: number;
  pixelData: (string | null)[][];
  created: string;
}

export interface AIGenerateRequest {
  description: string;
  gridSize?: number;
}

export interface AIGenerateResponse {
  character: Character;
}
