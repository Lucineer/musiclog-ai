// musiclog-ai — Practice Tracker
// Session logging, streak counting, goals, spaced repetition, insights

export interface PracticeSession {
  id: string;
  date: string;          // ISO date
  duration: number;      // minutes
  instrument: string;
  pieces: string[];
  focusAreas: string[];
  rating: number;        // 1-5
  notes?: string;
}

export interface PracticeGoal {
  id: string;
  type: 'weekly' | 'monthly';
  targetMinutes: number;
  currentMinutes: number;
  startDate: string;
  endDate: string;
  label: string;
}

export interface PracticeInsight {
  type: 'streak' | 'peak_time' | 'avoidance' | 'improvement' | 'consistency';
  title: string;
  description: string;
  value: number;
}

// ---------- In-memory store (KV-backed in production) ----------

let sessions: PracticeSession[] = [];
let goals: PracticeGoal[] = [];

export function resetStore() {
  sessions = [];
  goals = [];
}

// ---------- CRUD ----------

export function addSession(session: Omit<PracticeSession, 'id'>): PracticeSession {
  const s: PracticeSession = { ...session, id: crypto.randomUUID() };
  sessions.push(s);
  // Update any active goals
  goals.forEach(g => {
    if (g.startDate <= s.date && g.endDate >= s.date) {
      g.currentMinutes += s.duration;
    }
  });
  return s;
}

export function getSessions(opts?: { instrument?: string; from?: string; to?: string }): PracticeSession[] {
  let result = [...sessions];
  if (opts?.instrument) result = result.filter(s => s.instrument === opts.instrument);
  if (opts?.from) result = result.filter(s => s.date >= opts.from!);
  if (opts?.to) result = result.filter(s => s.date <= opts.to!);
  return result.sort((a, b) => b.date.localeCompare(a.date));
}

export function getSession(id: string): PracticeSession | undefined {
  return sessions.find(s => s.id === id);
}

// ---------- Streaks ----------

export function getStreak(): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  let current = 1;
  let longest = 1;
  let run = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  // Check if streak is active (includes today or yesterday)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const active = dates[0] === today || dates[0] === yesterday;
  current = active ? run : 0;
  longest = Math.max(longest, current);
  return { current, longest };
}

// ---------- Goals ----------

export function addGoal(goal: Omit<PracticeGoal, 'id' | 'currentMinutes'>): PracticeGoal {
  const g: PracticeGoal = { ...goal, id: crypto.randomUUID(), currentMinutes: 0 };
  // Calculate current progress from existing sessions
  g.currentMinutes = sessions
    .filter(s => s.date >= g.startDate && s.date <= g.endDate)
    .reduce((sum, s) => sum + s.duration, 0);
  goals.push(g);
  return g;
}

export function getGoals(): PracticeGoal[] {
  return goals;
}

// ---------- Spaced Repetition ----------

export interface RepetitionSuggestion {
  piece: string;
  lastPracticed: string;
  daysSince: number;
  urgency: 'overdue' | 'due' | 'fresh';
  recommendation: string;
}

export function getSpacedRepetitionSuggestions(): RepetitionSuggestion[] {
  const pieceMap = new Map<string, string>(); // piece -> last date
  for (const s of sessions) {
    for (const p of s.pieces) {
      const existing = pieceMap.get(p);
      if (!existing || s.date > existing) pieceMap.set(p, s.date);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const suggestions: RepetitionSuggestion[] = [];

  for (const [piece, lastDate] of pieceMap) {
    const daysSince = Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000);
    let urgency: RepetitionSuggestion['urgency'];
    let recommendation: string;

    if (daysSince > 7) {
      urgency = 'overdue';
      recommendation = `It's been ${daysSince} days since you practiced "${piece}". Revisit it to reinforce muscle memory.`;
    } else if (daysSince > 3) {
      urgency = 'due';
      recommendation = `"${piece}" is due for a refresher — spacing practice helps long-term retention.`;
    } else {
      urgency = 'fresh';
      recommendation = `"${piece}" is still fresh. Focus on something else and come back in a few days.`;
    }
    suggestions.push({ piece, lastPracticed: lastDate, daysSince, urgency, recommendation });
  }

  return suggestions.sort((a, b) => b.daysSince - a.daysSince);
}

// ---------- Insights ----------

export function getInsights(): PracticeInsight[] {
  const insights: PracticeInsight[] = [];
  const streak = getStreak();
  insights.push({
    type: 'streak',
    title: 'Current Streak',
    description: `You're on a ${streak.current}-day streak!`,
    value: streak.current,
  });

  if (sessions.length >= 3) {
    // Peak practice day
    const dayCounts = new Map<string, number>();
    for (const s of sessions) {
      const day = new Date(s.date).toLocaleDateString('en', { weekday: 'long' });
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }
    const peakDay = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    insights.push({
      type: 'peak_time',
      title: 'Peak Practice Day',
      description: `You practice most on ${peakDay[0]} (${peakDay[1]} sessions).`,
      value: peakDay[1],
    });

    // Average session
    const avgDuration = Math.round(sessions.reduce((s, x) => s + x.duration, 0) / sessions.length);
    insights.push({
      type: 'consistency',
      title: 'Average Session',
      description: `Your average session is ${avgDuration} minutes.`,
      value: avgDuration,
    });

    // Instruments played
    const instruments = new Set(sessions.map(s => s.instrument));
    if (instruments.size > 1) {
      insights.push({
        type: 'consistency',
        title: 'Multi-Instrumentalist',
        description: `You play ${instruments.size} instruments: ${[...instruments].join(', ')}.`,
        value: instruments.size,
      });
    }

    // Rating trend
    const recent = sessions.slice(-5);
    const older = sessions.slice(-10, -5);
    if (older.length >= 2 && recent.length >= 2) {
      const recentAvg = recent.reduce((s, x) => s + x.rating, 0) / recent.length;
      const olderAvg = older.reduce((s, x) => s + x.rating, 0) / older.length;
      if (recentAvg > olderAvg + 0.3) {
        insights.push({
          type: 'improvement',
          title: 'Rising Satisfaction',
          description: `Your session ratings are trending up — keep it going!`,
          value: Math.round(recentAvg * 10) / 10,
        });
      }
    }
  }

  return insights;
}

// ---------- Progress Stats ----------

export function getProgressStats() {
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((s, x) => s + x.duration, 0);
  const instruments = [...new Set(sessions.map(s => s.instrument))];
  const pieces = [...new Set(sessions.flatMap(s => s.pieces))];
  const avgRating = totalSessions > 0
    ? Math.round((sessions.reduce((s, x) => s + x.rating, 0) / totalSessions) * 10) / 10
    : 0;
  const streak = getStreak();

  // Weekly minutes (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const weeklyMinutes = sessions
    .filter(s => s.date >= weekAgo)
    .reduce((s, x) => s + x.duration, 0);

  return {
    totalSessions,
    totalMinutes,
    avgRating,
    streak,
    weeklyMinutes,
    instruments,
    pieces,
  };
}
