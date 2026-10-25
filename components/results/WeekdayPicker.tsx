'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { allWeekdays, weekdays } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface WeekdayPickerProps {
  selected: number[];
  onChange: (days: number[]) => void;
}

export default function WeekdayPicker({ selected, onChange }: WeekdayPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">{selected.length === 7 ? 'Kaikki viikonpäivät' : `${selected.length} viikonpäivä${selected.length !== 1 ? 'ä' : ''}`}</Button>
      </PopoverTrigger>

      <PopoverContent className="flex flex-col gap-3">
        <div className="flex flex-row gap-2 flex-wrap">
          {weekdays.map((day) => {
            const isSelected = selected.includes(day.value);

            return (
              <Button
                key={day.value}
                type="button"
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                className={cn('transition', isSelected && 'bg-primary text-primary-foreground')}
                onClick={() => onChange(selected.includes(day.value) ? selected.filter((d) => d !== day.value) : [...selected, day.value].sort((a, b) => a - b))}
              >
                {day.label}
              </Button>
            );
          })}
        </div>
        <div className="flex flex-row gap-2">
          <Button onClick={() => onChange(allWeekdays)}>Valitse kaikki</Button>
          <Button variant="outline" onClick={() => onChange([])}>
            Poista valinnat
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
