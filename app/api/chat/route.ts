import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, sessionCookie } from '../../../database/store.mjs';

// Lite dicoba dulu (lebih cepat), model utama jadi cadangan.
const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

const systemInstructionText = `You are 'Lesbot', an empathetic, warm, and professional AI mental health companion for the Lestari portal.

CORE OBJECTIVES:
1. Prioritize the user's mental well-being, emotional safety, and comfort above all else. Listen actively, validate their feelings, and offer gentle, constructive support.
2. Maintain natural conversational continuity. Read the full chat history carefully so your response is contextual and directly addresses what the user shares.
3. Keep responses warm and human-like, not robotic or clinical. Adapt the length to the user's message:
   - For short or casual messages, reply in 2-4 sentences.
   - When the user shares something emotional or long, reply more fully (about 2-3 short paragraphs): reflect back what they said, validate their feelings, and offer gentle perspective or one small, practical suggestion.
   - Ask at most one gentle follow-up question.
   - Avoid long bullet lists; write in natural, flowing paragraphs.

LANGUAGE RULES:
- Detect the language of the user's LATEST message and reply in that same language.
- If the user writes in Indonesian, reply in warm, natural, casual Indonesian (aku/kamu).
- If the user writes in English, reply in natural English.
- If the user switches language mid-conversation, switch with them.
- Never mention that you are detecting or switching languages.

SAFETY RULES:
- You are a supportive companion, not a doctor or therapist. Never diagnose, and never recommend medication or dosages.
- If the user mentions wanting to die, hurting themselves, or harming others, respond with calm warmth, take them seriously, and gently encourage them to reach out right now to someone they trust or to local emergency services / a crisis hotline. Do not give any method or details about self-harm.
- Never judge, lecture, or minimize their feelings.
- For serious or ongoing problems, gently suggest talking to a psychologist or psychiatrist.`;


const unavailable = () => NextResponse.json({ error: 'Chat AI sedang tidak tersedia. Coba lagi nanti.' }, { status: 503 });
const apiKey = () => process.env.GEMINI_API_KEY?.trim();
const moods = new Set(['great', 'good', 'okay', 'not-good', 'terrible']);
type ChatMessage = { type: 'user' | 'bot'; message: string };

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const { type, message } = value as Partial<ChatMessage>;
  return (type === 'user' || type === 'bot') && typeof message === 'string' &&
    message.length <= 4000 && message.trim().length > 0;
}

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ configured: Boolean(apiKey()) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    const key = apiKey();
    if (!key) return unavailable();
    if (!await getSessionUser(req.cookies.get(sessionCookie)?.value)) {
      return NextResponse.json({ error: 'Masuk kembali untuk menggunakan chat AI.' }, { status: 401 });
    }

    const raw = await req.json().catch(() => null);
    if (raw?.adultConsent !== true) {
      return NextResponse.json({ error: 'Konfirmasi usia dan pengiriman pesan terlebih dahulu.' }, { status: 400 });
    }
    const history = raw.messagesHistory ?? raw.messages ?? raw.history;
    const recent: unknown[] = Array.isArray(history) ? history.slice(-16) : [];
    if (!recent.every(isChatMessage) || recent.at(-1)?.type !== 'user') {
      return NextResponse.json({ error: 'Kirim pesan antara 1 dan 4.000 karakter.' }, { status: 400 });
    }
    const cleanHistory = recent.slice(recent.findIndex(message => message.type === 'user'));
    const mood = typeof raw.mood === 'string' && moods.has(raw.mood) ? raw.mood : '';

    const body = {
      systemInstruction: {
        parts: [{ text: systemInstructionText + (mood ? "\n\nUser's reported mood: " + mood : '') }],
      },
      contents: cleanHistory.map(message => ({
        role: message.type === 'user' ? 'user' : 'model',
        parts: [{ text: message.message }],
      })),
      generationConfig: { maxOutputTokens: 1000, temperature: 0.8 },
    };

    for (const model of MODELS) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent';
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) {
          console.warn('Gemini request failed', model, response.status);
          if ([400, 401, 403].includes(response.status)) return unavailable();
          continue;
        }
        const result = await response.json();
        const candidate = result.candidates?.[0];
        if (result.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY') {
          return NextResponse.json({ error: 'Chat AI tidak dapat membalas pesan ini.' }, { status: 422 });
        }
        const parts: { text?: string; thought?: boolean }[] = candidate?.content?.parts ?? [];
        const answer = parts.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('').trim();
        if (answer) return NextResponse.json({ text: answer });
      } catch {
        console.warn('Gemini connection failed', model);
      }
    }
    return unavailable();
  } catch {
    console.warn('Lesbot request could not be completed');
    return unavailable();
  }
}
