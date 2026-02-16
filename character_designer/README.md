# 🎨 Character Designer

A pixel art character creator for Alfonso's Games. Create 32x32 pixel art characters for your games!

## 🚀 How to Use

1. Open `index.html` in Chrome browser
2. Choose your tool (Pencil, Eraser, Fill, or Eyedropper)
3. Pick colors from the palette
4. Draw on the 32x32 grid
5. Save your character!

## 🛠️ Tools

### Drawing Tools
- **✏️ Pencil (P)** - Draw pixels
- **🧹 Eraser (E)** - Erase pixels
- **🪣 Fill (F)** - Fill connected areas
- **💧 Eyedropper (I)** - Pick color from canvas

### Mouse Controls
- **Left Click** - Use primary color
- **Right Click** - Use secondary color
- **Hover** - See pixel coordinates

### Keyboard Shortcuts
- `P` - Switch to Pencil
- `E` - Switch to Eraser
- `F` - Switch to Fill
- `I` - Switch to Eyedropper
- `Ctrl+Z` - Undo

## 🎨 Color Palette

- 24 preset colors to choose from
- Custom color picker for any color
- Click color boxes to swap primary/secondary
- Primary color = left click, Secondary = right click

## 💾 Saving Characters

1. Fill in character info:
   - **Name**: Character name
   - **Type**: Player, Enemy, or Boss
   - **Game**: Which game folder to save to

2. Click "💾 Save Character"
   - Creates version number automatically (v1, v2, v3...)
   - Downloads JSON file
   - Saves to library for quick access

3. **Important**: Save the downloaded JSON file to:
   ```
   [game_name]/characters/[character_name]_v1.json
   ```
   For example:
   ```
   dragons_vs_warden/characters/dragon_v1.json
   ```

## 📂 Loading Characters

1. Click "📂 Load Character"
2. Select a `.json` file from your computer
3. Character will load into the editor
4. You can edit and save as a new version

## ✨ Generate Starter Characters

Click "✨ Generate Starter" to create a basic character based on type:
- **Player** - Simple dragon sprite
- **Enemy** - Simple warden sprite
- **Boss** - Simple skeleton sprite

Use these as starting points and customize them!

## 👁️ Preview

Three preview windows show your character at different sizes:
- **1x** (32px) - Actual size
- **2x** (64px) - Medium size
- **4x** (128px) - Large preview

These show how your character will look in-game at different scales.

## 📚 Character Library

The library shows all characters you've created:
- Click any character to load it into the editor
- Stored in browser localStorage
- Persists between sessions

## 🎮 Using Characters in Games

Characters are saved as JSON files with this structure:
```json
{
  "name": "Dragon",
  "type": "player",
  "game": "dragons_vs_warden",
  "version": 1,
  "gridSize": 32,
  "pixelData": [[...], [...], ...]
}
```

Games can load and render these characters using the pixel data.

## 📁 File Organization

```
alfonso-games/
├── character_designer/          # This tool
└── [game_name]/
    └── characters/              # Save characters here
        ├── player_name_v1.json
        ├── enemy_name_v1.json
        └── boss_name_v1.json
```

## 💡 Tips

1. **Start Simple** - Begin with basic shapes, add details later
2. **Use Symmetry** - For characters facing forward
3. **Limited Colors** - Pixel art looks best with fewer colors
4. **Save Versions** - Keep different versions as you iterate
5. **Test in Game** - See how it looks when animated/moving

## 🎯 Best Practices

- **Player Characters**: Make them distinctive and easy to see
- **Enemies**: Different colors for different enemy types
- **Bosses**: Bigger, more detailed, unique silhouette
- **Contrast**: Use colors that stand out from backgrounds

## 🔧 Technical Details

- Grid: 32x32 pixels
- Canvas: 512x512 (16x zoom for editing)
- File format: JSON
- Color format: Hex (#RRGGBB)
- Transparency: Represented as `null`

---

**Created by:** Alfonso
**Tool by:** Claude Code
**Version:** 1.0.0
