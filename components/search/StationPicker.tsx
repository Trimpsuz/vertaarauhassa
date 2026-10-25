'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Loader2Icon, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Station } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StationPickerProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  placeholder: string;
  stations: Station[];
  loading: boolean;
  disabled: boolean;
  getStationName: (code: string) => string;
  onSelect: (code: string) => void;
}

export default function StationPicker({ id, label, icon: Icon, value, placeholder, stations, loading, disabled, getStationName, onSelect }: StationPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2" id={id}>
        <Icon className="h-4 w-4" />
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-labelledby={id} aria-expanded={open} disabled={disabled} className="w-full justify-between bg-transparent">
            {loading ? (
              <div className="flex gap-1 items-center">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Ladataan asemia...
              </div>
            ) : (
              <>
                {value ? getStationName(value) : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:min-w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Hae..." />
            <CommandList>
              <CommandEmpty>Asemia ei lötynyt.</CommandEmpty>
              <CommandGroup>
                {stations.map((station) => (
                  <CommandItem
                    key={station.code}
                    value={station.name}
                    onSelect={() => {
                      onSelect(station.code);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === station.code ? 'opacity-100' : 'opacity-0')} />
                    {station.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
