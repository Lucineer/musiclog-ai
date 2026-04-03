import { addNode, addEdge, traverse, crossDomainQuery, findPath, domainStats, getDomainNodes } from './lib/knowledge-graph.js';
import { loadSeedIntoKG, FLEET_REPOS, loadAllSeeds } from './lib/seed-loader.js';
// musiclog-ai — Cloudflare Worker
// API routes for practice tracking, theory, songs, progress, and AI chat

import {
  addSession, getSessions, getSession, getStreak, addGoal, getGoals,
  getSpacedRepetitionSuggestions, getInsights, getProgressStats,
} from './practice/tracker';
import {
  getTopics, getTopic, explainWithContext, getEarTrainingSuggestions,
  getCompositionAids, analyzeChordQuery,
} from './theory/explainer';

interface Env {
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL?: string;
}

// ---------- Song Store ----------

interface Song {
  id: string;
  title: string;
  artist: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number; // 0-100
  instrument?: string;
  notes?: string;
  dateAdded: string;
}

let songs: Song[] = [];

// ---------- Helpers ----------

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function html(content: string, status = 200) {
  return new Response(content, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ---------- DeepSeek SSE Chat ----------

async function handleChat(request: Request, env: Env): Promise<Response> {
  const { message, repertoire } = await request.json() as { message: string; repertoire?: string[] };

  if (!env.DEEPSEEK_API_KEY) {
    return json({ error: 'DeepSeek API key not configured. Set DEEPSEEK_API_KEY.' }, 500);
  }

  const systemPrompt = `You are the musiclog.ai captain — an expert music teacher, practice coach, and theory explainer.
You help musicians with practice strategies, music theory, ear training, composition, and repertoire management.
Be encouraging, specific, and practical. Use music notation when helpful (chord symbols, scale degrees, intervals).
If the user asks about chord progressions or scales, analyze the specific chords and give concrete suggestions.
${repertoire?.length ? `The user's current repertoire includes: ${repertoire.join(', ')}.` : ''}`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const resp = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.DEEPSEEK_MODEL || 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            stream: true,
            max_tokens: 1024,
            temperature: 0.7,
          }),
        });

        if (!resp.ok) {
          const err = await resp.text();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `DeepSeek API error: ${err}` })}\n\n`));
          controller.close();
          return;
        }

        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ---------- Router ----------

function landingPage(): Response {
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MusicLog.ai — Your AI Practice Captain</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0}.hero{background:linear-gradient(135deg,#1E3A5F,#0f172a);padding:5rem 2rem 3rem;text-align:center}.hero h1{font-size:3rem;background:linear-gradient(135deg,#F59E0B,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:.5rem}.hero .tagline{color:#94a3b8;font-size:1.15rem;max-width:550px;margin:0 auto 1.5rem}.fork-btns{display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap}.fork-btns a{padding:.5rem 1.2rem;background:rgba(245,158,11,.1);border:1px solid #F59E0B33;border-radius:8px;color:#F59E0B;text-decoration:none;font-size:.85rem}.fork-btns a:hover{background:rgba(245,158,11,.2)}.features{max-width:800px;margin:0 auto 3rem;padding:0 1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.feat{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1.2rem}.feat h3{color:#F59E0B;margin-bottom:.4rem;font-size:.95rem}.feat p{color:#94a3b8;font-size:.82rem;line-height:1.5}.demo-section{max-width:800px;margin:0 auto 3rem;padding:0 1rem}.demo-label{color:#F59E0B;font-size:.8rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}.demo-label::before,.demo-label::after{content:'';flex:1;height:1px;background:#1e293b}.chat{background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden;font-size:.9rem}.msg{padding:.8rem 1.2rem;border-bottom:1px solid #0f172a;display:flex;gap:.8rem}.msg:last-child{border-bottom:none}.msg.user{background:#162032}.msg.tutor{background:#1e293b}.avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0}.msg.user .avatar{background:#F59E0B;color:#0f172a;font-weight:700}.msg.tutor .avatar{background:#1E3A5F;color:#F59E0B}.msg-body{flex:1}.msg-name{font-size:.72rem;color:#475569;margin-bottom:.15rem}.msg-text{color:#cbd5e1;line-height:1.5}.msg-text code{background:#0f172a;padding:.1rem .35rem;border-radius:3px;font-size:.82rem;color:#F59E0B;font-family:monospace}.footer{text-align:center;padding:2rem;color:#475569;font-size:.8rem;border-top:1px solid #1e293b}</style></head><body><div class="hero"><h1>MusicLog.ai</h1><p class="tagline">Your AI practice captain — track sessions, master theory, level up your playing.</p><div class="fork-btns"><a href="https://github.com/superinstance/musiclog-ai" target="_blank">\u2B50 Star</a><a href="https://github.com/superinstance/musiclog-ai/fork" target="_blank">\uD83C\uDF54 Fork</a></div></div><div class="features"><div class="feat"><h3>\uD83C\uDFB5 Practice Tracking</h3><p>Log sessions, track streaks, set goals. Spaced repetition tells you what to practice next.</p></div><div class="feat"><h3>\uD83C\uDFAD Music Theory</h3><p>AI-powered theory explanations, ear training suggestions, and composition aids.</p></div><div class="feat"><h3>\uD83C\uDF1F Progress Insights</h3><p>Visualize your journey. See patterns, strengths, and areas to focus on.</p></div></div><div class="demo-section"><div class="demo-label">Sample AI Session</div><div class="chat"><div class="msg user"><div class="avatar">P</div><div class="msg-body"><div class="msg-name">Player</div><div class="msg-text">I've been practicing barre chords for a week but my F major still sounds muted.</div></div></div><div class="msg tutor"><div class="avatar">\uD83C\uDFB6</div><div class="msg-body"><div class="msg-name">MusicLog.ai</div><div class="msg-text">Good persistence! Let's diagnose. When you play the F barre, which strings are muted — the high E and B, or the low E and A?</div></div></div><div class="msg user"><div class="avatar">P</div><div class="msg-body"><div class="msg-name">Player</div><div class="msg-text">Mostly the high strings, 1st and 2nd.</div></div></div><div class="msg tutor"><div class="avatar">\uD83C\uDFB6</div><div class="msg-body"><div class="msg-name">MusicLog.ai</div><div class="msg-text">Classic. Your index finger is likely rolling back instead of pressing straight down. Try this: place your index on just the 1st and 2nd strings at fret 1 first, get those ringing clean, then gradually lay the rest of the barre down. <code>\u266A</code></div></div></div></div></div><div class="footer">MusicLog.ai — Part of the LogOS ecosystem. Open source.</div></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Landing page
    // ── Knowledge Graph (Phase 4B) ──
    if (path.startsWith('/api/kg')) {
      const _kj = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      if (path === '/api/kg' && method === 'GET') return _kj({ domain: url.searchParams.get('domain') || 'musiclog-ai', nodes: await getDomainNodes(env, url.searchParams.get('domain') || 'musiclog-ai') });
      if (path === '/api/kg/explore' && method === 'GET') {
        const nid = url.searchParams.get('node');
        if (!nid) return _kj({ error: 'node required' }, 400);
        return _kj(await traverse(env, nid, parseInt(url.searchParams.get('depth') || '2'), url.searchParams.get('domain') || undefined));
      }
      if (path === '/api/kg/cross' && method === 'GET') return _kj({ query: url.searchParams.get('query') || '', domain: url.searchParams.get('domain') || 'musiclog-ai', results: await crossDomainQuery(env, url.searchParams.get('query') || '', url.searchParams.get('domain') || 'musiclog-ai') });
      if (path === '/api/kg/domains' && method === 'GET') return _kj(await domainStats(env));
      if (path === '/api/kg/sync' && method === 'POST') return _kj(await loadAllSeeds(env, FLEET_REPOS));
      if (path === '/api/kg/seed' && method === 'POST') { const b = await request.json(); return _kj(await loadSeedIntoKG(env, b, b.domain || 'musiclog-ai')); }
    }

    if (path === '/' && request.method === 'GET') {
      return landingPage();
    }

    // ---------- Chat (SSE) ----------
    if (path === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    // ---------- Practice Sessions ----------
    if (path === '/api/practice' && request.method === 'POST') {
      const body = await request.json() as Omit<import('./practice/tracker').PracticeSession, 'id'>;
      if (!body.date || !body.duration || !body.instrument) {
        return json({ error: 'date, duration, and instrument are required' }, 400);
      }
      const session = addSession({
        ...body,
        pieces: body.pieces || [],
        focusAreas: body.focusAreas || [],
        rating: body.rating || 3,
      });
      return json(session, 201);
    }

    if (path === '/api/practice' && request.method === 'GET') {
      const instrument = url.searchParams.get('instrument') || undefined;
      const from = url.searchParams.get('from') || undefined;
      const to = url.searchParams.get('to') || undefined;
      return json(getSessions({ instrument, from, to }));
    }

    // ---------- Songs ----------
    if (path === '/api/songs' && request.method === 'POST') {
      const body = await request.json() as Omit<Song, 'id' | 'dateAdded'>;
      if (!body.title || !body.artist) {
        return json({ error: 'title and artist are required' }, 400);
      }
      const song: Song = {
        ...body,
        id: crypto.randomUUID(),
        dateAdded: new Date().toISOString().slice(0, 10),
        difficulty: body.difficulty || 'intermediate',
        progress: body.progress || 0,
      };
      songs.push(song);
      return json(song, 201);
    }

    if (path === '/api/songs' && request.method === 'GET') {
      return json(songs);
    }

    // ---------- Theory ----------
    if (path === '/api/theory' && request.method === 'GET') {
      const category = url.searchParams.get('category') || undefined;
      const id = url.searchParams.get('id') || undefined;
      const query = url.searchParams.get('q') || undefined;

      if (query) {
        // Check if it's a chord analysis query
        if (/chord|scale.*with|progression/i.test(query) && /[A-G][#b]?m?\d?/.test(query)) {
          return json({ analysis: analyzeChordQuery(query) });
        }
        const repertoire = url.searchParams.get('repertoire')?.split(',') || [];
        return json({ explanation: explainWithContext(query, repertoire) });
      }
      if (id) {
        const topic = getTopic(id);
        return topic ? json(topic) : json({ error: 'Topic not found' }, 404);
      }
      return json(getTopics(category));
    }

    // Ear training
    if (path === '/api/theory/ear-training' && request.method === 'GET') {
      const weak = url.searchParams.get('weak')?.split(',') || undefined;
      return json(getEarTrainingSuggestions(weak));
    }

    // Composition aids
    if (path === '/api/theory/compose' && request.method === 'GET') {
      const key = url.searchParams.get('key') || 'C';
      return json(getCompositionAids(key));
    }

    // ---------- Practice Goals ----------
    if (path === '/api/practice/goals' && request.method === 'POST') {
      const body = await request.json() as Omit<import('./practice/tracker').PracticeGoal, 'id' | 'currentMinutes'>;
      return json(addGoal(body), 201);
    }

    if (path === '/api/practice/goals' && request.method === 'GET') {
      return json(getGoals());
    }

    // ---------- Streaks ----------
    if (path === '/api/practice/streak' && request.method === 'GET') {
      return json(getStreak());
    }

    // ---------- Spaced Repetition ----------
    if (path === '/api/practice/review' && request.method === 'GET') {
      return json(getSpacedRepetitionSuggestions());
    }

    // ---------- Insights ----------
    if (path === '/api/practice/insights' && request.method === 'GET') {
      return json(getInsights());
    }

    // ---------- Progress Stats ----------
    if (path === '/api/progress' && request.method === 'GET') {
      return json(getProgressStats());
    }

    return json({ error: 'Not found', endpoints: [
      'POST /api/chat',
      'GET/POST /api/practice',
      'GET/POST /api/practice/goals',
      'GET /api/practice/streak',
      'GET /api/practice/review',
      'GET /api/practice/insights',
      'GET/POST /api/songs',
      'GET /api/theory',
      'GET /api/theory/ear-training',
      'GET /api/theory/compose',
      'GET /api/progress',
    ] }, 404);
  },
} satisfies ExportedHandler<Env>;
