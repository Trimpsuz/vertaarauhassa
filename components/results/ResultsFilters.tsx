'use client';

import { ArrowUpDown, ChevronDown, Shuffle, TrainFront } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { JourneyFilters } from '@/hooks/useJourneyFilters';
import { sortOptions, trainTypeOptions, transferOptions, type TrainTypeKey, type TrainTypeFilters } from '@/lib/journey';
import DurationFilter from './DurationFilter';
import TimeRangeFilter from './TimeRangeFilter';

interface TransfersFilterProps {
  value: string;
  onChange: (value: string) => void;
}

function TransfersFilter({ value, onChange }: TransfersFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-1">
        <Shuffle className="h-4 w-4" />
        <span className="font-medium" id="transfers-label">
          Vaihdot
        </span>
      </div>
      <RadioGroup className="flex flex-wrap sm:flex-nowrap gap-2" value={value} onValueChange={onChange} defaultValue="any" aria-labelledby="transfers-label">
        {transferOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-1">
            <RadioGroupItem className="cursor-pointer" value={option.value} id={`option-${option.value}`} />
            <Label className="cursor-pointer" htmlFor={`option-${option.value}`}>
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

interface TrainTypesFilterProps {
  value: TrainTypeFilters;
  onChange: (type: TrainTypeKey, allowed: boolean) => void;
}

function TrainTypesFilter({ value, onChange }: TrainTypesFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-1">
        <TrainFront className="h-4 w-4" />
        <span className="font-medium" id="train-types-label">
          Junatyypit
        </span>
      </div>
      <div className="flex flex-wrap sm:flex-nowrap gap-2" aria-labelledby="train-types-label">
        {trainTypeOptions.map((option) => (
          <div key={option.key} className="flex items-center space-x-1">
            <Switch className="cursor-pointer" checked={value[option.key]} onCheckedChange={(checked) => onChange(option.key, checked)} aria-labelledby={option.labelId} />
            <Label id={option.labelId}>{option.label}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SortAndVisibilityProps {
  sort: JourneyFilters['sort'];
  onSortChange: (value: JourneyFilters['sort']) => void;
  reverse: boolean;
  onReverseChange: (value: boolean) => void;
  hideSoldOut: boolean;
  onHideSoldOutChange: (value: boolean) => void;
}

function SortAndVisibility({ sort, onSortChange, reverse, onReverseChange, hideSoldOut, onHideSoldOutChange }: SortAndVisibilityProps) {
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
      <div className="flex flex-row gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Lajittele: {sortLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {sortOptions.map((option) => (
              <DropdownMenuItem key={option.value} onClick={() => onSortChange(option.value)} className={`cursor-pointer ${sort === option.value ? 'bg-muted' : ''}`}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant={reverse ? 'default' : 'outline'} size="icon" onClick={() => onReverseChange(!reverse)} aria-label="Vaihda järjestys">
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center space-x-1">
        <Switch className="cursor-pointer" checked={hideSoldOut} onCheckedChange={onHideSoldOutChange} aria-labelledby="sold-out-label" />
        <Label id="sold-out-label">Piilota loppuunmyydyt</Label>
      </div>
    </div>
  );
}

export default function ResultsFilters({ filters }: { filters: JourneyFilters }) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md sm:max-w-xl lg:max-w-4xl">
      <TransfersFilter value={filters.changeCount} onChange={filters.setChangeCount} />
      <TrainTypesFilter value={filters.trainTypes} onChange={filters.setTrainType} />
      <TimeRangeFilter
        id="departure-time-label"
        label="Lähtöaika"
        value={filters.departureTime}
        onChange={filters.setDepartureTime}
        days={filters.allowedDepartureDays}
        onDaysChange={filters.setAllowedDepartureDays}
      />
      <TimeRangeFilter
        id="arrival-time-label"
        label="Saapumisaika"
        value={filters.arrivalTime}
        onChange={filters.setArrivalTime}
        days={filters.allowedArrivalDays}
        onDaysChange={filters.setAllowedArrivalDays}
      />
      <DurationFilter bounds={filters.durationBounds} sliderBounds={filters.sliderBounds} value={filters.durationRange} onChange={filters.setDurationRange} />
      <SortAndVisibility
        sort={filters.sort}
        onSortChange={filters.setSort}
        reverse={filters.reverse}
        onReverseChange={filters.setReverse}
        hideSoldOut={filters.hideSoldOut}
        onHideSoldOutChange={filters.setHideSoldOut}
      />
    </div>
  );
}
