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
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': 'default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';' },
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
    return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Musiclog — AI music companion</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh}a{color:#ec4899;text-decoration:none}.hero{max-width:800px;margin:0 auto;padding:80px 24px 40px;text-align:center}.logo{font-size:64px;margin-bottom:16px}h1{font-size:clamp(2rem,5vw,3rem);font-weight:700;background:linear-gradient(135deg,#ec4899,#ec489988);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}.tagline{font-size:1.15rem;color:#94a3b8;max-width:500px;margin:0 auto 48px;line-height:1.6}.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;max-width:700px;margin:0 auto;padding:0 24px 60px}.feat{background:#111118;border:1px solid #1e1e2e;border-radius:12px;padding:20px;transition:border-color .2s}.feat:hover{border-color:#ec489944}.feat-icon{color:#ec4899;font-size:1.2rem;margin-bottom:8px}.feat-text{font-size:.9rem;color:#cbd5e1}.chat-section{max-width:700px;margin:0 auto;padding:0 24px 80px}.chat-box{background:#111118;border:1px solid #1e1e2e;border-radius:16px;padding:24px}.chat-box h3{font-size:1.1rem;margin-bottom:12px;color:#ec4899}.chat-box p{font-size:.9rem;color:#94a3b8;line-height:1.6;margin-bottom:16px}.chat-input{display:flex;gap:8px}.chat-input input{flex:1;background:#0a0a0f;border:1px solid #1e1e2e;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:.9rem;outline:none}.chat-input input:focus{border-color:#ec4899}.chat-input button{background:#ec4899;color:#0a0a0f;border:none;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer;font-size:.9rem}.chat-input button:hover{opacity:.9}.fleet{text-align:center;padding:40px 24px;color:#475569;font-size:.8rem}.fleet a{color:#64748b;margin:0 8px}</style></head><body><div class="hero"><div class="logo">🎵</div><h1>Musiclog</h1><p class="tagline">Discover music, create mood playlists, and track your listening journey.</p></div><div class="features"><div class="feat"><div class="feat-icon">✦</div><div class="feat-text">Listening history</div></div><div class="feat"><div class="feat-icon">✦</div><div class="feat-text">Mood playlists</div></div><div class="feat"><div class="feat-icon">✦</div><div class="feat-text">Genre exploration</div></div><div class="feat"><div class="feat-icon">✦</div><div class="feat-text">Artist discovery</div></div><div class="feat"><div class="feat-icon">✦</div><div class="feat-text">Practice tracker</div></div><div class="feat"><div class="feat-icon">✦</div><div class="feat-text">AI DJ chat</div></div></div><div class="chat-section"><div class="chat-box"><h3>🎵 Chat with Musiclog</h3><p>Powered by <a href="https://cocapn.ai">Cocapn</a> — bring your own API key or try with 5 free messages.</p><div class="chat-input"><input type="text" id="msg" placeholder="Ask anything..."><button onclick="send()">Send</button></div></div></div><div class="fleet"><a href="https://the-fleet.casey-digennaro.workers.dev">⚓ The Fleet</a> · <a href="https://cocapn.ai">Cocapn</a> · <a href="https://github.com/Lucineer/musiclog-ai">GitHub</a></div><script>async function send(){const m=document.getElementById("msg"),t=m.value.trim();if(!t)return;const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t})});const d=await r.json();alert(d.response||d.error||"No response");m.value=""}document.getElementById("msg").addEventListener("keydown",e=>{if(e.key==="Enter")send()});</script></body></html>`, { headers: { "Content-Type": "text/html;charset=utf-8" } });
  }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const method = request.method;

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

    // Standard routes
    if (path === '/health') return new Response(JSON.stringify({ status: 'ok', repo: 'musiclog-ai', timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        if (path === '/vessel.json') { try { const vj = await import('./vessel.json', { with: { type: 'json' } }); return new Response(JSON.stringify(vj.default || vj), { headers: { 'Content-Type': 'application/json' } }); } catch { return new Response('{}', { headers: { 'Content-Type': 'application/json' } }); } }
    if (path === '/setup') return new Response(JSON.stringify({ repo: 'musiclog-ai', routes: ['/', '/health', '/setup', '/api/chat', '/api/practice', '/api/theory', '/api/seed', '/api/efficiency', '/api/confidence', '/api/evaporation', '/api/memory', '/api/kg'] }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (path === '/api/seed') return new Response(JSON.stringify({ repo: 'musiclog-ai', seeded: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (path === '/api/efficiency') return new Response(JSON.stringify({ repo: 'musiclog-ai', deadbandThreshold: 0.85, cacheHitRate: 0, totalQueries: 0 }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (path === '/api/confidence') return new Response(JSON.stringify({ repo: 'musiclog-ai', avgConfidence: 0, totalTracked: 0 }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (path === '/api/evaporation') return new Response(JSON.stringify({ hot: [], warm: [], coverage: 0, repo: 'musiclog-ai', timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (path === '/api/memory') return new Response(JSON.stringify({ patterns: [], repo: 'musiclog-ai', timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

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
