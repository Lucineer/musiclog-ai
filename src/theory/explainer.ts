// musiclog-ai — Theory Explainer
// Scales, chords, intervals, progressions, modes, contextual explanations

export interface TheoryTopic {
  id: string;
  category: 'scales' | 'chords' | 'intervals' | 'progressions' | 'modes' | 'rhythm';
  name: string;
  summary: string;
  detail: string;
  examples: string[];
  relatedTopics: string[];
}

export interface EarTrainingExercise {
  id: string;
  type: 'interval' | 'chord' | 'scale' | 'progression';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  hint: string;
}

export interface CompositionAid {
  type: 'progression' | 'melody' | 'rhythm';
  key: string;
  suggestion: string;
  explanation: string;
}

// ---------- Theory Database ----------

const TOPICS: TheoryTopic[] = [
  // SCALES
  {
    id: 'major-scale',
    category: 'scales',
    name: 'Major Scale',
    summary: 'The foundation of Western music — a 7-note scale with a bright, happy sound.',
    detail: `The major scale follows the interval pattern: W-W-H-W-W-W-H (W=whole step, H=half step).
In C major: C-D-E-F-G-A-B-C. Every other scale and chord in Western music is defined
by its relationship to the major scale. Understanding this pattern lets you build a
major scale starting on any note.`,
    examples: ['C Major: C D E F G A B C', 'G Major: G A B C D E F# G', 'D Major: D E F# G A B C# D'],
    relatedTopics: ['minor-scale', 'modes', 'intervals'],
  },
  {
    id: 'minor-scale',
    category: 'scales',
    name: 'Natural Minor Scale (Aeolian)',
    summary: 'A 7-note scale with a darker, sadder quality — relative minor of a major key.',
    detail: `The natural minor scale follows: W-H-W-W-H-W-W. It shares the same key signature
as its relative major (started on the 6th degree). C natural minor: C-D-Eb-F-G-Ab-Bb-C.
The flattened 3rd, 6th, and 7th give it its characteristic dark color.`,
    examples: ['A Minor: A B C D E F G A', 'E Minor: E F# G A B C D E', 'D Minor: D E F G A Bb C D'],
    relatedTopics: ['major-scale', 'harmonic-minor', 'modes'],
  },
  {
    id: 'harmonic-minor',
    category: 'scales',
    name: 'Harmonic Minor',
    summary: 'Natural minor with a raised 7th — creates the signature "Eastern" sound and strong V-i cadences.',
    detail: `The harmonic minor raises the 7th degree of the natural minor by a half step.
This creates an augmented 2nd between the 6th and 7th degrees — that exotic-sounding gap.
It exists primarily so V chords can be major (with a leading tone) in minor keys,
giving V-i cadences the same gravity as V-I in major.`,
    examples: ['A Harmonic Minor: A B C D E F G# A', 'E Harmonic Minor: E F# G A B C D# E'],
    relatedTopics: ['minor-scale', 'melodic-minor', 'modes'],
  },
  {
    id: 'pentatonic',
    category: 'scales',
    name: 'Pentatonic Scale',
    summary: 'A 5-note scale that never sounds wrong — the guitarist\'s best friend.',
    detail: `The major pentatonic removes the 4th and 7th from the major scale (the "avoid" notes).
The minor pentatonic removes the 2nd and 6th from natural minor. Because there are no
semitone clashes, it works over almost any chord progression in its key — the foundation
of rock, blues, folk, and pop improvisation.`,
    examples: ['C Major Pentatonic: C D E G A', 'A Minor Pentatonic: A C D E G', 'E Minor Pentatonic: E G A B D'],
    relatedTopics: ['major-scale', 'minor-scale', 'blues-scale'],
  },
  {
    id: 'blues-scale',
    category: 'scales',
    name: 'Blues Scale',
    summary: 'Minor pentatonic plus the blue note — instant emotion.',
    detail: `The blues scale adds a flat 5th (the "blue note") to the minor pentatonic.
This single note adds tension, expressiveness, and that characteristic bluesy cry.
In A: A-C-D-Eb-E-G. Bend into the flat 5 for maximum effect.`,
    examples: ['A Blues: A C D Eb E G', 'E Blues: E G A Bb B D', 'G Blues: G Bb C Db D F'],
    relatedTopics: ['pentatonic', 'minor-scale'],
  },
  // CHORDS
  {
    id: 'triads',
    category: 'chords',
    name: 'Triads',
    summary: 'Three-note chords — major, minor, diminished, augmented — the building blocks of harmony.',
    detail: `A triad is three notes stacked in thirds. The four qualities:
- Major: Root + major 3rd + perfect 5th (happy, bright)
- Minor: Root + minor 3rd + perfect 5th (sad, dark)
- Diminished: Root + minor 3rd + diminished 5th (tense, unstable)
- Augmented: Root + major 3rd + augmented 5th (dreamy, suspenseful)
Every chord you'll ever play is an extension or alteration of one of these four.`,
    examples: ['C Major: C-E-G', 'A Minor: A-C-E', 'B Diminished: B-D-F', 'C Augmented: C-E-G#'],
    relatedTopics: ['seventh-chords', 'intervals', 'progressions'],
  },
  {
    id: 'seventh-chords',
    category: 'chords',
    name: 'Seventh Chords',
    summary: 'Four-note chords that add color, tension, and jazz sophistication.',
    detail: `Adding a 4th note (a 7th) to a triad creates richer harmony:
- Major 7: warm, dreamy (C-E-G-B)
- Dominant 7: bluesy, tense, wants to resolve (C-E-G-Bb)
- Minor 7: mellow, smooth (C-Eb-G-Bb)
- Half-diminished (m7b5): dark, jazzy (C-Eb-Gb-Bb)
- Diminished 7: symmetric, suspenseful (C-Eb-Gb-Bbb)
Dominant 7th chords are the engine of tension-and-release in all Western music.`,
    examples: ['Cmaj7: C E G B', 'C7: C E G Bb', 'Dm7: D F A C', 'G7: G B D F'],
    relatedTopics: ['triads', 'extensions', 'progressions'],
  },
  {
    id: 'extensions',
    category: 'chords',
    name: 'Extended Chords (9ths, 11ths, 13ths)',
    summary: 'Stacking beyond the 7th — the sound of jazz, neo-soul, and modern R&B.',
    detail: `Extensions add notes beyond the 7th (which are octave-equivalents of 2, 4, 6):
- 9th: adds color and openness (Cmaj9 = C-E-G-B-D)
- 11th: adds suspension and ambiguity (Cmaj11 = C-E-G-B-D-F)
- 13th: the full stack — rich and complex (Cmaj13 = C-E-G-B-D-F-A)
In practice, you often omit the 5th or 11th to avoid muddiness. Voice leading matters
more than playing every single note.`,
    examples: ['Cmaj9: C E G B D', 'Dm9: D F A C E', 'G13: G B D F E', 'Fmaj11: F A C E G Bb'],
    relatedTopics: ['seventh-chords', 'voicings'],
  },
  // INTERVALS
  {
    id: 'intervals',
    category: 'intervals',
    name: 'Intervals',
    summary: 'The distance between two notes — the DNA of all melody and harmony.',
    detail: `Intervals are measured in semitones (half steps):
- m2 (1 semitone) — Jaws theme
- M2 (2) — Happy Birthday (first two notes)
- m3 (3) — Greensleeves opening
- M3 (4) — "When the Saints"
- P4 (5) — "Here Comes the Bride"
- Tritone (6) — "The Simpsons"
- P5 (7) — Star Wars theme
- m6 (8) — "The Entertainer"
- M6 (9) — "My Bonnie"
- m7 (10) — Star Trek theme
- M7 (11) — "Take On Me" (chorus)
- P8 (12) — "Somewhere Over the Rainbow"
Learning to hear intervals is the foundation of ear training.`,
    examples: ['Minor 2nd: C-C#', 'Major 3rd: C-E', 'Perfect 5th: C-G', 'Octave: C-C'],
    relatedTopics: ['triads', 'ear-training', 'scales'],
  },
  // PROGRESSIONS
  {
    id: 'progressions',
    category: 'progressions',
    name: 'Chord Progressions',
    summary: 'Sequences of chords that create the harmonic backbone of songs.',
    detail: `Common progressions:
- I-V-vi-IV (C-G-Am-F): the "pop progression" — countless hits
- ii-V-I (Dm7-G7-Cmaj7): the jazz standard, appears everywhere
- I-IV-V (C-F-G): blues, rock, country foundation
- vi-IV-I-V (Am-F-C-G): "sandwich" progression — emotional pop/rock
- I-vi-IV-V (C-Am-F-G): '50s progression — doo-wop, ballads
- iii-vi-ii-V (Em-Am-Dm-G): "circle" progression — jazz turnaround
The Roman numerals use uppercase for major, lowercase for minor.`,
    examples: ['Pop: C - G - Am - F', 'Jazz: Dm7 - G7 - Cmaj7', 'Blues: C - F - G', 'Sad pop: Am - F - C - G'],
    relatedTopics: ['seventh-chords', 'modes', 'composition'],
  },
  {
    id: 'ii-v-i',
    category: 'progressions',
    name: 'ii-V-I Progression',
    summary: 'The most important progression in jazz — and increasingly in pop and R&B.',
    detail: `The ii-V-I is a cadential progression that moves from subdominant (ii) through
dominant (V) to tonic (I). In C major: Dm7 → G7 → Cmaj7.

Why it works:
- The 7th of Dm7 (C) becomes the 4th of G7 (C) — a common tone
- The 3rd of Dm7 (F) resolves down to the 7th of G7 (F), then to E in Cmaj7
- The tritone in G7 (B-F) resolves outward to C-E in Cmaj7

Practice ii-V-I in all 12 keys. It's the jazz musician's scales.`,
    examples: ['C: Dm7 - G7 - Cmaj7', 'G: Am7 - D7 - Gmaj7', 'F: Gm7 - C7 - Fmaj7'],
    relatedTopics: ['progressions', 'seventh-chords', 'modes'],
  },
  // MODES
  {
    id: 'modes',
    category: 'modes',
    name: 'Modes of the Major Scale',
    summary: 'Seven scales from one parent — each starting on a different degree.',
    detail: `Each mode starts on a different degree of the major scale:
1. Ionian (I) — the major scale itself (happy, bright)
2. Dorian (ii) — minor with a major 6th (jazzy, soulful)
3. Phrygian (iii) — minor with a flat 2nd (Spanish, exotic)
4. Lydian (IV) — major with a sharp 4th (dreamy, floating)
5. Mixolydian (V) — major with a flat 7th (bluesy, rock)
6. Aeolian (vi) — natural minor (sad, dark)
7. Locrian (vii) — diminished tonic (unstable, tense)

In C major: C-Ionian, D-Dorian, E-Phrygian, F-Lydian, G-Mixolydian, A-Aeolian, B-Locrian.`,
    examples: ['D Dorian: D E F G A B C', 'F Lydian: F G A B C D E', 'G Mixolydian: G A B C D E F'],
    relatedTopics: ['major-scale', 'minor-scale', 'progressions'],
  },
  // RHYTHM
  {
    id: 'rhythm',
    category: 'rhythm',
    name: 'Rhythm & Time Signatures',
    summary: 'The pulse of music — meter, syncopation, and groove.',
    detail: `Rhythm is organized in measures with a time signature (beats/measure over beat unit):
- 4/4: common time — rock, pop, hip-hop
- 3/4: waltz feel — ballads, folk
- 6/8: compound duple — ballads, sea shanties
- 7/8, 5/4: odd meters — prog rock, jazz fusion

Syncopation places emphasis on weak beats or off-beats, creating groove and forward motion.
Practice with a metronome, tap your foot, and count out loud: "1-e-&-a, 2-e-&-a."`,
    examples: ['4/4 rock: ONE two THREE four', '3/4 waltz: ONE two three', '5/4: Take Five (Dave Brubeck)'],
    relatedTopics: ['progressions', 'composition'],
  },
];

// ---------- Song-based context ----------

export function explainWithContext(topic: string, songs: string[]): string {
  const t = TOPICS.find(x => x.id === topic || x.name.toLowerCase() === topic.toLowerCase());
  if (!t) return `Topic "${topic}" not found. Try: ${TOPICS.map(x => x.name).join(', ')}`;

  let explanation = `## ${t.name}\n\n${t.detail}\n\n`;
  if (songs.length > 0) {
    explanation += `### How this connects to your repertoire:\n`;
    explanation += `When you're playing ${songs.slice(0, 3).join(', ')}, you're already using these concepts. `;
    explanation += `Listen for the ${t.category === 'chords' ? 'chord qualities' : t.category === 'scales' ? 'scale patterns' : 'patterns'} `;
    explanation += `described above in the songs you know — it'll click faster when you hear it in music you love.\n`;
  }
  explanation += `**Key examples:** ${t.examples.join(' | ')}`;
  return explanation;
}

// ---------- Get topics ----------

export function getTopics(category?: string): TheoryTopic[] {
  if (category) return TOPICS.filter(t => t.category === category);
  return TOPICS;
}

export function getTopic(id: string): TheoryTopic | undefined {
  return TOPICS.find(t => t.id === id);
}

// ---------- Ear Training ----------

export function getEarTrainingSuggestions(weakAreas?: string[]): EarTrainingExercise[] {
  const exercises: EarTrainingExercise[] = [
    {
      id: 'et-m2-m3',
      type: 'interval',
      difficulty: 'beginner',
      description: 'Distinguish minor 2nd (Jaws) from minor 3rd (Greensleeves). Play both intervals on your instrument and sing them back.',
      hint: 'The minor 2nd is tighter, more dissonant. The minor 3rd sounds like the opening of "Greensleeves."',
    },
    {
      id: 'et-m3-m3',
      type: 'interval',
      difficulty: 'beginner',
      description: 'Distinguish major 3rd ("When the Saints") from minor 3rd (sad quality). These are the most common intervals in melodies.',
      hint: 'Major 3rd is brighter, "happier." Minor 3rd has that sad, somber quality.',
    },
    {
      id: 'et-p4-p5',
      type: 'interval',
      difficulty: 'beginner',
      description: 'Distinguish perfect 4th ("Here Comes the Bride") from perfect 5th (Star Wars). Both sound "clean" but the 5th is wider.',
      hint: 'The perfect 4th has a "march" feel. The 5th sounds like a fanfare — "Star Wars!"',
    },
    {
      id: 'et-major-minor-triad',
      type: 'chord',
      difficulty: 'beginner',
      description: 'Identify major vs. minor triads by ear. Have someone play a triad and guess — major sounds happy, minor sounds sad.',
      hint: 'It all comes down to the 3rd. Major 3rd = bright, minor 3rd = dark.',
    },
    {
      id: 'et-dominant-maj7',
      type: 'chord',
      difficulty: 'intermediate',
      description: 'Distinguish dominant 7th (G7) from major 7th (Gmaj7). Dom7 has tension, maj7 is dreamy.',
      hint: 'Dom7 sounds like it wants to go somewhere. Maj7 sounds content, floaty.',
    },
    {
      id: 'et-ii-v-i',
      type: 'progression',
      difficulty: 'intermediate',
      description: 'Identify ii-V-I progressions in songs. Listen for the "going home" feeling — tension (ii) → more tension (V) → resolution (I).',
      hint: 'The V chord is the "maybe" and the I chord is the "yes." Feel the relief at the I.',
    },
    {
      id: 'et-dorian-mode',
      type: 'scale',
      difficulty: 'advanced',
      description: 'Distinguish Dorian from natural minor. Dorian has a raised 6th that gives it a brighter, soulful quality.',
      hint: 'Dorian sounds like minor but with a "ray of sunshine" — that major 6th is the giveaway.',
    },
    {
      id: 'et-tritone-sub',
      type: 'progression',
      difficulty: 'advanced',
      description: 'Spot tritone substitutions. When a dominant chord resolves down a half step instead of up a 4th, that\'s a tritone sub.',
      hint: 'Listen for a dominant chord going somewhere unexpected — usually a half step down.',
    },
  ];

  if (weakAreas && weakAreas.length > 0) {
    // Prioritize exercises matching weak areas
    const prioritized = exercises.filter(e => weakAreas.includes(e.type));
    const rest = exercises.filter(e => !weakAreas.includes(e.type));
    return [...prioritized, ...rest];
  }
  return exercises;
}

// ---------- Composition Aids ----------

export function getCompositionAids(key: string): CompositionAid[] {
  return [
    {
      type: 'progression',
      key,
      suggestion: 'I - vi - ii - V',
      explanation: 'The "circle" progression — every root moves down a 5th. Smooth voice leading, used in countless jazz tunes.',
    },
    {
      type: 'progression',
      key,
      suggestion: 'I - iii - IV - V',
      explanation: 'Ascending energy — each chord lifts. Great for building sections. Think "Don\'t Stop Believin\'."',
    },
    {
      type: 'progression',
      key,
      suggestion: 'i - bVI - bIII - bVII',
      explanation: 'Minor key modal progression — epic, cinematic. Think "Lose Yourself" or any epic film score.',
    },
    {
      type: 'melody',
      key,
      suggestion: 'Start on the 3rd or 5th, resolve to the root',
      explanation: 'Beginning on a chord tone other than the root creates melodic interest. The return "home" to the root is satisfying.',
    },
    {
      type: 'melody',
      key,
      suggestion: 'Use chord tones on strong beats, passing tones on weak beats',
      explanation: 'This "outlines" the harmony naturally. Think of Beethoven\'s Ode to Joy — almost entirely chord tones.',
    },
    {
      type: 'melody',
      key,
      suggestion: 'Sequence: repeat a short idea starting on different scale degrees',
      explanation: 'Sequences create coherence and momentum. Move a 3-note motif up the scale — instant development.',
    },
    {
      type: 'rhythm',
      key,
      suggestion: 'Place a motif on the "and" of 2 instead of beat 1',
      explanation: 'Syncopating a melody by displacing it half a beat creates instant groove and surprise.',
    },
    {
      type: 'rhythm',
      key,
      suggestion: 'Leave beats empty — rest is a compositional tool',
      explanation: 'Silence creates tension and makes the notes that follow hit harder. Miles Davis mastered this.',
    },
  ];
}

// ---------- Analyze chord query ----------

export function analyzeChordQuery(query: string): string {
  // Parse queries like "what scale goes with Am7-Dm7-G7-CM7"
  const chordMatch = query.match(/([A-G][#b]?m?(?:7|maj7|dim|aug|sus[24]?|add9|6|9|11|13)*)/g);
  if (!chordMatch || chordMatch.length === 0) {
    return "I couldn't find any chord symbols in your question. Try something like: 'What scale goes with Am7 Dm7 G7 Cmaj7'";
  }

  const chords = chordMatch;
  const roots = chords.map(c => c.replace(/m?(?:7|maj7|dim|aug|sus[24]?|add9|6|9|11|13).*$/, ''));
  const hasMinor = chords.some(c => /m(?!aj)/.test(c));
  const hasDominant7 = chords.some(c => /^[A-G][#b]?7$/.test(c));
  const hasMaj7 = chords.some(c => /maj7/.test(c));

  let response = `### Analyzing: ${chords.join(' - ')}\n\n`;
  response += `**Chords detected:** ${chords.join(', ')}\n\n`;

  // Detect ii-V-I
  if (chords.length >= 3) {
    const is2_5_1 =
      chords.some(c => /m7?$/.test(c)) &&
      chords.some(c => /^[A-G][#b]?7$/.test(c)) &&
      chords.some(c => /maj7/.test(c) || /^[A-G][#b]?$/.test(c));
    if (is2_5_1) {
      response += `This looks like a **ii-V-I progression**! This is the most important progression in jazz.\n\n`;
    }
  }

  // Suggest scales
  const uniqueRoots = [...new Set(roots)];
  if (uniqueRoots.length <= 2 && hasDominant7) {
    response += `**Scale suggestions:**\n`;
    response += `- **Mixolydian** over the dominant chords — that flat 7 fits perfectly\n`;
    if (hasMinor) response += `- **Dorian mode** over the minor chords — minor with a major 6th\n`;
    response += `- **Major scale** of the key center — safe, diatonic choice\n`;
    if (hasMaj7) response += `- **Lydian** over the maj7 chord — that #4 adds sparkle\n`;
  } else {
    response += `**Scale suggestions:**\n`;
    response += `- Start with the **major scale** of your key center\n`;
    if (hasMinor) response += `- Use **Dorian** or **natural minor** over minor chords\n`;
    response += `- Match the chord tones — land on 3rds and 7ths for strong lines\n`;
  }

  response += `\n**Pro tip:** Focus on chord tones (root, 3rd, 5th, 7th) on strong beats, and use scale tones as passing notes. This always sounds musical.`;
  return response;
}
