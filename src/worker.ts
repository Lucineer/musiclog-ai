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
    if (path === '/' && request.method === 'GET') {
      // Serve app.html from embedded assets or read from KV
      try {
        const asset = await import('../public/app.html?raw');
        return html(asset.default);
      } catch {
        // Fallback: inline minimal landing
        return html(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>musiclog.ai</title></head><body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#F59E0B">musiclog.ai</h1><p>Your AI practice captain</p></div></body></html>`);
      }
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
