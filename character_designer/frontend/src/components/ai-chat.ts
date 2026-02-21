// AI Chat interface module
// Handles AI chat modal, message display, and character generation

import { apiClient } from '../api/client';
import { getGridSize } from './canvas';
import type { Character } from '../../../shared/types/character';

type MessageType = 'user' | 'assistant' | 'error' | 'success' | 'loading';

let isAIAvailable = false;
let onCharacterGenerated: ((character: Character) => void) | null = null;

/**
 * Initialize AI chat interface
 */
export function initAIChat(onGenerated: (character: Character) => void): void {
  onCharacterGenerated = onGenerated;

  const generateBtn = document.getElementById('ai-generate-btn');
  const closeBtn = document.getElementById('ai-close-btn');
  const sendBtn = document.getElementById('ai-send-btn');
  const input = document.getElementById('ai-input') as HTMLInputElement;

  generateBtn?.addEventListener('click', showAIChat);
  closeBtn?.addEventListener('click', hideAIChat);
  sendBtn?.addEventListener('click', () => sendChatMessage());

  // Enter key to send
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });
}

/**
 * Update the grid size badge in the AI chat footer
 */
export function updateGridSizeBadge(): void {
  const badge = document.getElementById('ai-grid-badge');
  if (badge) {
    const size = getGridSize();
    badge.textContent = `🎨 Grid: ${size}×${size}`;
  }
}

/**
 * Show AI chat modal
 */
export async function showAIChat(): Promise<void> {
  const modal = document.getElementById('ai-modal');
  if (!modal) return;

  modal.classList.remove('hidden');

  // Clear previous messages
  const messagesContainer = document.getElementById('ai-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }

  // Update grid size badge
  updateGridSizeBadge();

  // Check AI status
  await checkAIStatus();

  // Focus input
  const input = document.getElementById('ai-input') as HTMLInputElement;
  if (input) {
    input.value = '';
    input.focus();
  }
}

/**
 * Hide AI chat modal
 */
export function hideAIChat(): void {
  const modal = document.getElementById('ai-modal');
  modal?.classList.add('hidden');
}

/**
 * Check AI availability
 */
async function checkAIStatus(): Promise<void> {
  try {
    const status = await apiClient.checkAIStatus();
    isAIAvailable = status.available;

    if (isAIAvailable) {
      addChatMessage(
        'assistant',
        'Hi! Describe the character you want to create and I\'ll generate it for you. For example: "A red dragon with yellow eyes" or "A dark teal warden with glowing cyan horns".'
      );
    } else {
      addChatMessage(
        'error',
        'AI generation is currently unavailable. Please check your API key configuration.'
      );
    }
  } catch (error) {
    isAIAvailable = false;
    addChatMessage(
      'error',
      'Failed to check AI status. The backend server may be offline.'
    );
  }
}

/**
 * Add a message to the chat
 */
export function addChatMessage(type: MessageType, content: string): void {
  const messagesContainer = document.getElementById('ai-messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ai-message-${type}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'ai-message-content';
  contentDiv.textContent = content;

  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Send chat message to AI
 */
export async function sendChatMessage(): Promise<void> {
  const input = document.getElementById('ai-input') as HTMLInputElement;
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  if (!isAIAvailable) {
    addChatMessage('error', 'AI is not available. Please try again later.');
    return;
  }

  const gridSize = getGridSize();

  // Clear input
  input.value = '';

  // Add user message
  addChatMessage('user', message);

  // Add loading message
  addChatMessage('loading', `Generating ${gridSize}×${gridSize} character...`);

  // Disable input while processing
  input.disabled = true;
  const sendBtn = document.getElementById('ai-send-btn') as HTMLButtonElement;
  if (sendBtn) sendBtn.disabled = true;

  try {
    // Generate character with current grid size
    const character = await apiClient.generateCharacter(message, gridSize);

    // Remove loading message
    const messagesContainer = document.getElementById('ai-messages');
    if (messagesContainer) {
      const loadingMsg = messagesContainer.querySelector('.ai-message-loading');
      loadingMsg?.remove();
    }

    // Add success message
    addChatMessage(
      'success',
      `Character "${character.name}" generated successfully! Loading into canvas...`
    );

    // Load character into canvas
    if (onCharacterGenerated) {
      onCharacterGenerated(character);
    }

    // Auto-close modal after 2 seconds
    setTimeout(() => {
      hideAIChat();
    }, 2000);
  } catch (error) {
    // Remove loading message
    const messagesContainer = document.getElementById('ai-messages');
    if (messagesContainer) {
      const loadingMsg = messagesContainer.querySelector('.ai-message-loading');
      loadingMsg?.remove();
    }

    // Add error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    addChatMessage('error', `Failed to generate character: ${errorMessage}`);
  } finally {
    // Re-enable input
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}
