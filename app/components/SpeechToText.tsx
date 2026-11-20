'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Download, Mic, Pause, Play, Square, Trash2 } from 'lucide-react';

type TranscriptionSession = {
  id: string;
  text: string;
  timestamp: string;
  duration: number;
  language: string;
  confidence: number;
};

type RecognitionResult = { isFinal: boolean; 0: { transcript: string; confidence: number } };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const languages = [
  ['id-ID', 'Bahasa Indonesia'], ['en-US', 'Inggris (AS)'], ['en-GB', 'Inggris (UK)'],
  ['es-ES', 'Spanyol'], ['fr-FR', 'Prancis'], ['de-DE', 'Jerman'],
  ['ja-JP', 'Jepang'], ['ko-KR', 'Korea'], ['zh-CN', 'Mandarin'],
];
const storageKey = 'speechSessions';
const control = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-45';

function readSessions(): TranscriptionSession[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(saved) ? saved.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: TranscriptionSession[]) {
  try { localStorage.setItem(storageKey, JSON.stringify(sessions.slice(0, 10))); } catch {}
}

function duration(session: TranscriptionSession, started: number | null) {
  return session.duration + (started === null ? 0 : Math.floor((Date.now() - started) / 1000));
}

function formatTime(seconds: number) {
  return [Math.floor(seconds / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
}

export default function SpeechToText({ active }: { active: boolean }) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [supported, setSupported] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<TranscriptionSession[]>([]);
  const [language, setLanguage] = useState('id-ID');
  const [transcript, setTranscript] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [saveHistory, setSaveHistory] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const recognizer = useRef<Recognition | null>(null);
  const current = useRef<TranscriptionSession | null>(null);
  const started = useRef<number | null>(null);

  const disconnect = useCallback(() => {
    const recognition = recognizer.current;
    recognizer.current = null;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    }
  }, []);

  const stop = useCallback(() => {
    const session = current.current;
    current.current = null;
    disconnect();
    if (session?.text.trim()) {
      const complete = { ...session, duration: duration(session, started.current), text: session.text.trim() };
      setSessions(previous => [complete, ...previous].slice(0, 10));
      if (saveHistory) writeSessions([complete, ...readSessions()]);
    }
    started.current = null;
    setMode('idle');
  }, [disconnect, saveHistory]);

  useEffect(() => {
    const browser = window as RecognitionWindow;
    setSupported(Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition));
    setSessions(readSessions());
    return disconnect;
  }, [disconnect]);

  useEffect(() => {
    if (!active && mode !== 'idle') stop();
  }, [active, mode, stop]);

  useEffect(() => {
    if (mode !== 'recording') return;
    const timer = window.setInterval(() => {
      if (current.current) setElapsed(duration(current.current, started.current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  function listen(resume: boolean) {
    const browser = window as RecognitionWindow;
    const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!active || !Recognition || recognizer.current) return;
    setError('');
    setNotice('');
    const session = resume ? current.current : {
      id: crypto.randomUUID(), text: '', timestamp: new Date().toISOString(), duration: 0, language, confidence: 0,
    };
    if (!session) return;
    const previousText = session.text.trim();
    const recognition = new Recognition();
    recognizer.current = recognition;
    current.current = session;
    recognition.lang = session.language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = event => {
      const results = Array.from(event.results);
      const words = results.map(result => result[0].transcript.trim()).filter(Boolean).join(' ');
      session.text = [previousText, words].filter(Boolean).join(' ');
      const final = results.filter(result => result.isFinal).at(-1);
      if (final) session.confidence = Math.round(final[0].confidence * 100);
      setTranscript(session.text);
    };
    recognition.onerror = event => {
      setError(event.error === 'no-speech' ? 'Suara belum terdeteksi. Coba lagi lebih dekat ke mikrofon.'
        : 'Pengenalan suara gagal. Cek izin mikrofon dan koneksi, lalu coba lagi.');
      stop();
    };
    recognition.onend = stop;
    try {
      recognition.start();
      started.current = Date.now();
      if (!resume) {
        setTranscript('');
        setElapsed(0);
      }
      setMode('recording');
    } catch {
      setError('Mikrofon belum bisa dimulai. Cek izin mikrofon dan coba lagi.');
      stop();
    }
  }

  function pause() {
    if (!current.current) return;
    current.current.duration = duration(current.current, started.current);
    setElapsed(current.current.duration);
    started.current = null;
    disconnect();
    setMode('paused');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(transcript);
      setNotice('Teks disalin.');
    } catch {
      setError('Teks belum bisa disalin otomatis. Kamu bisa menyeleksi teksnya.');
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([transcript], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transkripsi-lestari.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (supported === false) {
    return <p role="status" className="p-4 text-sm text-slate-700">Browser ini belum mendukung pengenalan suara. Coba buka Lestari di browser yang mendukungnya, seperti Chrome.</p>;
  }

  return (
    <div className="space-y-3 p-3 text-sm text-slate-800 sm:p-4">
      <p className="text-xs text-slate-600">Ucapan ditampilkan sebagai teks dalam bahasa yang dipilih.</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold">
          Bahasa ucapan
          <select value={language} onChange={event => setLanguage(event.target.value)} disabled={mode !== 'idle'}
            className="min-h-10 min-w-0 rounded-lg border border-indigo-200 bg-white px-2 text-sm disabled:opacity-60">
            {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        {mode === 'idle' ? (
          <button type="button" disabled={!supported} onClick={() => listen(false)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-indigo-700 px-3 text-xs font-bold text-white hover:bg-indigo-800 disabled:opacity-60">
            <Mic aria-hidden="true" className="h-4 w-4" /> Mulai rekam
          </button>
        ) : (
          <div className="flex gap-1">
            <button type="button" className={control} onClick={mode === 'paused' ? () => listen(true) : pause}>
              {mode === 'paused' ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
              {mode === 'paused' ? 'Lanjutkan' : 'Jeda'}
            </button>
            <button type="button" className={control} onClick={stop}><Square aria-hidden="true" className="h-4 w-4" /> Selesai</button>
          </div>
        )}
      </div>
      {mode !== 'idle' && <p role="status" className="text-xs font-semibold text-indigo-900">{mode === 'paused' ? 'Dijeda' : 'Mendengarkan'} · <span className="font-mono">{formatTime(elapsed)}</span></p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-2 text-xs text-rose-900">{error}</p>}
      <section aria-label="Hasil transkripsi" className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
        <h3 className="mb-1 font-semibold">Hasil transkripsi</h3>
        <p className="min-h-20 whitespace-pre-wrap [overflow-wrap:anywhere]">{transcript || 'Teks akan muncul saat kamu berbicara.'}</p>
      </section>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!transcript} onClick={copy} className={control}><Copy aria-hidden="true" className="h-4 w-4" /> Salin</button>
        <button type="button" disabled={!transcript} onClick={download} className={control}><Download aria-hidden="true" className="h-4 w-4" /> Unduh</button>
        <button type="button" disabled={!transcript || mode !== 'idle'} onClick={() => { setTranscript(''); setNotice(''); }} className={control}><Trash2 aria-hidden="true" className="h-4 w-4" /> Bersihkan</button>
      </div>
      {notice && <p role="status" className="text-xs text-indigo-900">{notice}</p>}
      <details className="rounded-xl border border-indigo-100 px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-indigo-900">Riwayat dan pengaturan</summary>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={saveHistory} disabled={mode !== 'idle'} onChange={event => setSaveHistory(event.target.checked)} />
          Simpan riwayat di browser ini
        </label>
        <ul className="mt-2 divide-y divide-indigo-100">
          {sessions.map(session => (
            <li key={session.id} className="flex items-center gap-2 py-2">
              <button type="button" disabled={mode !== 'idle'} className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-indigo-900 hover:underline disabled:opacity-60"
                onClick={() => { setTranscript(session.text); setLanguage(session.language); }}>
                {session.text}
              </button>
              <button type="button" aria-label="Hapus transkripsi dari riwayat" className={control}
                onClick={() => { setSessions(previous => previous.filter(item => item.id !== session.id)); writeSessions(readSessions().filter(item => item.id !== session.id)); }}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
