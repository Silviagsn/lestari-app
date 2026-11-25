'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronsUpDown } from 'lucide-react';

export default function SidebarAccount({ summary, children, className }: {
  summary: ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);

  function dismiss() {
    if (disclosure.current) disclosure.current.open = false;
  }

  function closeAndFocus() {
    dismiss();
    trigger.current?.focus();
  }

  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !disclosure.current?.contains(event.target)) dismiss();
    }
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, []);

  return <details ref={disclosure} className={`relative ${className ?? ''}`}
    onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) dismiss();
    }}
    onKeyDown={event => {
      if (event.key !== 'Escape' || !event.currentTarget.open) return;
      event.stopPropagation();
      closeAndFocus();
    }}>
    <summary ref={trigger} className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/75 px-3 py-2 text-indigo-950 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 [&::-webkit-details-marker]:hidden">
      {summary}
      <ChevronsUpDown aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-indigo-700" />
    </summary>
    <div className="absolute inset-x-0 top-full z-40 mt-2 rounded-2xl border border-indigo-100 bg-white p-1.5 shadow-lg shadow-indigo-950/10 lg:bottom-full lg:top-auto lg:mb-2 lg:mt-0">
      {children(closeAndFocus)}
    </div>
  </details>;
}
