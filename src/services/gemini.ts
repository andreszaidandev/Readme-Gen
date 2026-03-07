import { GoogleGenAI } from '@google/genai';
import type { RepoInfo } from '../types';

let aiClient: GoogleGenAI | null = null;

const TEXT_MODEL_CANDIDATES = ['gemini-2.5-pro'];
const RATE_LIMIT_STORAGE_KEY = 'readme-gen:gemini-rate-limit';
let rateLimitQueue: Promise<void> = Promise.resolve();

type RateLimitState = {
  recentTimestampsMs: number[];
  dayKey: string;
  dayCount: number;
  lastRequestAtMs: number;
};

type RateLimitConfig = {
  minIntervalMs: number;
  maxPerMinute: number;
  maxPerDay: number;
  disabled: boolean;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRateLimitConfig(): RateLimitConfig {
  return {
    minIntervalMs: parsePositiveInt(import.meta.env.VITE_GEMINI_MIN_INTERVAL_MS, 12000),
    maxPerMinute: parsePositiveInt(import.meta.env.VITE_GEMINI_MAX_PER_MINUTE, 4),
    maxPerDay: parsePositiveInt(import.meta.env.VITE_GEMINI_MAX_PER_DAY, 120),
    disabled: import.meta.env.VITE_GEMINI_DISABLE_CLIENT_RATE_LIMIT === 'true',
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getDayKey(nowMs: number): string {
  const date = new Date(nowMs);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function readRateLimitState(nowMs: number): RateLimitState {
  const fallbackState: RateLimitState = {
    recentTimestampsMs: [],
    dayKey: getDayKey(nowMs),
    dayCount: 0,
    lastRequestAtMs: 0,
  };

  if (typeof window === 'undefined') {
    return fallbackState;
  }

  try {
    const raw = window.localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) {
      return fallbackState;
    }

    const parsed = JSON.parse(raw) as Partial<RateLimitState>;
    return {
      recentTimestampsMs: Array.isArray(parsed.recentTimestampsMs)
        ? parsed.recentTimestampsMs.filter((value): value is number => Number.isFinite(value))
        : [],
      dayKey: typeof parsed.dayKey === 'string' ? parsed.dayKey : fallbackState.dayKey,
      dayCount: Number.isFinite(parsed.dayCount) ? Math.max(0, parsed.dayCount as number) : 0,
      lastRequestAtMs: Number.isFinite(parsed.lastRequestAtMs) ? (parsed.lastRequestAtMs as number) : 0,
    };
  } catch {
    return fallbackState;
  }
}

function writeRateLimitState(state: RateLimitState) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures to avoid blocking core functionality.
  }
}

async function waitForClientRateLimitSlot(actionLabel: string) {
  const config = getRateLimitConfig();
  if (config.disabled) {
    return;
  }

  while (true) {
    const now = Date.now();
    const minuteAgo = now - 60_000;
    const state = readRateLimitState(now);
    state.recentTimestampsMs = state.recentTimestampsMs.filter((timestamp) => timestamp >= minuteAgo);

    const currentDay = getDayKey(now);
    if (state.dayKey !== currentDay) {
      state.dayKey = currentDay;
      state.dayCount = 0;
    }

    if (state.dayCount >= config.maxPerDay) {
      throw new Error(`Daily free-tier limit reached (${config.maxPerDay} requests). Try again tomorrow.`);
    }

    const intervalMs = now - state.lastRequestAtMs;
    if (state.lastRequestAtMs > 0 && intervalMs < config.minIntervalMs) {
      await sleep(config.minIntervalMs - intervalMs);
      continue;
    }

    if (state.recentTimestampsMs.length >= config.maxPerMinute) {
      const retryAfterMs = Math.max(250, state.recentTimestampsMs[0] + 60_000 - now);
      await sleep(retryAfterMs);
      continue;
    }

    state.recentTimestampsMs.push(now);
    state.dayCount += 1;
    state.lastRequestAtMs = now;
    writeRateLimitState(state);
    return;
  }
}

async function throttleClientRequest(actionLabel: string) {
  const run = async () => {
    await waitForClientRateLimitSlot(actionLabel);
  };

  const scheduled = rateLimitQueue.then(run, run);
  rateLimitQueue = scheduled.catch(() => undefined);
  await scheduled;
}

function normalizeGeminiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : 'Unknown Gemini API error.';
  const normalized = message.toLowerCase();

  if (normalized.includes('api key not valid') || normalized.includes('permission_denied') || normalized.includes('unauthorized')) {
    return new Error(
      'Gemini rejected the API key. Check that VITE_GEMINI_API_KEY is correct, enabled for Gemini API, and allowed for localhost/your domain.',
    );
  }

  if (normalized.includes('quota') || normalized.includes('rate limit') || normalized.includes('resource_exhausted')) {
    return new Error('Gemini quota/rate limit reached. Wait a bit or use a key/project with available quota.');
  }

  return error instanceof Error ? error : new Error(message);
}

function uniqueModelCandidates(configuredModel: string | undefined, defaults: string[]): string[] {
  const configured = configuredModel?.trim();
  const candidates = configured ? [configured, ...defaults] : defaults;
  return [...new Set(candidates.filter(Boolean))];
}

async function generateContentStreamWithFallback(prompt: string, models: string[]) {
  let lastError: unknown = null;

  for (const model of models) {
    try {
      return await getAiClient().models.generateContentStream({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw normalizeGeminiError(lastError);
}

async function generateContentWithFallback(prompt: string, models: string[]) {
  let lastError: unknown = null;

  for (const model of models) {
    try {
      return await getAiClient().models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw normalizeGeminiError(lastError);
}

function getAiClient(): GoogleGenAI {
  if (aiClient) {
    return aiClient;
  }

  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set VITE_GEMINI_API_KEY in .env or .env.local, then fully restart npm run dev.',
    );
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export async function generateReadmeContent(repo: RepoInfo, fileTree: string[]): Promise<string> {
  await throttleClientRequest('README generation');
  const prompt = getReadmePrompt(repo, fileTree);
  const models = uniqueModelCandidates(import.meta.env.VITE_GEMINI_MODEL, TEXT_MODEL_CANDIDATES);
  const response = await generateContentWithFallback(prompt, models);

  return response.text || '';
}

export async function* generateReadmeContentStream(
  repo: RepoInfo,
  fileTree: string[],
): AsyncGenerator<string, void, void> {
  await throttleClientRequest('README generation');
  const prompt = getReadmePrompt(repo, fileTree);
  const models = uniqueModelCandidates(import.meta.env.VITE_GEMINI_MODEL, TEXT_MODEL_CANDIDATES);
  const response = await generateContentStreamWithFallback(prompt, models);

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function* editReadmeContentStream(
  currentMarkdown: string,
  instruction: string,
): AsyncGenerator<string, void, void> {
  await throttleClientRequest('README edit');
  const prompt = `
You are an expert technical writer. You are given an existing GitHub README.md and an instruction for an edit.

Current README:
\`\`\`markdown
${currentMarkdown}
\`\`\`

Instruction: ${instruction}

Your task is to rewrite the README according to the instruction.
- Maintain a professional tone.
- Return ONLY the updated markdown content.
- Do not use IMAGE_PLACEHOLDER markers.
`;

  const models = uniqueModelCandidates(import.meta.env.VITE_GEMINI_MODEL, TEXT_MODEL_CANDIDATES);
  const response = await generateContentStreamWithFallback(prompt, models);

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

function getReadmePrompt(repo: RepoInfo, fileTree: string[]): string {
  return `
You are an expert technical writer and senior software engineer.

Your task is to generate a professional, polished, high-quality README.md for a GitHub repository only after first analyzing and understanding the repository itself.

Repository metadata:
- Name: ${repo.name}
- Full Name: ${repo.full_name}
- Description: ${repo.description || 'No description provided'}
- Primary Language: ${repo.language || 'Not specified'}
- Topics: ${repo.topics.join(', ')}
- Stars: ${repo.stargazers_count}

File Structure:
${fileTree.slice(0, 100).join('\n')}
${fileTree.length > 100 ? '... (truncated)' : ''}

Instructions:
1. Inspect the repository contents carefully.
  - Read and infer purpose from key files such as:
    - package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod, pom.xml
    - source files
    - config files
    - Dockerfiles
    - .env.example
    - existing docs
    - test files
    - frontend/backend structure
  - Determine:
    - what the project does
    - who it is for
    - its core features
    - how it is run locally
    - its main dependencies/frameworks
    - whether it is a library, CLI tool, API, web app, automation tool, etc.

2. Build the README based primarily on the repository's actual structure and code, not just metadata.
  - Do not invent features, commands, endpoints, setup steps, or technologies unless strongly supported by the repository.
  - If something is unclear, use cautious professional wording.
  - Prefer accuracy over hype.

3. Return ONLY markdown for the final README.md.

Required sections:
- Strong project title
- Brief engaging introduction
- Badges section (license, languages/technologies)
- Features
- Project Structure
- Installation or Getting Started
- Usage
- Tech Stack
- Roadmap or Future Improvements
- Contributing
- License

Style requirements:
- Use professional emojis sparingly.
- Keep it clean, modern, and easy to scan.
- Write like a real maintainer.
- Use clear headings and polished markdown.
- Avoid filler text.
- Do not mention uncertainty unless necessary.
- Do not use IMAGE_PLACEHOLDER markers.
- If license is not specified, assume MIT and state that clearly.

Additional guidance:
- If repo is incomplete or experimental, present it professionally without overstating maturity.
- If scripts or commands exist in repo, use those exact commands.
- If APIs, CLI commands, or UI flows exist, include realistic examples.
- Optional sections when supported: Demo, Configuration, API Reference, Testing, Deployment, FAQ.

Output:
Return ONLY the final markdown content of the README.
`;
}
