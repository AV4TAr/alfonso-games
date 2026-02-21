# Character Designer - Full-Stack TypeScript Application

A pixel art character designer tool with AI generation capabilities, built with TypeScript, Fastify, and Vite.

## 🏗️ Architecture

### Backend (Fastify + SQLite)
- **Framework**: Fastify (fast, production-ready)
- **Database**: SQLite with Drizzle ORM (local, type-safe)
- **AI**: Claude API (Anthropic) - supports future local models
- **Port**: 3000

### Frontend (Vite + TypeScript)
- **Build Tool**: Vite (fast HMR, modern bundling)
- **Framework**: Vanilla TypeScript (lightweight, performant)
- **Port**: 5173

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From character_designer directory
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env and add your Anthropic API key
# Get your key from: https://console.anthropic.com/
```

Example `.env`:
```bash
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/characters.db
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
FRONTEND_URL=http://localhost:5173
```

### 3. Run Development Servers

**Option A - Run both servers together:**
```bash
npm run dev
```

**Option B - Run separately:**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Open in browser:** `http://localhost:5173`

## ✨ Features

### Character Designer
- **32x32 pixel grid** with 16x zoom for precise editing
- **Drawing tools**: Pencil, Eraser, Fill bucket, Eyedropper
- **Color system**: Primary/secondary colors with preset palette
- **Undo system**: 50-step history (Ctrl+Z)
- **Previews**: 1x, 2x, 4x scale previews
- **Keyboard shortcuts**: P (pencil), E (eraser), F (fill), I (eyedropper)

### Character Management
- **Backend storage**: SQLite database (replaces localStorage)
- **Versioning**: Full version history for each character
- **Library**: View and manage all saved characters
- **Export/Import**: JSON format for sharing

### 🤖 AI Character Generation
- **Natural language**: Describe your character in plain English
- **Claude API**: Powered by Claude 3.5 Sonnet
- **Auto-load**: Generated characters load directly into editor
- **Future-proof**: Abstracted AI service supports future local models

Example prompts:
- "Create a blue knight with golden sword"
- "Make a green goblin enemy with club"
- "Design a red dragon boss with wings and crown"

## 📁 Project Structure

```
character_designer/
├── backend/                    # Fastify server
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── config.ts          # Environment configuration
│   │   ├── db/
│   │   │   ├── schema.ts      # Database schema (Drizzle)
│   │   │   └── index.ts       # DB connection
│   │   ├── routes/
│   │   │   ├── characters.ts  # Character CRUD endpoints
│   │   │   └── ai.ts          # AI generation endpoint
│   │   └── services/
│   │       └── ai.service.ts  # AI provider abstraction
│   └── package.json
│
├── frontend/                   # Vite application
│   ├── src/
│   │   ├── main.ts            # Entry point
│   │   ├── designer.ts        # State management
│   │   ├── api/
│   │   │   └── client.ts      # Type-safe API client
│   │   └── components/
│   │       ├── canvas.ts      # Canvas rendering
│   │       ├── tools.ts       # Drawing tools
│   │       └── ai-chat.ts     # AI chat interface
│   ├── index.html
│   ├── style.css
│   └── package.json
│
├── shared/                     # Shared TypeScript types
│   └── types/
│       └── character.ts
│
├── docs/
│   └── ai-generation-prompt.md # AI prompt template
│
├── .env.example
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Characters
- `GET /api/characters` - List all characters
- `GET /api/characters/:id` - Get character by ID
- `POST /api/characters` - Create new character
- `PUT /api/characters/:id` - Update character (creates new version)
- `DELETE /api/characters/:id` - Delete character
- `GET /api/characters/:id/versions` - Get all versions

### AI
- `GET /api/ai/status` - Check AI service availability
- `POST /api/ai/generate` - Generate character from description

## 🗄️ Database Schema

### Characters
```sql
CREATE TABLE characters (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'player' | 'enemy' | 'boss'
  game TEXT NOT NULL,
  current_version INTEGER DEFAULT 1,
  grid_size INTEGER DEFAULT 32,
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  updated TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Character Versions
```sql
CREATE TABLE character_versions (
  id INTEGER PRIMARY KEY,
  character_id INTEGER,
  version INTEGER,
  pixel_data TEXT,  -- JSON stringified 2D array
  created TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);
```

## 💻 Development

### Backend Commands
```bash
cd backend
npm run dev        # Start dev server with hot reload (tsx watch)
npm run build      # Compile TypeScript
npm start          # Run production build
npm run db:studio  # Open Drizzle Studio (database GUI)
```

### Frontend Commands
```bash
cd frontend
npm run dev        # Start Vite dev server with HMR
npm run build      # Build for production
npm run preview    # Preview production build
```

### Root Commands
```bash
npm run install:all  # Install all dependencies
npm run dev          # Run both backend and frontend
npm run build        # Build both backend and frontend
npm run setup        # Complete setup (install + create .env)
```

## 🔒 Security

- **API Key**: Stored in `.env` file on server (never exposed to frontend)
- **CORS**: Configured to only accept requests from configured frontend URL
- **Database**: Local SQLite (no external connections)
- **Input Validation**: All API endpoints validate input data
- **No Client-Side Secrets**: Frontend proxies through backend for AI calls

## ⚡ Performance

- **Backend**: Fastify (2x faster than Express)
- **Frontend**: Vite (instant HMR, optimized builds)
- **Database**: SQLite with WAL mode (better concurrency)
- **Build Time**: ~2-3 seconds (TypeScript + Vite)
- **Bundle Size**: Optimized for production

## 🔮 Future Enhancements

### Planned Features
- [ ] Local AI model support (Ollama, Mistral)
- [ ] Batch character generation
- [ ] Character refinement via multi-turn chat
- [ ] Animation frame editor
- [ ] Export as PNG sprite sheets
- [ ] Collaborative editing (WebSocket)
- [ ] Character templates library
- [ ] Cost tracking for AI usage

### Local Model Support
The AI service is abstracted to support multiple providers:

```typescript
interface AIProvider {
  generateCharacter(description: string): Promise<Character>;
  isAvailable(): boolean;
}

// Current: ClaudeProvider (online, requires API key)
// Future: LocalModelProvider (offline, free)
```

Switch providers by updating `ai.service.ts` configuration.

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Verify .env file exists
ls -la .env

# Check logs for errors
cd backend && npm run dev
```

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check CORS configuration in backend/.env
- Verify Vite proxy settings in frontend/vite.config.ts

### AI generation fails
- Check `ANTHROPIC_API_KEY` in .env
- Verify key is valid (starts with `sk-ant-`)
- Check API rate limits at https://console.anthropic.com/
- Review backend logs for detailed error messages

### Database errors
```bash
# Reset database
rm -rf backend/data/characters.db

# Restart backend (will recreate schema)
cd backend && npm run dev
```

### TypeScript compilation errors
```bash
# Clean build
cd backend && rm -rf dist node_modules && npm install && npm run build
cd ../frontend && rm -rf dist node_modules && npm install && npm run build
```

## 📝 License

MIT

## 👨‍💻 Credits

**Created for Alfonso's Educational Game Collection ("fonchi")**
- Builder: Alfonso (9 years old)
- Helper: Claude Code
- Version: 2.0 (Full-Stack TypeScript Rebuild)

### Previous Version
- Version 1.0: Vanilla JavaScript with localStorage
- Version 2.0: Full-stack TypeScript with SQLite + AI integration

---

**Tech Stack**: TypeScript, Fastify, Vite, SQLite, Drizzle ORM, Claude API
