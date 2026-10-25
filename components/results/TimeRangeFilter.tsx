'use client';

import { Clock, RotateCcw } from 'lucide-react';
import TimePicker from '@/components/TimePicker';
import { Button } from '@/components/ui/button';
import type { TimeRange } from '@/lib/journey';
import WeekdayPicker from './WeekdayPicker';

interface TimeRangeFilterProps {
  id: string;
  label: string;
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  days: number[];
  onDaysChange: (days: number[]) => void;
}

export default function TimeRangeFilter({ id, label, value, onChange, days, onDaysChange }: TimeRangeFilterProps) {
  return (
    <div className="flex flex-row flex-wrap gap-2 w-full items-center">
      <div className="flex items-center gap-1 shrink-0">
        <Clock className="h-4 w-4" />
        <span className="font-medium" id={id}>
          {label}
        </span>
      </div>

      <div className="flex flex-row gap-2 items-center flex-none" aria-labelledby={id}>
        <TimePicker value={value.start} onChange={(start) => onChange({ ...value, start })} aria-label={`${label} alkaen`} />

        <span className="shrink-0">–</span>

        <TimePicker value={value.end} onChange={(end) => onChange({ ...value, end })} aria-label={`${label} asti`} />

        <Button size="icon" variant="outline" className="flex-none" onClick={() => onChange({ start: '00:00', end: '23:59' })}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <WeekdayPicker selected={days} onChange={onDaysChange} />
    </div>
  );
}
