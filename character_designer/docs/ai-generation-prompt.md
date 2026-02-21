# AI Character Generation Prompt

Use this prompt with Claude, ChatGPT, or other AI to generate character JSON files compatible with the Character Designer.

---

## 🎨 COMPLETE PROMPT (Copy Everything Below)

```
You are a pixel art character generator. You MUST generate a complete, valid JSON file for a {{GRID_SIZE}}x{{GRID_SIZE}} grid-based character designer.

=== CRITICAL REQUIREMENTS ===

1. OUTPUT STRUCTURE - EXACTLY THIS FORMAT:
{
  "name": "Character Name",
  "type": "player",
  "game": "dragons_vs_warden",
  "version": 1,
  "gridSize": {{GRID_SIZE}},
  "created": "2024-02-16T15:00:00.000Z",
  "palette": ["#ff0000", "#8b0000", "#ffff00", "#000000"],
  "pixelData": [
    // EXACTLY {{GRID_SIZE}} arrays here with numbers (not colors!)
  ]
}

2. PIXEL DATA ARRAY RULES (USING PALETTE INDICES):
   - MUST have EXACTLY {{GRID_SIZE}} rows (arrays) - indices 0 through {{MAX_INDEX}}
   - Each row MUST have EXACTLY {{GRID_SIZE}} values (numbers, not hex colors!)
   - Total: {{GRID_SIZE}} rows × {{GRID_SIZE}} columns = {{TOTAL_PIXELS}} values
   - Format: pixelData[row][column] with NUMBER indices (0, 1, 2, 3...)
   - Row 0 = top, Row {{MAX_INDEX}} = bottom (MUST INCLUDE ROW {{MAX_INDEX}}!)
   - Column 0 = left, Column {{MAX_INDEX}} = right
   - CRITICAL: Count your rows! First row is index 0, last row is index {{MAX_INDEX}} (that's {{GRID_SIZE}} total)
   - CRITICAL: Use NUMBERS (0, 1, 2, 3), NOT hex colors ("#ff0000")

3. VALUE RULES (PALETTE INDEX SYSTEM):
   - First, define your palette array with 4-10 unique colors
   - Transparent pixel: 0 (the number zero, not a color)
   - Colored pixels: 1, 2, 3, etc. (indices into the palette array)
   - Example palette: ["#ff0000", "#8b0000", "#ffff00"]
   - Example pixelData: [0, 0, 1, 2, 1, 0, ...] where:
     * 0 = transparent (always index 0)
     * 1 = first color in palette ("#ff0000")
     * 2 = second color in palette ("#8b0000")
     * 3 = third color in palette ("#ffff00")

4. PERSPECTIVE:
   - TOP-DOWN VIEW (bird's eye, looking down from above)
   - Character facing UP (head at top, feet at bottom)

=== PALETTE SYSTEM (CRITICAL!) ===

**STEP 1: Define your palette array with 4-10 unique colors**

The palette is an array of hex colors that you'll reference by index:
```
"palette": ["#006400", "#00ff00", "#44ff44", "#ffff00", "#8b4513"]
```

**STEP 2: Use indices in pixelData (NOT hex colors!)**
- 0 = transparent (ALWAYS reserve index 0 for transparency)
- 1 = first color in palette (e.g., "#006400" dark green)
- 2 = second color in palette (e.g., "#00ff00" green)
- 3 = third color in palette (e.g., "#44ff44" light green)
- etc.

**COLOR PALETTE GUIDE (Choose 4-10 colors for your palette):**

REDS:     "#8b0000" (dark), "#ff0000" (red), "#ff4444" (light), "#ff8844" (orange)
GREENS:   "#006400" (dark), "#00ff00" (green), "#44ff44" (light), "#00ff88" (teal)
BLUES:    "#000080" (dark), "#0000ff" (blue), "#4444ff" (light), "#00ffff" (cyan)
PURPLES:  "#4b0082" (dark), "#8b00ff" (purple), "#ff00ff" (magenta)
YELLOWS:  "#8b8b00" (dark), "#ffff00" (yellow), "#ffff88" (light)
GRAYS:    "#000000" (black), "#444444" (dark), "#888888" (gray), "#cccccc" (light), "#ffffff" (white)
BROWNS:   "#4a2511" (dark), "#8b4513" (brown), "#d2691e" (tan)

=== POSITIONING & LAYOUT (CRITICAL) ===

CHARACTER ORIENTATION:
- TOP-DOWN VIEW: Character faces UPWARD (head toward row 0, feet toward row {{MAX_INDEX}})
- Character should appear as if you're looking down from above
- Head/face at the TOP of the grid
- Feet/bottom at the BOTTOM of the grid

VERTICAL POSITIONING (Rows):
- Rows 0-{{PAD_TOP}}:         Empty padding (all 0 = transparent) - DON'T START CHARACTER HERE
- Rows {{HEAD_START}}-{{HEAD_END}}: HEAD (face, eyes, ears, hair, hat, crown) - MUST HAVE HEAD
- Rows {{BODY_START}}-{{BODY_END}}: BODY (torso, arms, hands, weapons held horizontally) - MUST HAVE BODY
- Rows {{LEGS_START}}-{{LEGS_END}}: LEGS/TAIL/FEET (bottom of character) - MUST HAVE LEGS/FEET
- Rows {{PAD_BOTTOM}}-{{MAX_INDEX}}: Empty padding (all 0 = transparent) - DON'T END CHARACTER HERE

CRITICAL: Character MUST have all body parts (head + body + legs). Don't create floating torsos!

HORIZONTAL POSITIONING (Columns):
- Columns 0-{{COL_PAD_LEFT}}:   Empty padding (mostly 0 = transparent) - LEFT BORDER
- Columns {{COL_CHAR_START}}-{{COL_CHAR_END}}: CHARACTER BODY (centered area)
- Columns {{COL_PAD_RIGHT}}-{{MAX_INDEX}}: Empty padding (mostly 0 = transparent) - RIGHT BORDER
- Center point: Column {{COL_CENTER}} should be the vertical center line
- For symmetrical characters: Mirror pixels around column {{COL_CENTER}}

CENTERING RULES:
1. Character should be CENTERED horizontally around column {{COL_CENTER}}
2. Character should be CENTERED vertically around row {{ROW_CENTER}}
3. Leave at least 4-6 pixels of 0 (transparent) padding on ALL sides
4. NEVER touch the edges (first/last 2 rows and columns)

SYMMETRY (for front-facing characters):
- Left half mirrors right half across column {{COL_CENTER}}
- Arms/wings extend equally on both sides
- Use asymmetry only for weapons held to one side

=== COMMON POSITIONING MISTAKES (AVOID THESE) ===

❌ DON'T: Start character at row 0 or 1
✅ DO: Start character at rows {{HEAD_START}}-{{HEAD_END}} with padding above

❌ DON'T: Make character touch left edge (columns 0-3)
✅ DO: Keep character centered (columns {{COL_CHAR_START}}-{{COL_CHAR_END}})

❌ DON'T: Make character too large (fills entire grid)
✅ DO: Leave 4-6 pixel border of 0 (transparent) on all sides

❌ DON'T: Put feet/bottom at row {{MAX_INDEX}}
✅ DO: End character by row {{LEGS_END}}, leave rows {{PAD_BOTTOM}}-{{MAX_INDEX}} as 0 (transparent)

❌ DON'T: Make character face sideways or downward
✅ DO: Character faces UP (head at top, feet at bottom)

❌ DON'T: Off-center (character shifted to one side)
✅ DO: Center around column {{COL_CENTER}} (symmetrical)

=== STEP-BY-STEP GENERATION PROCESS ===

STEP 1: Plan the character
- Main body color
- Outline color (darker shade)
- Highlight color (lighter shade)
- Special features (eyes, weapons, etc.)

STEP 2: Position the character correctly
- Start head at rows {{HEAD_START}}-{{HEAD_END}} (not earlier!)
- Center horizontally around column {{COL_CENTER}}
- Make sure there's empty space (0 = transparent) in rows 0-{{PAD_TOP}}
- Make sure there's empty space (0 = transparent) in rows {{PAD_BOTTOM}}-{{MAX_INDEX}}
- Leave 4+ pixels of 0 (transparent) padding on left and right sides

STEP 3: Create the outline first
- Use darkest color for character silhouette
- Make it symmetrical left-to-right (for front-facing view)
- Character faces UPWARD (head at top)

STEP 4: Fill in main colors
- Fill body with main color
- Leave outline pixels dark

STEP 5: Add details
- Eyes (1-2 pixels each, yellow/white)
- Weapons/tools (extend from hands)
- Special features (crown, horns, etc.)

STEP 6: Add legs/feet
- Rows {{LEGS_START}}-{{LEGS_END}}: Add legs, feet, or tail
- Use same colors as body
- Keep outline consistent
- NEVER leave bottom empty (no floating torsos!)

STEP 7: Add highlights
- 1-2 pixels of lighter color on "top" surfaces
- Makes character look 3D

STEP 8: Verify row count
- Count all arrays in pixelData
- MUST be exactly {{GRID_SIZE}} (rows 0-{{MAX_INDEX}})
- If you only have {{MAX_INDEX}} rows, ADD ROW {{MAX_INDEX}} at the end
- Last row should be mostly/all 0 (padding)

=== VALIDATION CHECKLIST ===

Before outputting, verify:

JSON FORMAT:
- [ ] JSON is valid (proper commas, brackets, quotes)
- [ ] Has "palette" array with 4-10 hex colors (e.g., ["#ff0000", "#8b0000", ...])
- [ ] Exactly {{GRID_SIZE}} arrays in pixelData (count them: 0, 1, 2, ... {{MAX_INDEX}} = {{GRID_SIZE}} total)
- [ ] First row is index 0, last row is index {{MAX_INDEX}}
- [ ] Each array has exactly {{GRID_SIZE}} values (NUMBERS, not hex strings!)
- [ ] All values are NUMBERS: 0 (transparent), 1, 2, 3... (palette indices)
- [ ] NO hex color strings in pixelData (like "#ff0000") - use palette indices!
- [ ] NO null values - use 0 for transparent
- [ ] No trailing commas
- [ ] **CRITICAL**: Row {{MAX_INDEX}} exists (don't stop at row {{MAX_INDEX_MINUS_ONE}}!)

CHARACTER POSITIONING:
- [ ] Rows 0-{{PAD_TOP}} are mostly/all 0 (transparent, top padding)
- [ ] Rows {{PAD_BOTTOM}}-{{MAX_INDEX}} are mostly/all 0 (transparent, bottom padding)
- [ ] Character head starts around rows {{HEAD_START}}-{{HEAD_END}}
- [ ] Character feet end around rows {{LEGS_START}}-{{LEGS_END}}
- [ ] Columns 0-{{COL_PAD_LEFT}} are mostly 0 (transparent, left padding)
- [ ] Columns {{COL_PAD_RIGHT}}-{{MAX_INDEX}} are mostly 0 (transparent, right padding)
- [ ] Character is centered around column {{COL_CENTER}}
- [ ] Character faces UPWARD (head at top, feet at bottom)
- [ ] At least 4 pixels of 0 (transparent) space on all sides
- [ ] Character does NOT touch edges (first/last 2 rows/cols)

CHARACTER DESIGN:
- [ ] Character fills 50-70% of grid space (not too small, not too large)
- [ ] Symmetrical left-to-right (for front-facing characters)
- [ ] Has clear outline/border in darker color
- [ ] Palette has 4-10 colors (defined in "palette" array)
- [ ] All pixelData values reference palette (1 = first color, 2 = second, etc.)
- [ ] **CRITICAL**: Character has ALL body parts (head + body + legs/feet)
- [ ] No floating torsos (rows {{LEGS_START}}-{{LEGS_END}} should have legs or feet pixels)
- [ ] Character looks complete, not cut off

=== EXAMPLE OUTPUT (32×32 example) ===

Here's a CORRECT example (32×32 grid, showing structure):

{
  "name": "Green Goblin",
  "type": "enemy",
  "game": "example_game",
  "version": 1,
  "gridSize": 32,
  "created": "2024-02-16T15:00:00.000Z",
  "palette": ["#006400", "#00ff00", "#44ff44", "#ffff00", "#8b4513", "#d2691e"],
  "pixelData": [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,3,1,0,0,0,0,0,1,3,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,2,4,2,2,2,4,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,5,5,5,0,1,2,2,2,2,2,2,2,2,2,1,0,5,5,5,0,0,0,0,0,0,0],
    [0,0,0,0,0,5,6,6,5,1,2,2,2,2,2,2,2,2,2,1,5,6,6,5,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,5,6,6,6,5,1,2,2,2,2,2,2,2,1,5,6,6,6,5,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,5,6,6,6,5,1,1,2,2,2,2,2,1,1,5,6,6,6,5,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,5,6,5,1,1,0,1,2,2,2,1,0,1,1,5,6,5,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,5,5,1,1,0,0,0,1,2,1,0,0,0,1,1,5,5,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,2,2,2,1,1,2,2,2,2,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,2,2,2,1,0,0,1,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ]
}

=== YOUR CHARACTER REQUEST ===

[PASTE YOUR CHARACTER DESCRIPTION HERE]

Examples:
- "Create an enemy: green goblin with club and pointy ears"
- "Create a player: blue knight with sword and shield"
- "Create a boss: red demon king with golden crown and purple cape"

=== OUTPUT INSTRUCTIONS ===

1. Generate the COMPLETE JSON (all {{GRID_SIZE}} rows, all {{GRID_SIZE}} columns)
2. Make sure every row has exactly {{GRID_SIZE}} comma-separated values
3. Use proper JSON formatting
4. Do NOT use placeholders like "..." or "// more rows"
5. Output the ENTIRE character from row 0 to row {{MAX_INDEX}}
6. Verify the JSON is valid before outputting

NOW GENERATE THE CHARACTER JSON:
```

---

## 📋 How to Use

1. **Copy the entire prompt** from "You are a pixel art character generator" to "NOW GENERATE THE CHARACTER JSON:"
2. **Replace the [PASTE YOUR CHARACTER DESCRIPTION HERE]** with your character request
3. **Paste into Claude/ChatGPT**
4. **Copy the JSON output**
5. **In Character Designer**: Click "📋 Paste JSON" (if available) or use "📂 Load Character"
6. **Verify it loaded correctly**

---

## ✅ Testing the Output

After AI generates the JSON, check:

1. **Row count**: Open the JSON, count the arrays in pixelData - should match gridSize
2. **Column count**: Check first row, count values - should match gridSize
3. **Valid JSON**: Paste into JSONLint.com or similar validator
4. **Palette format**: Should have a `"palette"` array with 4-10 hex colors like `["#ff0000", "#8b0000", ...]`
5. **PixelData values**: All values should be NUMBERS (0, 1, 2, 3...), NOT hex strings
6. **Transparent pixels**: Use `0` for transparent, NOT `null`
7. **No errors**: Load into Character Designer and verify it displays

---

## 🐛 Troubleshooting

**Problem**: "Invalid JSON" error
- **Fix**: Check for missing commas, extra commas at end of arrays, mismatched brackets

**Problem**: Character doesn't show or looks wrong
- **Fix**: Verify correct row and column counts, check that palette array exists

**Problem**: AI uses `...` or `// more rows` shortcuts
- **Fix**: Tell the AI: "Generate ALL rows completely, no shortcuts or placeholders"

**Problem**: Colors look wrong
- **Fix**: Make sure you have a `"palette"` array with hex colors, and pixelData uses numbers (1, 2, 3...) that index into the palette

**Problem**: Transparency doesn't work
- **Fix**: Make sure transparent pixels are `0` (the number zero), NOT `null`, `"null"`, or `"transparent"`

**Problem**: AI outputs hex colors directly in pixelData
- **Fix**: Remind the AI: "Use the PALETTE system - define colors in palette array, use numeric indices (0, 1, 2, 3...) in pixelData"

---

## 🎨 Character Type Guidelines

### Player Characters
- Bright, heroic colors (blue, gold, white)
- Clear, friendly design
- Symmetrical
- Example: "blue knight with golden sword"

### Enemies
- Darker, menacing colors (green, red, brown)
- Simple, readable design
- Can be asymmetrical
- Example: "green goblin with wooden club"

### Bosses
- Rich, powerful colors (purple, gold, dark red)
- Larger design (fills 70-80% of grid)
- Crown, cape, or other distinctive features
- Example: "purple dragon king with golden crown"

---

## 💾 Quick Reference: Color Palettes

**Fantasy Characters**
- Knight: `#0000ff` (blue armor), `#ffd700` (gold trim), `#c0c0c0` (silver)
- Dragon: `#ff0000` (red), `#ff8844` (orange), `#8b0000` (dark red), `#ffff00` (yellow eyes)
- Goblin: `#00ff00` (green), `#006400` (dark green), `#8b4513` (brown club)
- Skeleton: `#ffffff` (white bones), `#e0e0e0` (gray), `#000000` (black outline)

**Sci-Fi Characters**
- Robot: `#c0c0c0` (silver), `#444444` (dark gray), `#00ffff` (cyan lights)
- Alien: `#00ff00` (green), `#44ff44` (light green), `#ffff00` (yellow eyes)
- Space Marine: `#000080` (blue), `#0000ff` (light blue), `#ff0000` (red visor)

---

Created: 2024-02-16
Version: 3.0
For: Alfonso's Character Designer
