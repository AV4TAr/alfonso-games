import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { characters, characterVersions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import type { Character } from '../../../shared/types/character.js';

export async function characterRoutes(fastify: FastifyInstance) {
  // Get all characters
  fastify.get('/characters', async (request, reply) => {
    try {
      const allCharacters = await db
        .select()
        .from(characters)
        .orderBy(desc(characters.updated));

      // Get latest version for each character
      const charactersWithData = await Promise.all(
        allCharacters.map(async (char) => {
          const latestVersion = await db
            .select()
            .from(characterVersions)
            .where(eq(characterVersions.characterId, char.id))
            .orderBy(desc(characterVersions.version))
            .limit(1);

          const pixelData = latestVersion[0]
            ? JSON.parse(latestVersion[0].pixelData)
            : [];

          return {
            id: char.id,
            name: char.name,
            type: char.type,
            game: char.game,
            version: char.currentVersion,
            gridSize: char.gridSize,
            created: char.created,
            pixelData,
          } as Character;
        })
      );

      return charactersWithData;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch characters' });
    }
  });

  // Get single character by ID
  fastify.get<{ Params: { id: string } }>('/characters/:id', async (request, reply) => {
    try {
      const characterId = parseInt(request.params.id, 10);

      const char = await db
        .select()
        .from(characters)
        .where(eq(characters.id, characterId))
        .limit(1);

      if (!char[0]) {
        return reply.status(404).send({ error: 'Character not found' });
      }

      const latestVersion = await db
        .select()
        .from(characterVersions)
        .where(eq(characterVersions.characterId, characterId))
        .orderBy(desc(characterVersions.version))
        .limit(1);

      const pixelData = latestVersion[0]
        ? JSON.parse(latestVersion[0].pixelData)
        : [];

      return {
        id: char[0].id,
        name: char[0].name,
        type: char[0].type,
        game: char[0].game,
        version: char[0].currentVersion,
        gridSize: char[0].gridSize,
        created: char[0].created,
        pixelData,
      } as Character;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch character' });
    }
  });

  // Get all versions of a character
  fastify.get<{ Params: { id: string } }>('/characters/:id/versions', async (request, reply) => {
    try {
      const characterId = parseInt(request.params.id, 10);

      const versions = await db
        .select()
        .from(characterVersions)
        .where(eq(characterVersions.characterId, characterId))
        .orderBy(desc(characterVersions.version));

      return versions.map(v => ({
        id: v.id,
        characterId: v.characterId,
        version: v.version,
        created: v.created,
        pixelData: JSON.parse(v.pixelData),
      }));
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch character versions' });
    }
  });

  // Create new character
  fastify.post<{ Body: Omit<Character, 'id'> }>('/characters', async (request, reply) => {
    try {
      const { name, type, game, pixelData, gridSize = 32 } = request.body;

      // Validate pixel data
      if (!Array.isArray(pixelData) || pixelData.length !== gridSize) {
        return reply.status(400).send({
          error: `Invalid pixel data: expected ${gridSize} rows`,
        });
      }

      // Insert character
      const result = await db.insert(characters).values({
        name,
        type,
        game,
        currentVersion: 1,
        gridSize,
      }).returning();

      const newCharacter = result[0];

      // Insert first version
      await db.insert(characterVersions).values({
        characterId: newCharacter.id,
        version: 1,
        pixelData: JSON.stringify(pixelData),
      });

      return {
        id: newCharacter.id,
        name: newCharacter.name,
        type: newCharacter.type,
        game: newCharacter.game,
        version: newCharacter.currentVersion,
        gridSize: newCharacter.gridSize,
        created: newCharacter.created,
        pixelData,
      } as Character;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to create character' });
    }
  });

  // Update character (creates new version)
  fastify.put<{ Params: { id: string }; Body: Partial<Character> }>('/characters/:id', async (request, reply) => {
    try {
      const characterId = parseInt(request.params.id, 10);
      const { name, type, game, pixelData } = request.body;

      // Get current character
      const existingChar = await db
        .select()
        .from(characters)
        .where(eq(characters.id, characterId))
        .limit(1);

      if (!existingChar[0]) {
        return reply.status(404).send({ error: 'Character not found' });
      }

      const newVersion = existingChar[0].currentVersion + 1;

      // Update character metadata
      const updates: any = { updated: new Date().toISOString() };
      if (name) updates.name = name;
      if (type) updates.type = type;
      if (game) updates.game = game;
      if (pixelData) {
        updates.currentVersion = newVersion;
      }

      await db
        .update(characters)
        .set(updates)
        .where(eq(characters.id, characterId));

      // If pixelData changed, create new version
      if (pixelData) {
        await db.insert(characterVersions).values({
          characterId,
          version: newVersion,
          pixelData: JSON.stringify(pixelData),
        });
      }

      // Return updated character
      const updated = await db
        .select()
        .from(characters)
        .where(eq(characters.id, characterId))
        .limit(1);

      const latestVersion = await db
        .select()
        .from(characterVersions)
        .where(eq(characterVersions.characterId, characterId))
        .orderBy(desc(characterVersions.version))
        .limit(1);

      return {
        id: updated[0].id,
        name: updated[0].name,
        type: updated[0].type,
        game: updated[0].game,
        version: updated[0].currentVersion,
        gridSize: updated[0].gridSize,
        created: updated[0].created,
        pixelData: latestVersion[0] ? JSON.parse(latestVersion[0].pixelData) : [],
      } as Character;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to update character' });
    }
  });

  // Delete character
  fastify.delete<{ Params: { id: string } }>('/characters/:id', async (request, reply) => {
    try {
      const characterId = parseInt(request.params.id, 10);

      await db.delete(characters).where(eq(characters.id, characterId));

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to delete character' });
    }
  });
}
