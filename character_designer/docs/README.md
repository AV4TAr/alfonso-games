# Character Designer Documentation

This folder contains documentation and guides for the Character Designer tool.

## 📄 Files

### `ai-generation-prompt.md`
**The complete prompt for generating character JSON files using AI.**

Use this with:
- Claude (claude.ai)
- ChatGPT (chat.openai.com)
- Other LLMs that can generate structured data

The prompt has been carefully crafted to:
- Generate valid JSON that loads directly into Character Designer
- Create properly formatted 32x32 pixel grids
- Use correct color formats and transparency
- Follow top-down perspective guidelines
- Include all necessary metadata

**Quick Start:**
1. Open `ai-generation-prompt.md`
2. Copy the entire prompt
3. Replace `[PASTE YOUR CHARACTER DESCRIPTION HERE]` with your character (e.g., "green goblin with club")
4. Paste into Claude or ChatGPT
5. Copy the generated JSON
6. Load into Character Designer

## 🎯 Purpose

Alfonso uses the Character Designer to create pixel art sprites for his games. Sometimes he wants to:
- Generate starter sprites quickly
- Get inspiration for character designs
- Create variations of existing characters

The AI generation prompt helps by creating base characters that can be:
- Used as-is in games
- Edited and refined in the Character Designer
- Used as templates for new designs

## 💡 Tips

- Start with simple descriptions ("red dragon", "blue knight")
- Be specific about colors and features
- Mention if it's a player, enemy, or boss
- The AI works best with fantasy/game character types
- You can always edit the generated character after loading

## 🔄 Workflow

```
1. Think of character concept
2. Use AI prompt to generate JSON
3. Load JSON into Character Designer
4. Refine and adjust as needed
5. Save final version
6. Use in game
```

---

**For Alfonso's Games Collection**
Last Updated: 2024-02-16
