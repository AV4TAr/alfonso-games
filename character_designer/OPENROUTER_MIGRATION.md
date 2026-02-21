# OpenRouter Migration Guide

The Character Designer has been migrated from Claude/Anthropic to **OpenRouter** - giving you access to 100+ AI models through a single API!

## What Changed?

### Before (Claude Only)
- Single provider: Anthropic's Claude
- Cost: ~$0.015 per character
- Configuration: `ANTHROPIC_API_KEY` + `CLAUDE_MODEL`

### After (OpenRouter - 100+ Models!)
- **FREE models**: Llama 3, Mistral, DeepSeek, Gemini
- **Premium models**: Claude Sonnet, GPT-4o, GPT-4 Turbo
- **Easy switching**: Change one env var to try different models
- Configuration: `OPENROUTER_API_KEY` + `OPENROUTER_MODEL`

## Quick Setup

### 1. Get Your FREE OpenRouter API Key
Visit: https://openrouter.ai/keys

### 2. Update Your .env File

**Replace this:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**With this:**
```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### 3. Start the Backend
```bash
cd character_designer/backend
npm run dev
```

You should see:
```
🚀 Character Designer Backend
📍 Server: http://localhost:3000
🗄️  Database: ./data/characters.db
🤖 AI Service: ✅ OpenRouter
   Model: meta-llama/llama-3.1-8b-instruct:free
```

## Recommended Models

### FREE Models (Start Here!)

**meta-llama/llama-3.1-8b-instruct:free** (DEFAULT)
- Cost: FREE
- Quality: Good
- Speed: Fast
- Best for: Most characters, quick iterations

**meta-llama/llama-3.1-70b-instruct:free**
- Cost: FREE
- Quality: Excellent
- Speed: Good
- Best for: High quality characters

**google/gemini-2.0-flash-exp:free**
- Cost: FREE
- Quality: Excellent
- Speed: Very Fast
- Best for: Fast generation

**qwen/qwen-2.5-72b-instruct:free**
- Cost: FREE
- Quality: Very Good
- Speed: Good
- Best for: Alternative to Llama

### Cheap Models

**meta-llama/llama-3.3-70b-instruct**
- Cost: $0.00018 per character (almost free)
- Quality: Excellent
- Best for: Best paid value

**anthropic/claude-3.5-haiku**
- Cost: $0.001 per character
- Quality: Very Good
- Best for: Fast Claude model

### Premium Models (Best Quality)

**anthropic/claude-sonnet-4.5**
- Cost: ~$0.015 per character
- Quality: Excellent (same as before!)
- Best for: Complex characters, high quality needed

**openai/gpt-4o**
- Cost: ~$0.005 per character
- Quality: Excellent
- Speed: Very Fast
- Best for: Fast + high quality

**openai/gpt-4-turbo**
- Cost: ~$0.01 per character
- Quality: Excellent
- Best for: Complex descriptions

## How to Switch Models

Just change the `OPENROUTER_MODEL` in your `.env` file and restart the server:

```bash
# Try Llama 3.1 8B (free, fast)
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Try Llama 3.1 70B (free, excellent)
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct:free

# Try Gemini (free, very fast)
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free

# Try Claude (premium quality)
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5

# Try GPT-4o (premium, fast)
OPENROUTER_MODEL=openai/gpt-4o
```

## Testing Your Setup

### 1. Check Status
```bash
curl http://localhost:3000/api/ai/status
```

Should return:
```json
{
  "available": true,
  "model": "meta-llama/llama-3.1-8b-instruct:free",
  "provider": "openrouter"
}
```

### 2. Generate a Character
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"description":"blue knight with golden sword"}'
```

Should generate a valid 32x32 character JSON!

## Benefits of OpenRouter

✅ **Single API Key** - Access 100+ models with one key
✅ **FREE Options** - Llama 3, Mistral, Gemini cost nothing
✅ **Easy Switching** - Change models with one env var
✅ **Often Cheaper** - Even premium models cost less
✅ **No Rate Limits** - Most free models have no limits
✅ **Automatic Fallback** - OpenRouter handles provider outages

## Cost Comparison

| Model | Provider | Cost per Character |
|-------|----------|-------------------|
| Llama 3.1 8B Instruct | OpenRouter | **FREE** 🎉 |
| Llama 3.1 70B Instruct | OpenRouter | **FREE** 🎉 |
| Gemini 2.0 Flash | OpenRouter | **FREE** 🎉 |
| Qwen 2.5 72B | OpenRouter | **FREE** 🎉 |
| Llama 3.3 70B Instruct | OpenRouter | $0.00018 |
| Claude 3.5 Haiku | OpenRouter | ~$0.001 |
| Gemini Pro 1.5 | OpenRouter | ~$0.001 |
| GPT-4o | OpenRouter | ~$0.0015 |
| Claude Sonnet 4.5 | OpenRouter | ~$0.003 |

**Savings: 100% if using free models!**

## Troubleshooting

### "AI service not available"
- Check that `OPENROUTER_API_KEY` is set in `.env`
- Get your free key at: https://openrouter.ai/keys

### "OpenRouter API Error"
- Check your API key is valid
- Ensure the model name is correct (e.g., `meta-llama/llama-3-70b`)
- Check OpenRouter status: https://openrouter.ai/status

### Character quality issues
- Try a different model (Claude Sonnet or GPT-4o for best quality)
- Make your description more detailed
- Free models work great for most characters!

## Migration Checklist

- [x] Update backend dependencies (done automatically)
- [x] Update configuration files (done automatically)
- [x] Update AI service code (done automatically)
- [ ] Get OpenRouter API key from https://openrouter.ai/keys
- [ ] Update `.env` file with `OPENROUTER_API_KEY`
- [ ] Set `OPENROUTER_MODEL` (or use default Llama 3)
- [ ] Restart backend server
- [ ] Test character generation
- [ ] Experiment with different models!

## Questions?

- OpenRouter Docs: https://openrouter.ai/docs
- Model List: https://openrouter.ai/models
- Pricing: https://openrouter.ai/models (see individual model costs)
