'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const SIZE = 240;
const CENTER = SIZE / 2;
const OUTER_RADIUS = 96;
const INNER_RADIUS = 62;
// Pointer closer to the center than this picks from the inner (13-00) hour ring
const RING_SPLIT = (OUTER_RADIUS + INNER_RADIUS) / 2;

const pad = (n: number) => n.toString().padStart(2, '0');

const parse = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
};

const position = (step: number, steps: number, radius: number) => {
  const angle = (step / steps) * 2 * Math.PI;
  return { x: CENTER + radius * Math.sin(angle), y: CENTER - radius * Math.cos(angle) };
};

const isInnerHour = (hour: number) => hour === 0 || hour > 12;

type Mode = 'hour' | 'minute';

export default function TimePicker({ value, onChange, ...props }: { value: string; onChange: (value: string) => void; 'aria-label'?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('hour');
  const [draft, setDraft] = useState<Partial<Record<Mode, string>>>({});
  const minuteInput = useRef<HTMLInputElement>(null);
  const { hour, minute } = parse(value);

  const set = (h: number, m: number) => onChange(`${pad(h)}:${pad(m)}`);

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width) * SIZE - CENTER;
    const dy = ((e.clientY - rect.top) / rect.height) * SIZE - CENTER;
    const angle = (Math.atan2(dx, -dy) + 2 * Math.PI) % (2 * Math.PI);

    if (mode === 'hour') {
      const step = Math.round((angle / (2 * Math.PI)) * 12) % 12;
      const inner = Math.hypot(dx, dy) < RING_SPLIT;
      set(inner ? (step === 0 ? 0 : step + 12) : step === 0 ? 12 : step, minute);
    } else {
      set(hour, Math.round((angle / (2 * Math.PI)) * 60) % 60);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (delta) {
      e.preventDefault();
      if (mode === 'hour') set((hour + delta + 24) % 24, minute);
      else set(hour, (minute + delta + 60) % 60);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (mode === 'hour') setMode('minute');
      else setOpen(false);
    }
  };

  const commit = (field: Mode, text: string) => {
    const n = Number(text);
    if (text === '' || n > (field === 'hour' ? 23 : 59)) return false;
    if (field === 'hour') set(n, minute);
    else set(hour, n);
    return true;
  };

  const handleType = (field: Mode, raw: string) => {
    const text = raw.replace(/\D/g, '').slice(0, 2);
    // Two digits, or a single hour digit that can't start a valid hour like 3-9, is a complete entry
    const complete = text.length === 2 || (field === 'hour' && Number(text) > 2) || (field === 'minute' && Number(text) > 5);
    if (complete && commit(field, text)) {
      setDraft((d) => ({ ...d, [field]: undefined }));
      if (field === 'hour') minuteInput.current?.focus();
    } else {
      setDraft((d) => ({ ...d, [field]: text }));
    }
  };

  // Reads the input itself since the draft state can be a render behind when focus jumps from hour to minute
  const handleBlur = (field: Mode, text: string) => {
    if (draft[field] !== undefined) commit(field, text.replace(/\D/g, '').slice(0, 2));
    setDraft((d) => ({ ...d, [field]: undefined }));
  };

  const hand = mode === 'hour' ? position(hour % 12, 12, isInnerHour(hour) ? INNER_RADIUS : OUTER_RADIUS) : position(minute, 60, OUTER_RADIUS);

  const labels =
    mode === 'hour'
      ? Array.from({ length: 24 }, (_, h) => ({
          key: h,
          text: h === 0 ? '00' : h.toString(),
          inner: isInnerHour(h),
          selected: h === hour,
          ...position(h % 12, 12, isInnerHour(h) ? INNER_RADIUS : OUTER_RADIUS),
        }))
      : Array.from({ length: 12 }, (_, i) => ({
          key: i,
          text: pad(i * 5),
          inner: false,
          selected: i * 5 === minute,
          ...position(i * 5, 60, OUTER_RADIUS),
        }));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setMode('hour');
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="font-normal tabular-nums" aria-label={props['aria-label']}>
          {value}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto flex flex-col items-center gap-3">
        <div className="flex items-center gap-1 text-3xl tabular-nums">
          {(['hour', 'minute'] as const).map((m, i) => (
            <span key={m} className="contents">
              {i === 1 && <span>:</span>}
              <input
                ref={m === 'minute' ? minuteInput : undefined}
                inputMode="numeric"
                aria-label={m === 'hour' ? 'Tunnit' : 'Minuutit'}
                value={draft[m] ?? pad(m === 'hour' ? hour : minute)}
                onFocus={(e) => {
                  setMode(m);
                  e.target.select();
                }}
                onChange={(e) => handleType(m, e.target.value)}
                onBlur={(e) => handleBlur(m, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  handleBlur(m, e.currentTarget.value);
                  if (m === 'hour') minuteInput.current?.focus();
                  else setOpen(false);
                }}
                className={cn(
                  'w-[2.5ch] box-content rounded-md px-2 py-1 text-center cursor-text transition outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  mode === m ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-accent'
                )}
              />
            </span>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          tabIndex={0}
          role="slider"
          aria-label={mode === 'hour' ? 'Tunnit' : 'Minuutit'}
          aria-valuemin={0}
          aria-valuemax={mode === 'hour' ? 23 : 59}
          aria-valuenow={mode === 'hour' ? hour : minute}
          aria-valuetext={value}
          className="touch-none select-none cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onKeyDown={handleKeyDown}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pick(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons) pick(e);
          }}
          onPointerUp={() => {
            if (mode === 'hour') setMode('minute');
            else setOpen(false);
          }}
        >
          <circle cx={CENTER} cy={CENTER} r={CENTER} className="fill-muted" />
          <line x1={CENTER} y1={CENTER} x2={hand.x} y2={hand.y} strokeWidth={2} className="stroke-primary" />
          <circle cx={CENTER} cy={CENTER} r={3} className="fill-primary" />
          <circle cx={hand.x} cy={hand.y} r={16} className="fill-primary" />
          {labels.map((l) => (
            <text
              key={l.key}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={cn('pointer-events-none', l.inner ? 'text-xs' : 'text-sm', l.selected ? 'fill-primary-foreground' : l.inner ? 'fill-muted-foreground' : 'fill-foreground')}
            >
              {l.text}
            </text>
          ))}
        </svg>
      </PopoverContent>
    </Popover>
  );
}
