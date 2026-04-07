# Musiclog AI

Your music listening is fragmented across platforms, and their algorithms prioritize engagement over understanding your taste.

This is a personal music companion that tracks your listening, builds playlists based on your personal history and context, and runs on infrastructure you control.

---

## How it works
Most music algorithms are built to maximize platform engagement. This tool runs locally for you. It uses your listening history to generate recommendations and playlists without external influence. It has no engagement metrics—it only serves your preferences.

## What it provides
- Runs on your own Cloudflare Worker. Your listening data never leaves your deployment.
- Zero dependencies. Deploys as a single serverless function.
- Fork-first design. You own the code and can modify it without upstream constraints.
- Optional Fleet integration. It can communicate with other Cocapn agents in your fleet if configured.

## Features
- Contextual playlists: Describe an activity or mood (e.g., "welding," "rainy walk") to generate a playlist from your listening history.
- Gradual genre exploration: Suggests new music by branching incrementally from tracks you already like.
- Listening annotations: Add notes or context to any track in your history.
- Transparent suggestions: Recommendations include a brief reason for each suggestion.
- No telemetry, tracking, or commercial elements.

**Limitation:** This tool requires manual import of listening data or integration via platform APIs you configure. It does not automatically pull from streaming services without your setup.

---

## Live demo
A transient instance with sample data:  
https://musiclog-ai.casey-digennaro.workers.dev

## Quick start
1. Fork this repository.
2. Deploy using Wrangler:

```bash
npx wrangler deploy
```
3. Set `DEEPSEEK_API_KEY` as a Cloudflare Worker secret to enable AI features. You can modify the configuration to use other LLM APIs.

## Architecture
A zero-dependency Cloudflare Worker built as a Stage 3 Refiner vessel for the Cocapn Fleet. All data persists within your worker. It can optionally communicate with other fleet agents.

## BYOK (Bring Your Own Keys)
Configure AI models via Cloudflare secrets. The default is set for DeepSeek, but you can adapt the configuration for any compatible LLM endpoint.

## Contributing
This is a fork-first project. The intended use is to fork and adapt it to your needs. Pull requests for general fixes and improvements are welcome upstream.

## License
MIT License © 2024 Superinstance & Lucineer (DiGennaro et al.)

---

<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> · 
  <a href="https://cocapn.ai">Cocapn</a>
</div>