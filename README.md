<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h1 align="center">musiclog-ai</h1>

<p align="center">A personal music log that runs on your Cloudflare account.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#the-fleet">The Fleet</a> ·
  <a href="https://musiclog-ai.casey-digennaro.workers.dev">Live Demo</a> ·
  <a href="https://github.com/Lucineer/musiclog-ai/issues">Issues</a>
</p>

---

musiclog-ai logs your listening habits to suggest music based on your history. It runs as a Cloudflare Worker, stores data in your repository, and can propose updates to itself over time. You maintain full control—no external servers or data sharing.

## Why this exists

Commercial music services often prioritize engagement over your taste. This tool lets you keep a private log and get suggestions tailored to your patterns, without algorithms designed for retention.

## What makes this different

This is a fork-first, self-hosted agent. You deploy it once on Cloudflare, and it operates independently. Your listening history stays in your repo as plain text. As a Cocapn vessel, it may suggest code improvements via git PRs based on usage. It works alone or can communicate with other agents in the Fleet.

**Powered by [Capitaine](https://github.com/Lucineer/capitaine) · [Cocapn](https://github.com/Lucineer/cocapn)**

## Quick Start

1. Fork this repository.
2. Clone your fork and navigate to it.
3. Log in to Cloudflare Workers and set secrets for GitHub token and LLM API key.
4. Deploy with Wrangler.

```bash
gh repo fork Lucineer/musiclog-ai --clone
cd musiclog-ai
npx wrangler login
echo "your-github-token" | npx wrangler secret put GITHUB_TOKEN
echo "your-llm-key" | npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler deploy
```

After deployment, your vessel is active. Note: ongoing usage may incur costs from LLM APIs.

## Features

- Playlist generation from your listening history.
- Genre exploration based on past preferences.
- Artist deep dives using chronology and related projects.
- Timestamped listening logs for context-aware suggestions.
- BYOK v2: Credentials managed via Cloudflare Secrets.
- Multi-model support: DeepSeek, SiliconFlow, and others.
- Session memory for persistent conversations.
- PII safety with automatic redaction.
- Built-in rate limiting for guest access.
- Health checks and fleet coordination via CRP-39.

## Architecture

A single Cloudflare Worker file with no runtime npm dependencies. Serves inline HTML and handles agent logic. Cold starts typically under 100ms.

```
src/
  worker.ts      # Main worker: user serving, heartbeats
lib/
  byok.ts        # Multi-model routing
  taste.ts       # Pattern inference from logs
  memory.ts      # Session and history management
```

## The Fleet

musiclog-ai is one vessel in the Cocapn Fleet—a network of open-source agents. It can optionally coordinate with others for enhanced functionality, but operates independently by default. Learn more about the ecosystem below.

<div align="center">
  <p>Attribution: Superinstance & Lucineer (DiGennaro et al.)</p>
  <p>
    <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> ·
    <a href="https://cocapn.ai">Cocapn</a>
  </p>
</div>