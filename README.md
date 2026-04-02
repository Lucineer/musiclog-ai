# musiclog.ai

A repo-native AI agent for musicians. Practice tracking, theory explanations, repertoire management, and an AI captain that guides your musical journey.

## What it does

- **Practice Timer & Logging** — Time sessions, track instrument/pieces/focus areas, rate your sessions
- **Streak Tracking** — Consecutive day streaks with visual feedback
- **Spaced Repetition** — Suggests pieces to revisit based on forgetting curves
- **Practice Insights** — Patterns in when/what/how you practice
- **Weekly Goals** — Set minute targets, track completion with progress bars
- **Song Repertoire** — Grid view of songs with difficulty badges and progress bars
- **Theory Explorer** — Scales, chords, intervals, progressions, modes with detailed explanations
- **Chord Analysis** — Ask "what scale goes with Am7-Dm7-G7-CM7?" and get a breakdown
- **Ear Training** — Progressive exercises from beginner to advanced
- **Composition Aids** — Chord progressions, melodic ideas, rhythm suggestions in any key
- **AI Chat** — SSE streaming with DeepSeek for real-time music theory Q&A

## Stack

- **Runtime**: Cloudflare Workers (TypeScript)
- **AI**: DeepSeek API (streaming SSE)
- **Frontend**: Single-page HTML, dark stage aesthetic
- **No build step** — pure TypeScript, no bundler needed

## Setup

```bash
# Install dependencies
npm install

# Set your DeepSeek API key
npx wrangler secret put DEEPSEEK_API_KEY

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | SSE streaming chat with DeepSeek |
| `GET/POST` | `/api/practice` | List / log practice sessions |
| `GET/POST` | `/api/practice/goals` | Weekly practice goals |
| `GET` | `/api/practice/streak` | Current and longest streak |
| `GET` | `/api/practice/review` | Spaced repetition suggestions |
| `GET` | `/api/practice/insights` | Practice pattern insights |
| `GET/POST` | `/api/songs` | Song repertoire CRUD |
| `GET` | `/api/theory` | Theory topics (filterable by category) |
| `GET` | `/api/theory?id=X` | Single topic detail |
| `GET` | `/api/theory?q=...` | Contextual theory explanation |
| `GET` | `/api/theory/ear-training` | Ear training exercises |
| `GET` | `/api/theory/compose` | Composition aids |
| `GET` | `/api/progress` | Aggregate progress statistics |

## Design

Dark stage aesthetic: `#1a1a2e` background, amber `#F59E0B` accents, warm white text. Music notation feel throughout. Responsive layout works on mobile and desktop.

## Project Structure

```
src/
  worker.ts           — Cloudflare Worker router + all API endpoints
  practice/
    tracker.ts         — Sessions, streaks, goals, spaced repetition, insights
  theory/
    explainer.ts       — Theory topics, contextual explanations, ear training, composition
public/
  app.html             — Single-page dark UI
```

## Author

Superinstance

## License

MIT — Built with ❤️ by [Superinstance](https://github.com/superinstance) & [Lucineer](https://github.com/Lucineer) (DiGennaro et al.)
