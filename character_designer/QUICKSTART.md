# Character Designer - Quick Start Guide

## ⚡ 3-Step Setup

### 1. Configure API Key

Edit the `.env` file and add your Anthropic API key:

```bash
# Open .env file in your editor
code .env  # or nano .env, vim .env, etc.

# Change this line:
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# To your actual key from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Character Designer Backend
📍 Server: http://localhost:3000
🗄️  Database: /Users/.../data/characters.db
🤖 AI Service: ✅ Configured
```

### 3. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v6.0.3  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 4. Open in Browser

Navigate to: **http://localhost:5173**

## 🎨 Using the Character Designer

### Drawing Tools
- **P** - Pencil
- **E** - Eraser
- **F** - Fill bucket
- **I** - Eyedropper
- **Ctrl+Z** - Undo

### Color Selection
- **Left click** - Use primary color
- **Right click** - Use secondary color

### AI Character Generation
1. Click **🤖 AI Character Chat** button
2. Describe your character: "Create a blue knight with golden sword"
3. Wait 5-15 seconds for generation
4. Character auto-loads into editor
5. Edit and save!

### Saving Characters
1. Fill in character info (name, type, game)
2. Click **💾 Save Character**
3. Character saved to database
4. Download JSON file for backup

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# If something is using it, kill it:
kill -9 <PID>
```

### Frontend can't connect
- Make sure backend is running on port 3000
- Check browser console for errors (F12)
- Verify CORS settings in `.env`

### AI not working
- Check `.env` has valid `ANTHROPIC_API_KEY`
- Verify key starts with `sk-ant-`
- Check API status at https://status.anthropic.com/
- Look at backend logs for error messages

### Database reset
```bash
# If you need to start fresh:
rm -rf backend/data/characters.db

# Restart backend (will recreate empty database)
cd backend && npm run dev
```

## 📊 Project Status

✅ **Completed:**
- Full-stack TypeScript architecture
- Backend API with Fastify + SQLite
- Frontend with Vite + TypeScript
- AI character generation (Claude API)
- Character CRUD operations
- Version control system
- Character library
- JSON export/import
- All dependencies installed
- TypeScript compilation verified

🔑 **Needs Configuration:**
- Add your Anthropic API key to `.env`

## 🚀 One-Command Start (After API key is configured)

From the root `character_designer` directory:

```bash
npm run dev
```

This runs both backend and frontend concurrently!

## 📚 More Information

- **Full Documentation**: See [README.md](./README.md)
- **AI Generation Prompt**: See [docs/ai-generation-prompt.md](./docs/ai-generation-prompt.md)
- **API Documentation**: See README.md → API Endpoints section

---

**Ready to create amazing pixel art characters!** 🎮✨
