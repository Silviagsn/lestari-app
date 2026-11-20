'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Mic, X } from 'lucide-react';
import MentalHealth from './MentalHealth';
import SpeechToText from './SpeechToText';

export type FloatingTool = 'mental-health' | 'speech-to-text';

const tools = [
  { id: 'mental-health', title: 'Chat Lesbot', icon: Bot, color: 'from-violet-700 to-indigo-700' },
  { id: 'speech-to-text', title: 'Bantu Komunikasi', icon: Mic, color: 'from-blue-700 to-indigo-700' },
] as const;

export default function FloatingTools({ active, onChange }: {
  active: FloatingTool | null;
  onChange: (tool: FloatingTool | null) => void;
}) {
  const [opened, setOpened] = useState<Partial<Record<FloatingTool, boolean>>>({});
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active) return;
    setOpened(previous => previous[active] ? previous : { ...previous, [active]: true });
    root.current?.querySelector<HTMLButtonElement>(`#floating-${active} button`)?.focus();
  }, [active]);

  function close(tool: FloatingTool) {
    onChange(null);
    root.current?.querySelector<HTMLButtonElement>(`#launch-${tool}`)?.focus();
  }

  return (
    <aside aria-label="Alat bantu Lestari" ref={root} className="pointer-events-none fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:bottom-5">
      {tools.map(({ id, title, icon: Icon, color }) => (
        <section key={id} id={`floating-${id}`} role="region" aria-labelledby={`title-${id}`} hidden={active !== id}
          onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(id); } }}
          className="pointer-events-auto w-full max-w-[24rem] overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xl">
          <header className={`flex items-center gap-2 bg-gradient-to-r ${color} px-3 py-2 text-white`}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h2 id={`title-${id}`} className="flex-1 text-sm font-bold">{title}</h2>
            <button type="button" onClick={() => close(id)} aria-label={`Tutup ${title}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div className="max-h-[min(62dvh,30rem)] overflow-y-auto overscroll-contain">
            {(active === id || opened[id]) && (id === 'mental-health' ? <MentalHealth active={active === id} /> : <SpeechToText active={active === id} />)}
          </div>
        </section>
      ))}
      <div className="flex max-w-full flex-wrap justify-end gap-2">
        {tools.map(({ id, title, color, icon: Icon }) => (
          <button key={id} type="button" id={`launch-${id}`} aria-controls={`floating-${id}`} aria-expanded={active === id}
            onClick={() => active === id ? close(id) : onChange(id)}
            className={`pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gradient-to-r ${color} px-3 py-2 text-xs font-bold text-white shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 sm:gap-2 sm:px-4 sm:text-sm`}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{title}
          </button>
        ))}
      </div>
    </aside>
  );
}
