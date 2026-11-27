'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function SidebarAccount({ summary, children, className, inHeader = false, onOpenChange }: {
  summary: ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  inHeader?: boolean;
  onOpenChange?: (open: boolean) => void;
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

  const Arrow = inHeader ? ChevronDown : ChevronsUpDown;
  return <details ref={disclosure} className={`relative ${className ?? ''}`}
    onToggle={event => onOpenChange?.(event.currentTarget.open)}
    onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) dismiss();
    }}
    onKeyDown={event => {
      if (event.key !== 'Escape' || !event.currentTarget.open) return;
      event.stopPropagation();
      closeAndFocus();
    }}>
    <summary ref={trigger} className={`flex cursor-pointer list-none items-center border border-indigo-100 text-indigo-950 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 [&::-webkit-details-marker]:hidden ${inHeader ? 'min-h-11 gap-1 rounded-full bg-white px-1.5 sm:gap-2 sm:pl-2 sm:pr-3' : 'min-h-12 gap-2.5 rounded-2xl bg-indigo-50/75 px-3 py-2'}`}>
      {summary}
      <Arrow aria-hidden="true" className={`ml-auto shrink-0 text-indigo-700 ${inHeader ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-4 w-4'}`} />
    </summary>
    <div className={`absolute top-full z-40 mt-2 rounded-2xl border border-indigo-100 bg-white p-1.5 shadow-lg shadow-indigo-950/10 ${inHeader ? 'right-0 w-60 max-w-[calc(100vw-1rem)]' : 'inset-x-0 lg:bottom-full lg:top-auto lg:mb-2 lg:mt-0'}`}>
      {children(closeAndFocus)}
    </div>
  </details>;
}
